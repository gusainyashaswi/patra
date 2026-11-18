import { type Job, DelayedError } from "bullmq";
import { Campaign, CampaignRecipient } from "../models/campaign.model.js";
import { TemplateVersion } from "../models/template.model.js";
import { SenderIdentity, Domain } from "../models/mailTransport.model.js";
import { Contact } from "../models/audience.model.js";
import { renderEmail } from "../services/render.service.js";
import {
  getOrBuildTransport,
  TransientError,
  PermanentError,
} from "../transports/index.js";
import type { SendEmailJobData } from "../queue/send.queue.js";

const FINAL_STATUSES = new Set([
  "SENT",
  "DELIVERED",
  "BOUNCED",
  "FAILED",
  "OPENED",
  "CLICKED",
  "COMPLAINED",
  "SKIPPED",
]);

export async function markRecipientFailed(
  recipientId: string,
  campaignId: string,
  errorMsg: string,
): Promise<void> {
  const updateRes = await CampaignRecipient.updateOne(
    { _id: recipientId, status: "QUEUED" },
    { $set: { status: "FAILED", error: errorMsg } },
  );

  if (updateRes.modifiedCount === 1) {
    await Campaign.updateOne(
      { _id: campaignId },
      { $inc: { "counters.failedCount": 1 } },
    );
  }
}

export async function sendEmailProcessor(
  job: Job<SendEmailJobData>,
  token?: string,
): Promise<{ status: string; [key: string]: unknown }> {
  const { recipientId, campaignId, organizationId } = job.data;

  // 1. Load recipient
  const recipient = await CampaignRecipient.findOne({
    _id: recipientId,
    organizationId,
  });

  if (!recipient) {
    return { status: "missing_recipient" };
  }

  // 2. Return early if status is final
  if (FINAL_STATUSES.has(recipient.status)) {
    return { status: "already_processed", recipientStatus: recipient.status };
  }

  // 3. Load campaign
  const campaign = await Campaign.findOne({
    _id: campaignId,
    organizationId,
  });

  if (!campaign) {
    await markRecipientFailed(recipientId, campaignId, "Campaign not found");
    return { status: "campaign_not_found" };
  }

  // 4. Pausing & cancellation checks
  if (campaign.status === "PAUSED") {
    await job.moveToDelayed(Date.now() + 5000, token);
    throw new DelayedError();
  }

  if (campaign.status === "CANCELLED") {
    return { status: "campaign_cancelled" };
  }

  // 5. Load dependencies in parallel
  const [templateVersion, senderIdentity, contact] = await Promise.all([
    TemplateVersion.findOne({
      _id: campaign.templateVersionId,
      organizationId,
    }),
    SenderIdentity.findOne({
      _id: campaign.senderIdentityId,
      organizationId,
    }),
    Contact.findOne({
      _id: recipient.contactId,
      organizationId,
    }),
  ]);

  if (!templateVersion) {
    await markRecipientFailed(recipientId, campaignId, "Template version not found");
    return { status: "permanent_failure", error: "Template version missing" };
  }

  if (!senderIdentity) {
    await markRecipientFailed(recipientId, campaignId, "Sender identity not found");
    return { status: "permanent_failure", error: "Sender identity missing" };
  }

  // 6. Resolve transportId from SenderIdentity or Domain
  let transportId = senderIdentity.transportId?.toString();
  if (!transportId) {
    const domain = await Domain.findOne({
      _id: senderIdentity.domainId,
      organizationId,
    });
    if (!domain || !domain.transportId) {
      await markRecipientFailed(recipientId, campaignId, "Sender domain or transport not found");
      return { status: "permanent_failure", error: "Transport resolution failed" };
    }
    transportId = domain.transportId.toString();
  }

  // 7. Prepare contact data for variable replacement
  let customFields: Record<string, unknown> = {};
  if (contact?.customFields) {
    customFields =
      contact.customFields instanceof Map
        ? Object.fromEntries(contact.customFields)
        : (contact.customFields as Record<string, unknown>);
  }

  const contactData: Record<string, unknown> = {
    name: contact?.name || "",
    email: recipient.email,
    ...customFields,
  };

  // 8. Render email
  const renderResult = renderEmail({
    subject: templateVersion.subject,
    html: templateVersion.html,
    text: templateVersion.text,
    variables: templateVersion.variables || [],
    data: contactData,
    organizationId: organizationId.toString(),
    email: recipient.email,
  });

  if (!renderResult.success) {
    // Missing required variables -> Mark SKIPPED
    await CampaignRecipient.updateOne(
      { _id: recipientId, status: "QUEUED" },
      { $set: { status: "SKIPPED", error: renderResult.error } },
    );
    return { status: "skipped", reason: renderResult.error };
  }

  // 9. Load cached transport adapter and send
  const transportAdapter = await getOrBuildTransport(transportId, organizationId.toString());
  const idempotencyKey = `${campaignId}:${recipientId}`;
  const fromAddress = senderIdentity.displayName
    ? `"${senderIdentity.displayName}" <${senderIdentity.fromEmail}>`
    : senderIdentity.fromEmail;

  try {
    const sendResult = await transportAdapter.send({
      to: recipient.email,
      from: fromAddress,
      replyTo: senderIdentity.replyTo,
      subject: renderResult.subject,
      html: renderResult.html,
      text: renderResult.text,
      headers: renderResult.headers,
      idempotencyKey,
    });

    // 10. Conditional status update: QUEUED -> SENT
    const updateRes = await CampaignRecipient.updateOne(
      { _id: recipientId, status: "QUEUED" },
      {
        $set: {
          status: "SENT",
          providerMessageId: sendResult.providerMessageId,
          sentAt: new Date(),
        },
      },
    );

    // 11. Atomic counter update only if row was actually updated
    if (updateRes.modifiedCount === 1) {
      await Campaign.updateOne(
        { _id: campaignId },
        { $inc: { "counters.sentCount": 1 } },
      );
    }

    return {
      status: "sent",
      providerMessageId: sendResult.providerMessageId,
    };
  } catch (error: unknown) {
    if (error instanceof PermanentError) {
      await markRecipientFailed(recipientId, campaignId, error.message);
      return { status: "failed_permanent", error: error.message };
    }

    // Treat unknown errors as TransientError (Rule 8)
    if (error instanceof TransientError) {
      throw error;
    }

    const transient = new TransientError(
      error instanceof Error ? error.message : String(error),
    );
    throw transient;
  }
}
