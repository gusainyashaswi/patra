import { Types } from "mongoose";
import { Campaign, CampaignRecipient } from "../models/campaign.model.js";
import { DispatchOutboxEvent } from "../models/infra.model.js";
import { getSendQueue } from "../queue/send.queue.js";

/**
 * Dispatches a committed outbox record. Repeating this is safe because recipient
 * IDs are also BullMQ job IDs, so already-created jobs are not duplicated.
 */
export async function dispatchOutboxEvent(eventId: string): Promise<boolean> {
  const event = await DispatchOutboxEvent.findOneAndUpdate(
    { _id: eventId, status: "PENDING" },
    { $inc: { attempts: 1 }, $set: { lastAttemptAt: new Date() } },
    { new: true },
  );
  if (!event) return false;

  const recipients = await CampaignRecipient.find({ campaignId: event.campaignId, status: "QUEUED" })
    .select("_id")
    .lean();
  const queue = getSendQueue(event.transportId.toString());
  const jobs = recipients.map((recipient) => ({
    name: "sendEmail",
    data: {
      campaignId: event.campaignId.toString(),
      recipientId: recipient._id.toString(),
      organizationId: event.organizationId.toString(),
    },
    opts: { jobId: recipient._id.toString() },
  }));

  try {
    if (jobs.length) await queue.addBulk(jobs);
    await Promise.all([
      DispatchOutboxEvent.updateOne(
        { _id: event._id, status: "PENDING" },
        { $set: { status: "DISPATCHED", dispatchedAt: new Date() }, $unset: { lastError: 1 } },
      ),
      Campaign.updateOne(
        { _id: event.campaignId },
        { $set: { "dispatch.status": "DISPATCHED" }, $unset: { "dispatch.lastError": 1 } },
      ),
    ]);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await Promise.all([
      DispatchOutboxEvent.updateOne({ _id: event._id }, { $set: { lastError: message } }),
      Campaign.updateOne({ _id: event.campaignId }, { $set: { "dispatch.status": "PENDING", "dispatch.lastError": message } }),
    ]);
    return false;
  }
}

export async function dispatchPendingOutboxEvents(limit = 100): Promise<number> {
  const events = await DispatchOutboxEvent.find({ status: "PENDING" })
    .sort({ createdAt: 1 })
    .limit(limit)
    .select("_id")
    .lean();
  let dispatched = 0;
  for (const event of events) {
    if (await dispatchOutboxEvent(event._id.toString())) dispatched += 1;
  }
  return dispatched;
}

export function newDispatchOutboxEvent(input: {
  organizationId: Types.ObjectId;
  campaignId: Types.ObjectId;
  transportId: Types.ObjectId;
}) {
  return { ...input, status: "PENDING" as const, attempts: 0 };
}
