import { markRecipientFailed } from "../processors/sendEmail.processor.js";
import { Queue, Worker, type Job } from "bullmq";
import { CampaignRecipient, Campaign } from "../models/campaign.model.js";
import { Domain, SenderIdentity } from "../models/mailTransport.model.js";
import { getRedisConnection } from "../lib/redis.js";
import { getSendQueue } from "./send.queue.js";
import { RECONCILE_QUEUE_NAME, RECONCILE_JOB_NAME } from "./names.js";
import { completeFinishedCampaigns } from "../services/campaignLifecycle.service.js";
import { dispatchPendingOutboxEvents } from "../services/dispatchOutbox.service.js";

let reconcileQueue: Queue | null = null;
let reconcileWorker: Worker | null = null;

export async function reconcileOrphanedRecipients(
  thresholdMinutes = 10,
  batchSize = 500,
): Promise<{ checked: number; reEnqueued: number }> {
  const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);

  // One page per run keeps reconciliation bounded even with a large backlog.
  const orphans = await CampaignRecipient.find({ status: "QUEUED", createdAt: { $lte: cutoff } })
    .sort({ createdAt: 1, _id: 1 })
    .limit(batchSize)
    .select("_id campaignId organizationId")
    .lean();

  const campaignIds = [...new Set(orphans.map((recipient) => recipient.campaignId.toString()))];
  const campaigns = campaignIds.length
    ? await Campaign.find({ _id: { $in: campaignIds }, status: { $in: ["QUEUED", "SENDING"] } })
      .select("_id senderIdentityId")
      .lean()
    : [];
  const campaignsById = new Map(campaigns.map((campaign) => [campaign._id.toString(), campaign]));
  const senderIds = [...new Set(campaigns.map((campaign) => campaign.senderIdentityId.toString()))];
  const senders = senderIds.length
    ? await SenderIdentity.find({ _id: { $in: senderIds } }).select("_id domainId").lean()
    : [];
  const domainIds = [...new Set(senders.map((sender) => sender.domainId.toString()))];
  const domains = domainIds.length
    ? await Domain.find({ _id: { $in: domainIds } }).select("_id transportId").lean()
    : [];
  const transportByDomainId = new Map(domains.map((domain) => [domain._id.toString(), domain.transportId.toString()]));
  const transportBySenderId = new Map(senders.map((sender) => [
    sender._id.toString(),
    transportByDomainId.get(sender.domainId.toString()),
  ]));

  const recipientsByTransport = new Map<string, typeof orphans>();
  for (const recipient of orphans) {
    const campaign = campaignsById.get(recipient.campaignId.toString());
    const transportId = campaign && transportBySenderId.get(campaign.senderIdentityId.toString());
    if (!campaign || !transportId) continue;
    const recipients = recipientsByTransport.get(transportId) ?? [];
    recipients.push(recipient);
    recipientsByTransport.set(transportId, recipients);
  }

  const reEnqueued = await Promise.all([...recipientsByTransport.entries()].map(async ([transportId, recipients]) => {
    const queue = getSendQueue(transportId);
    const pipeline = (await queue.client).pipeline();
    for (const recipient of recipients) {
      pipeline.runCommand("exists", [queue.toKey(recipient._id.toString())]);
    }
    const results = await pipeline.exec();
    if (!results || results.some(([error]) => error)) {
      throw new Error("Unable to check queued jobs in Redis during reconciliation");
    }
    for (let i = 0; i < recipients.length; i++) {
      if (results[i]?.[1] !== 0) {
        const job = await queue.getJob(recipients[i]._id.toString());
        if (job && await job.getState() === "failed") await markRecipientFailed(recipients[i]._id.toString(), recipients[i].campaignId.toString(), "Queue attempts exhausted; recovered by reconciliation");
      }
    }
    const missingRecipients = recipients.filter((_, index) => results?.[index]?.[1] === 0);
    if (!missingRecipients.length) return 0;

    await queue.addBulk(missingRecipients.map((recipient) => ({
      name: "sendEmail",
      data: {
        campaignId: recipient.campaignId.toString(),
        recipientId: recipient._id.toString(),
        organizationId: recipient.organizationId.toString(),
      },
      opts: { jobId: recipient._id.toString() },
    })));
    return missingRecipients.length;
  }));
  const reEnqueuedCount = reEnqueued.reduce((total, count) => total + count, 0);

  await completeFinishedCampaigns();
  await dispatchPendingOutboxEvents();
  return { checked: orphans.length, reEnqueued: reEnqueuedCount };
}

export async function setupReconciliationScheduler(): Promise<void> {
  if (!reconcileQueue) {
    reconcileQueue = new Queue(RECONCILE_QUEUE_NAME, {
      connection: getRedisConnection(),
    });
  }

  // BullMQ v5 JobScheduler API: repeatable job every 5 minutes
  await reconcileQueue.upsertJobScheduler(
    RECONCILE_JOB_NAME,
    { every: 5 * 60 * 1000 },
    { name: "reconcile", data: {} },
  );

  if (!reconcileWorker) {
    reconcileWorker = new Worker(
      RECONCILE_QUEUE_NAME,
      async (_job: Job) => {
        console.log("[Reconcile] Running periodic reconciliation check...");
        const result = await reconcileOrphanedRecipients();
        console.log(
          `[Reconcile] Check finished. Checked ${result.checked}, re-enqueued ${result.reEnqueued}`,
        );
        return result;
      },
      {
        connection: getRedisConnection(),
        concurrency: 1,
      },
    );
  }
}

export async function stopReconciliation(): Promise<void> {
  if (reconcileWorker) {
    await reconcileWorker.close();
    reconcileWorker = null;
  }
  if (reconcileQueue) {
    await reconcileQueue.close();
    reconcileQueue = null;
  }
}
