import { Resend } from "resend";
import { decrypt } from "../lib/crypto.js";
import { MailTransport, SenderIdentity } from "../models/mailTransport.model.js";
import { templateRepo } from "../repositories/template.repo.js";
import type {
  CreateTemplateBody,
  PublishTemplateBody,
  SaveDraftBody,
  TestSendBody,
} from "../schemas/template.schema.js";
import { ApiError } from "../utils/apiError.js";
import { compileTemplate } from "./render/compile.js";

export async function listTemplates(orgId: string) {
  return templateRepo.list(orgId);
}

export async function createTemplate(orgId: string, input: CreateTemplateBody) {
  const draft = input.draft || {
    subject: input.subject || "",
    previewText: input.previewText || "",
    page: input.page || {
      bg: "#ffffff",
      width: 600,
      text: "#1c1917",
      align: "left",
    },
    blocks: input.blocks || [],
  };

  const created = await templateRepo.create(orgId, {
    name: input.name,
    draft,
  });

  return created;
}

export async function getTemplate(orgId: string, id: string) {
  const template = await templateRepo.findWithVersions(orgId, id);
  if (!template) {
    throw new ApiError(404, "Template not found");
  }
  return template;
}

export async function saveDraft(orgId: string, id: string, input: SaveDraftBody) {
  const existing = await templateRepo.findById(orgId, id);
  if (!existing) {
    throw new ApiError(404, "Template not found");
  }

  const currentDraft = existing.draft || {};
  const incomingDraft = input.draft || {};

  const mergedDraft = {
    subject: input.subject ?? incomingDraft.subject ?? currentDraft.subject ?? "",
    previewText: input.previewText ?? incomingDraft.previewText ?? currentDraft.previewText ?? "",
    page: {
      ...(currentDraft.page || {}),
      ...(incomingDraft.page || {}),
      ...(input.page || {}),
    },
    blocks: input.blocks ?? incomingDraft.blocks ?? currentDraft.blocks ?? [],
  };

  const updated = await templateRepo.updateDraft(orgId, id, {
    name: input.name,
    draft: mergedDraft,
  });

  if (!updated) {
    throw new ApiError(404, "Template not found");
  }

  return updated;
}

export async function publishTemplate(orgId: string, id: string, input?: PublishTemplateBody) {
  const existing = await templateRepo.findById(orgId, id);
  if (!existing) {
    throw new ApiError(404, "Template not found");
  }

  const draft = existing.draft || {};
  const subject = input?.subject || draft.subject;
  if (!subject) {
    throw new ApiError(400, "Subject is required to publish a template");
  }

  const blocks = draft.blocks || [];
  if (!blocks.length) {
    throw new ApiError(400, "Cannot publish an empty template. Add at least one block.");
  }

  const previewText = input?.previewText || draft.previewText;

  // Compile to responsive email HTML, plain text, and extract all merge variables
  const { html, text, variables } = compileTemplate({
    subject,
    previewText,
    page: draft.page,
    blocks,
  });

  const result = await templateRepo.publishVersion(orgId, id, {
    subject,
    previewText,
    blocks,
    html,
    text,
    variables,
  });

  if (!result) {
    throw new ApiError(500, "Failed to publish template version");
  }

  return result;
}

export async function previewTemplate(
  orgId: string,
  id: string,
  sampleData: Record<string, unknown> = {},
) {
  const template = await templateRepo.findById(orgId, id);
  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  const draft = template.draft || {};
  const blocks = draft.blocks || [];

  const { html, text, variables } = compileTemplate({
    subject: draft.subject || "Preview",
    previewText: draft.previewText,
    page: draft.page,
    blocks,
    sampleData,
  });

  return { html, text, variables };
}

export async function testSendTemplate(
  orgId: string,
  id: string,
  input: TestSendBody,
  fallbackUserEmail?: string,
) {
  const to = input.to || fallbackUserEmail;
  if (!to) {
    throw new ApiError(400, "Recipient email is required for test send");
  }

  const template = await templateRepo.findById(orgId, id);
  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  const draft = template.draft || {};
  const subject = draft.subject || `${template.name} [Test Send]`;
  const blocks = draft.blocks || [];

  if (!blocks.length) {
    throw new ApiError(400, "Cannot send an empty template. Add blocks to the draft first.");
  }

  // 1. Resolve sender identity
  let sender;
  if (input.senderIdentityId) {
    sender = await SenderIdentity.findOne({
      _id: input.senderIdentityId,
      organizationId: orgId,
    });
    if (!sender) throw new ApiError(404, "Selected sender identity not found");
  } else {
    sender = await SenderIdentity.findOne({ organizationId: orgId }).sort({ isDefault: -1 });
    if (!sender) {
      throw new ApiError(
        400,
        "No sender identity configured for this organization. Please set up a sender in Settings first.",
      );
    }
  }

  // 2. Resolve mail transport with credentials
  const transport = await MailTransport.findOne({
    _id: sender.transportId,
    organizationId: orgId,
  }).select("+credentialsEncrypted");

  if (!transport) {
    throw new ApiError(404, "Mail transport configured for this sender was not found");
  }

  // 3. Compile template with sample data
  const { html, text } = compileTemplate({
    subject,
    previewText: draft.previewText,
    page: draft.page,
    blocks,
    sampleData: input.sampleData,
  });

  // 4. Send email via Resend
  if (transport.type === "RESEND") {
    let apiKey: string;
    try {
      apiKey = decrypt(transport.credentialsEncrypted);
    } catch {
      throw new ApiError(500, "Failed to decrypt transport credentials");
    }

    const resend = new Resend(apiKey);
    const fromAddress = `${sender.displayName} <${sender.fromEmail}>`;

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html,
      text,
      replyTo: sender.replyTo || undefined,
    });

    if (error) {
      throw new ApiError(502, `Resend rejected test send: ${error.message}`);
    }

    return {
      success: true,
      messageId: data?.id,
      to,
      from: fromAddress,
      subject,
    };
  }

  throw new ApiError(
    400,
    `Transport type ${transport.type} is not yet supported for direct test send.`,
  );
}
