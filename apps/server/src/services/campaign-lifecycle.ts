import { Campaign, CampaignRecipient } from "../models/campaign.model.js";

// Completion means dispatch finished, not that every inbox accepted delivery.
export async function finishCampaign(organizationId: string, campaignId: string) {
  if (await CampaignRecipient.exists({ organizationId, campaignId, status: "QUEUED" })) return;
  await Campaign.updateOne({ _id: campaignId, organizationId, status: { $in: ["QUEUED", "SENDING", "PAUSED"] } }, { $set: { status: "COMPLETED", completedAt: new Date() } });
}
