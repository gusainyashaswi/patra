import { finishCampaign } from "./campaign-lifecycle.js";
import mongoose, { Types } from "mongoose";
import { Campaign, CampaignRecipient } from "../models/campaign.model.js";
import { TemplateVersion } from "../models/template.model.js";
import { SenderIdentity, Domain, MailTransport } from "../models/mailTransport.model.js";
import { Contact, List, Suppression } from "../models/audience.model.js";
import { getSendQueue } from "../queue/send.queue.js";
import { ApiError } from "../utils/apiError.js";

export async function startSend(
  organizationId: string,
  campaignId: string,
): Promise<{
  campaignId: string;
  totalRecipients: number;
  queuedCount: number;
  skippedCount: number;
}> {
  const orgOid = new Types.ObjectId(organizationId);
  const campaignOid = new Types.ObjectId(campaignId);

  // 1. Check if campaign exists in this organization
  const existingCampaign = await Campaign.findOne({
    _id: campaignOid,
    organizationId: orgOid,
  });

  if (!existingCampaign) {
    throw new ApiError(404, "Campaign not found");
  }

  if (existingCampaign.status !== "DRAFT") {
    throw new ApiError(409, "Campaign has already been queued");
  }
  const lockedCampaign = existingCampaign;
  const [list, senderIdentity, templateVersion] = await Promise.all([
    List.findOne({ _id: existingCampaign.listId, organizationId: orgOid }),
    SenderIdentity.findOne({ _id: existingCampaign.senderIdentityId, organizationId: orgOid }),
    TemplateVersion.findOne({ _id: existingCampaign.templateVersionId, organizationId: orgOid }),
  ]);
  if (!list) throw new ApiError(404, "Campaign audience list not found");
  if (!senderIdentity) throw new ApiError(404, "Campaign sender identity not found");
  if (!templateVersion) throw new ApiError(404, "Campaign template version not found");
  const domain = await Domain.findOne({ _id: senderIdentity.domainId, organizationId: orgOid });
  if (!domain?.verified || domain.name !== senderIdentity.fromEmail.split("@").at(-1)) {
    throw new ApiError(400, "Sender domain must be verified before sending");
  }
  const transportId = domain.transportId.toString();
  const transport = await MailTransport.findOne({ _id: transportId, organizationId: orgOid, status: "VERIFIED" });
  if (!transport || transport.type !== "RESEND") {
    throw new ApiError(400, "A verified Resend transport is required");
  }

  // 4. Load contacts and suppressions
  const [suppressedEmailsList, contacts] = await Promise.all([
    Suppression.distinct("email", { organizationId: orgOid }),
    Contact.find({ _id: { $in: list.contactIds }, organizationId: orgOid }),
  ]);

  const suppressedSet = new Set(
    suppressedEmailsList.map((e: string) => e.toLowerCase().trim()),
  );

  // Filter out suppressed contacts
  const activeContacts = contacts.filter(
    (c) => !suppressedSet.has(c.email.toLowerCase().trim()),
  );

  // 5. Prepare recipient documents
  const requiredVariables = templateVersion.variables || [];
  const recipientDocs = activeContacts.map((c) => {
    let customFields: Record<string, unknown> = {};
    if (c.customFields) {
      customFields =
        c.customFields instanceof Map
          ? Object.fromEntries(c.customFields)
          : (c.customFields as Record<string, unknown>);
    }

    const contactData: Record<string, unknown> = {
      name: c.name || "",
      email: c.email,
      ...customFields,
    };

    const missingVariables = requiredVariables.filter((v) => {
      const val = contactData[v];
      return val === undefined || val === null || val === "";
    });

    return {
      organizationId: orgOid,
      campaignId: campaignOid,
      contactId: c._id,
      mergeData: contactData,
      senderSnapshot: { displayName: senderIdentity.displayName, fromEmail: senderIdentity.fromEmail, replyTo: senderIdentity.replyTo },
      email: c.email.toLowerCase().trim(),
      status: missingVariables.length > 0 ? ("SKIPPED" as const) : ("QUEUED" as const),
      error:
        missingVariables.length > 0
          ? `Missing required variables: ${missingVariables.join(", ")}`
          : undefined,
    };
  });

  // Commit the send gate and recipients together. Redis dispatch can be recovered
  // from these committed recipients if it fails or the process exits afterwards.
  let allRecipients: { _id: Types.ObjectId; status: string }[] = [];
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const locked = await Campaign.findOneAndUpdate(
        { _id: campaignOid, organizationId: orgOid, status: "DRAFT" },
        { $set: { status: "QUEUED", startedAt: new Date(), "counters.totalRecipients": recipientDocs.length } },
        { session },
      );
      if (!locked) throw new ApiError(409, "Campaign has already been queued");
      allRecipients = recipientDocs.length
        ? await CampaignRecipient.insertMany(recipientDocs, { session })
        : [];
    });
  } finally {
    await session.endSession();
  }
  const totalRecipients = allRecipients.length;

  // 8. Rule 5: One BullMQ job per recipient, jobId = recipientId
  const queuedRecipients = allRecipients.filter((r) => r.status === "QUEUED");
  const queue = getSendQueue(transportId);

  const jobs = queuedRecipients.map((r) => ({
    name: "sendEmail",
    data: {
      campaignId: campaignId,
      recipientId: r._id.toString(),
      organizationId: organizationId,
    },
    opts: {
      jobId: r._id.toString(),
    },
  }));

  if (jobs.length > 0) {
    try {
      await queue.addBulk(jobs);
    } catch (error) {
      // The persisted QUEUED recipients are the recovery source of truth.
      console.error("Queue dispatch deferred to reconciliation", campaignId, error instanceof Error ? error.message : "Redis failure");
    }
  }

  await finishCampaign(organizationId, campaignId);
  return {
    campaignId,
    totalRecipients,
    queuedCount: jobs.length,
    skippedCount: totalRecipients - jobs.length,
  };
}
