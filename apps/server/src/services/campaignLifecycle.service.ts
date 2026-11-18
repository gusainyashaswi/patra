import { Campaign, CampaignRecipient } from "../models/campaign.model.js";

/** A sent message has finished Patra's dispatch lifecycle; delivery events may refine it later. */
export const TERMINAL_RECIPIENT_STATUSES = [
  "SENT",
  "DELIVERED",
  "BOUNCED",
  "FAILED",
  "OPENED",
  "CLICKED",
  "COMPLAINED",
  "SKIPPED",
] as const;

/**
 * Marks a dispatch campaign complete only after no recipients remain to be sent.
 * The conditional update makes the transition safe when several workers finish together.
 */
export async function completeCampaignIfFinished(campaignId: string): Promise<boolean> {
  const pendingRecipient = await CampaignRecipient.exists({
    campaignId,
    status: { $nin: TERMINAL_RECIPIENT_STATUSES },
  });
  if (pendingRecipient) return false;

  const result = await Campaign.updateOne(
    { _id: campaignId, status: { $in: ["QUEUED", "SENDING"] } },
    { $set: { status: "COMPLETED", completedAt: new Date() } },
  );
  return result.modifiedCount === 1;
}

/** Recovery path for a process crash after a recipient transition but before completion. */
export async function completeFinishedCampaigns(): Promise<number> {
  const candidates = await Campaign.find({ status: { $in: ["QUEUED", "SENDING"] } })
    .select("_id")
    .lean();
  let completed = 0;
  for (const campaign of candidates) {
    if (await completeCampaignIfFinished(campaign._id.toString())) completed += 1;
  }
  return completed;
}
