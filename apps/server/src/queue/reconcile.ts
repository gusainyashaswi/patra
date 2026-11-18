import { Queue, Worker, type Job } from "bullmq";
import { CampaignRecipient, Campaign } from "../models/campaign.model.js";
import { SenderIdentity, Domain } from "../models/mailTransport.model.js";
import { getRedisConnection } from "../lib/redis.js";
import { getSendQueue } from "./send.queue.js";
import { RECONCILE_QUEUE_NAME, RECONCILE_JOB_NAME } from "./names.js";
import { completeFinishedCampaigns } from "../services/campaignLifecycle.service.js";
import { dispatchPendingOutboxEvents } from "../services/dispatchOutbox.service.js";

let reconcileQueue: Queue | null = null;
let reconcileWorker: Worker | null = null;

export async function reconcileOrphanedRecipients(
  thresholdMinutes = 10,
): Promise<{ checked: number; reEnqueued: number }> {
  const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);

  // Find all QUEUED recipients created before the cutoff
  const orphans = await CampaignRecipient.find({
    status: "QUEUED",
    createdAt: { $lte: cutoff },
  });

  let reEnqueuedCount = 0;

  for (const recipient of orphans) {
    // Check if campaign is valid and not paused/cancelled
    const campaign = await Campaign.findById(recipient.campaignId);
    if (!campaign || !["QUEUED", "SENDING"].includes(campaign.status)) {
      continue;
    }

    // Resolve transportId
    const sender = await SenderIdentity.findById(campaign.senderIdentityId);
    let transportId = sender?.transportId?.toString();
    if (!transportId && sender?.domainId) {
      const domain = await Domain.findById(sender.domainId);
      transportId = domain?.transportId?.toString();
    }
    if (!transportId) continue;

    const queue = getSendQueue(transportId);
    const existingJob = await queue.getJob(recipient._id.toString());

    // If no active/waiting/delayed job exists with jobId = recipientId, re-enqueue
    if (!existingJob) {
      console.warn(
        `[Reconcile] Found orphaned QUEUED recipient ${recipient._id} (campaign ${campaign._id}). Re-enqueueing...`,
      );
      await queue.add(
        "sendEmail",
        {
          campaignId: campaign._id.toString(),
          recipientId: recipient._id.toString(),
          organizationId: recipient.organizationId.toString(),
        },
        {
          jobId: recipient._id.toString(),
        },
      );
      reEnqueuedCount++;
    }
  }

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
