import { audit } from "./audit.service.js";
import { finishCampaign } from "./campaign-lifecycle.js";
import mongoose, { Types } from "mongoose";
import { Campaign, CampaignRecipient } from "../models/campaign.model.js";
import { TemplateVersion } from "../models/template.model.js";
import { SenderIdentity, Domain, MailTransport } from "../models/mailTransport.model.js";
import { Contact, List, Suppression } from "../models/audience.model.js";
import { ApiError } from "../utils/apiError.js";
import { completeCampaignIfFinished } from "./campaignLifecycle.service.js";
import { DispatchOutboxEvent } from "../models/infra.model.js";
import { dispatchOutboxEvent, newDispatchOutboxEvent } from "./dispatchOutbox.service.js";

export async function startSend(
  organizationId: string,
  campaignId: string,
  userId?: string,
): Promise<{
  campaignId: string;
  totalRecipients: number;
  queuedCount: number;
  skippedCount: number;
  dispatchPending: boolean;
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
  let outboxEventId: Types.ObjectId | undefined;
  const hasQueuedRecipients = recipientDocs.some((recipient) => recipient.status === "QUEUED");
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const locked = await Campaign.findOneAndUpdate(
        { _id: campaignOid, organizationId: orgOid, status: "DRAFT" },
        { $set: {
          status: "QUEUED",
          startedAt: new Date(),
          "counters.totalRecipients": recipientDocs.length,
          "dispatch.status": hasQueuedRecipients ? "PENDING" : "DISPATCHED",
        } },
        { session },
      );
      if (!locked) throw new ApiError(409, "Campaign has already been queued");
      await audit(organizationId, userId, "campaign.send", "campaign", campaignId, session, { recipients: recipientDocs.length });
      allRecipients = recipientDocs.length
        ? await CampaignRecipient.insertMany(recipientDocs, { session })
        : [];
      if (hasQueuedRecipients) {
        const [outboxEvent] = await DispatchOutboxEvent.create(
          [newDispatchOutboxEvent({ organizationId: orgOid, campaignId: campaignOid, transportId: domain.transportId })],
          { session },
        );
        outboxEventId = outboxEvent._id;
      }
    });
  } finally {
    await session.endSession();
  }
  const totalRecipients = allRecipients.length;

  const queuedRecipients = allRecipients.filter((r) => r.status === "QUEUED");
  const dispatched = outboxEventId ? await dispatchOutboxEvent(outboxEventId.toString()) : true;

  // A fully skipped (or empty) campaign has no worker transition to trigger completion.
  await completeCampaignIfFinished(campaignId);

  await finishCampaign(organizationId, campaignId);
  return {
    campaignId,
    totalRecipients,
    queuedCount: queuedRecipients.length,
    skippedCount: totalRecipients - queuedRecipients.length,
    dispatchPending: !dispatched,
  };
}
