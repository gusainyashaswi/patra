import { finishCampaign } from "../services/campaign-lifecycle.js";
import mongoose from "mongoose";
import { type Job, DelayedError } from "bullmq";
import { Campaign, CampaignRecipient } from "../models/campaign.model.js";
import { TemplateVersion } from "../models/template.model.js";
import { SenderIdentity, Domain } from "../models/mailTransport.model.js";
import { reserveQuota, nextUtcDay } from "../services/quota.service.js";
import { MailTransport } from "../models/mailTransport.model.js";
import { Contact, Suppression } from "../models/audience.model.js";
import { renderEmail } from "../services/render.service.js";
import { contactMergeData } from "../services/contact-merge.js";
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
  const scope = await CampaignRecipient.findOne({ _id: recipientId, campaignId }).select("organizationId");
  if (!scope) return;
  const organizationId = scope.organizationId;
  await mongoose.connection.transaction(async (session) => {
    const updateRes = await CampaignRecipient.updateOne(
      { _id: recipientId, campaignId, organizationId, status: "QUEUED" },
      { $set: { status: "FAILED", error: errorMsg, failedAt: new Date() } },
      { session },
    );
    if (updateRes.modifiedCount === 1) {
      await Campaign.updateOne(
        { _id: campaignId, organizationId },
        { $inc: { "counters.failedCount": 1 } },
        { session },
      );
    }
  });
  const recipient = await CampaignRecipient.findById(recipientId);
  if (recipient) await finishCampaign(String(recipient.organizationId), campaignId);
}

export async function sendEmailProcessor(
  job: Job<SendEmailJobData>,
  token?: string,
): Promise<{ status: string; [key: string]: unknown }> {
  const { recipientId, campaignId, organizationId } = job.data;

  // 1. Load recipient
  const recipient = await CampaignRecipient.findOne({
    _id: recipientId,
    campaignId,
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

  await Campaign.updateOne({ _id: campaignId, organizationId, status: "QUEUED" }, { $set: { status: "SENDING" } });

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

  const domain = await Domain.findOne({ _id: senderIdentity.domainId, organizationId });
  if (!domain?.verified || domain.name !== senderIdentity.fromEmail.split("@").at(-1)) {
    await markRecipientFailed(recipientId, campaignId, "Sender domain is not verified");
    return { status: "permanent_failure" };
  }
  const transportId = domain.transportId.toString();

  // 7. Prepare contact data for variable replacement
  const contactData = recipient.mergeData ?? contactMergeData({
    name: contact?.name, email: recipient.email, customFields: contact?.customFields,
  });

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
      { _id: recipientId, organizationId, campaignId, status: "QUEUED" },
      { $set: { status: "SKIPPED", error: renderResult.error } },
    );
    await finishCampaign(organizationId, campaignId);
    return { status: "skipped", reason: renderResult.error };
  }

  // 9. Load cached transport adapter and send
  const transportAdapter = await getOrBuildTransport(transportId, organizationId.toString());
  const idempotencyKey = `${campaignId}:${recipientId}`;
  const sender = recipient.senderSnapshot ?? senderIdentity;
  if (sender.fromEmail.split("@").at(-1) !== domain.name) {
    await markRecipientFailed(recipientId, campaignId, "Snapshot sender domain does not match");
    return { status: "permanent_failure" };
  }
  const fromAddress = sender.displayName
    ? `"${sender.displayName}" <${sender.fromEmail}>`
    : sender.fromEmail;

  try {
    // Recheck just before provider dispatch, including after a retry or pause.
    if (await Suppression.exists({ organizationId, email: recipient.email })) {
      await CampaignRecipient.updateOne(
        { _id: recipientId, organizationId, status: "QUEUED" },
        { $set: { status: "SKIPPED", error: "Address is suppressed" } },
      );
      await finishCampaign(organizationId, campaignId);
      return { status: "suppressed" };
    }
    const transport = await MailTransport.findOne({ _id: transportId, organizationId });
    if (!await reserveQuota(organizationId, transportId, recipientId, transport?.dailyLimit ?? 0)) {
      await job.moveToDelayed(nextUtcDay(), token);
      throw new DelayedError();
    }
    if (recipient.firstAttemptAt && Date.now() - recipient.firstAttemptAt.getTime() >= 23 * 60 * 60 * 1000) {
      await markRecipientFailed(recipientId, campaignId, "Delivery uncertain: retry window expired; manual review required");
      await CampaignRecipient.updateOne({ _id: recipientId, organizationId }, { $set: { requiresReview: true } });
      return { status: "requires_review" };
    }
    // Persist exact bytes, including the unsubscribe URL, before calling Resend.
    await CampaignRecipient.updateOne({ _id: recipientId, organizationId, firstAttemptAt: { $exists: false } }, { $set: { firstAttemptAt: new Date(), renderedMessage: renderResult } });
    const stored = await CampaignRecipient.findOne({ _id: recipientId, organizationId });
    const message = stored?.renderedMessage ?? renderResult;
    const sendResult = await transportAdapter.send({
      to: recipient.email,
      from: fromAddress,
      replyTo: sender.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
      headers: message.headers,
      idempotencyKey,
    });

    await mongoose.connection.transaction(async (session) => {
      const updateRes = await CampaignRecipient.updateOne(
        { _id: recipientId, organizationId, status: "QUEUED" },
        { $set: {
          status: "SENT",
          providerMessageId: sendResult.providerMessageId,
          sentAt: new Date(),
        } },
        { session },
      );
      if (updateRes.modifiedCount === 1) {
        await Campaign.updateOne(
          { _id: campaignId, organizationId },
          { $inc: { "counters.sentCount": 1 } },
          { session },
        );
      }
    });

    await finishCampaign(organizationId, campaignId);
    return {
      status: "sent",
      providerMessageId: sendResult.providerMessageId,
    };
  } catch (error: unknown) {
    if (error instanceof DelayedError) throw error;
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
