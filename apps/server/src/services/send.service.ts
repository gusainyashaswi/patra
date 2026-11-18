import { Types } from "mongoose";
import { Campaign, CampaignRecipient } from "../models/campaign.model.js";
import { TemplateVersion } from "../models/template.model.js";
import { SenderIdentity, Domain } from "../models/mailTransport.model.js";
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

  // 2. Rule 2: Conditional lock status DRAFT -> QUEUED
  const lockedCampaign = await Campaign.findOneAndUpdate(
    { _id: campaignOid, organizationId: orgOid, status: "DRAFT" },
    { $set: { status: "QUEUED", startedAt: new Date() } },
    { new: true },
  );

  if (!lockedCampaign) {
    throw new ApiError(
      409,
      "Campaign is not in DRAFT status or has already been queued",
    );
  }

  // 3. Load dependencies: List, SenderIdentity, TemplateVersion
  const [list, senderIdentity, templateVersion] = await Promise.all([
    List.findOne({ _id: lockedCampaign.listId, organizationId: orgOid }),
    SenderIdentity.findOne({
      _id: lockedCampaign.senderIdentityId,
      organizationId: orgOid,
    }),
    TemplateVersion.findOne({
      _id: lockedCampaign.templateVersionId,
      organizationId: orgOid,
    }),
  ]);

  if (!list) throw new ApiError(404, "Campaign audience list not found");
  if (!senderIdentity) throw new ApiError(404, "Campaign sender identity not found");
  if (!templateVersion) throw new ApiError(404, "Campaign template version not found");

  // Resolve transportId
  let transportId = senderIdentity.transportId?.toString();
  if (!transportId) {
    const domain = await Domain.findOne({
      _id: senderIdentity.domainId,
      organizationId: orgOid,
    });
    if (!domain || !domain.transportId) {
      throw new ApiError(404, "Sender transport could not be resolved");
    }
    transportId = domain.transportId.toString();
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
      email: c.email.toLowerCase().trim(),
      status: missingVariables.length > 0 ? ("SKIPPED" as const) : ("QUEUED" as const),
      error:
        missingVariables.length > 0
          ? `Missing required variables: ${missingVariables.join(", ")}`
          : undefined,
    };
  });

  // 6. Rule 4: insertMany with ordered: false, ignore duplicate key error (code 11000)
  let allRecipients: { _id: Types.ObjectId; status: string }[] = [];
  if (recipientDocs.length > 0) {
    try {
      allRecipients = (await CampaignRecipient.insertMany(recipientDocs, {
        ordered: false,
      })) as any;
    } catch (err: any) {
      if (err.code === 11000 || err.writeErrors || err.name === "MongoBulkWriteError") {
        allRecipients = (await CampaignRecipient.find({
          campaignId: campaignOid,
          organizationId: orgOid,
        }).select("_id status")) as any;
      } else {
        throw err;
      }
    }
  }

  // 7. Update counters
  const totalRecipients = allRecipients.length;
  await Campaign.updateOne(
    { _id: campaignOid },
    { $set: { "counters.totalRecipients": totalRecipients } },
  );

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
    await queue.addBulk(jobs);
  }

  return {
    campaignId,
    totalRecipients,
    queuedCount: jobs.length,
    skippedCount: totalRecipients - jobs.length,
  };
}
