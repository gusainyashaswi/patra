import { Worker, type Job, type Processor } from "bullmq";
import mongoose from "mongoose";
import { connectDB } from "./db/index.js";
import { env } from "./config/env.js";
import { getRedisConnection, closeRedisConnection } from "./lib/redis.js";
import { getSendQueueName } from "./queue/names.js";
import type { SendEmailJobData } from "./queue/send.queue.js";
import { MailTransport } from "./models/mailTransport.model.js";
import {
  sendEmailProcessor,
  markRecipientFailed,
} from "./processors/sendEmail.processor.js";
import {
  setupReconciliationScheduler,
  stopReconciliation,
} from "./queue/reconcile.js";

const activeWorkers = new Map<string, Worker<SendEmailJobData>>();
let isShuttingDown = false;
let discoveryTimer: ReturnType<typeof setInterval> | undefined;

export function createSendWorker(
  transportId: string,
  ratePerSecond?: number,
  processor: Processor<SendEmailJobData> = sendEmailProcessor,
): Worker<SendEmailJobData> {
  isShuttingDown = false;
  const queueName = getSendQueueName(transportId);
  const existing = activeWorkers.get(queueName);
  if (existing) return existing;

  const worker = new Worker<SendEmailJobData>(queueName, processor, {
    connection: getRedisConnection(),
    concurrency: env.WORKER_CONCURRENCY,
    lockDuration: process.env.NODE_ENV === "test" ? Number(process.env.WORKER_LOCK_MS || 60000) : 60000,
    stalledInterval: process.env.NODE_ENV === "test" ? 1000 : 30000,
    maxStalledCount: 1,
    limiter: ratePerSecond
      ? {
          max: ratePerSecond,
          duration: 1000,
        }
      : undefined,
  });

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed on queue ${queueName}`);
  });

  // Rule 9: The final-failure handler on the worker ("failed" event, when attemptsMade >= attempts)
  // marks the recipient FAILED, so no recipient stays QUEUED forever.
  worker.on("failed", async (job, err) => {
    console.error(
      `[Worker] Job ${job?.id} attempt ${job?.attemptsMade}/${job?.opts.attempts ?? 3} failed on queue ${queueName}:`,
      err.message,
    );

    if (job) {
      const maxAttempts = job.opts.attempts ?? 3;
      if (job.attemptsMade >= maxAttempts) {
        console.warn(
          `[Worker] Job ${job.id} exhausted all ${maxAttempts} attempts. Marking recipient ${job.data.recipientId} as FAILED.`,
        );
        try {
          await markRecipientFailed(
            job.data.recipientId,
            job.data.campaignId,
            `Exhausted retries: ${err.message}`,
          );
        } catch (dbErr) {
          console.error(
            `[Worker] Error marking recipient ${job.data.recipientId} as FAILED on final attempt:`,
            dbErr,
          );
        }
      }
    }
  });

  activeWorkers.set(queueName, worker);
  return worker;
}

export function getActiveWorkers(): Map<string, Worker<SendEmailJobData>> {
  return activeWorkers;
}

export async function stopAllWorkers(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  clearInterval(discoveryTimer);
  console.log("[Worker] Graceful shutdown initiated...");

  try {
    await stopReconciliation();
    console.log("[Worker] Reconciliation scheduler stopped.");
  } catch (err) {
    console.error("[Worker] Error stopping reconciliation scheduler:", err);
  }

  for (const [name, worker] of activeWorkers.entries()) {
    try {
      console.log(`[Worker] Closing worker for ${name}...`);
      await worker.close();
    } catch (err) {
      console.error(`[Worker] Error closing worker ${name}:`, err);
    }
  }
  activeWorkers.clear();

  try {
    await closeRedisConnection();
    console.log("[Worker] Redis connection closed.");
  } catch (err) {
    console.error("[Worker] Error closing Redis:", err);
  }

  try {
    await mongoose.disconnect();
    console.log("[Worker] MongoDB disconnected.");
  } catch (err) {
    console.error("[Worker] Error disconnecting Mongo:", err);
  }
}

export async function discoverTransportWorkers(): Promise<void> {
  const transports = await MailTransport.find({ status: "VERIFIED", type: "RESEND" });
  for (const transport of transports) {
    const worker = createSendWorker(transport.id, transport.ratePerSecond);
    await worker.waitUntilReady();
  }
}

export async function startWorker(): Promise<void> {
  console.log("[Worker] Starting Patra Worker Service...");
  await connectDB();

  await discoverTransportWorkers();
  await setupReconciliationScheduler();
  let discovering = false;
  discoveryTimer = setInterval(async () => {
    if (discovering || isShuttingDown) return;
    discovering = true;
    try { await discoverTransportWorkers(); }
    catch (error) { console.error("Transport discovery failed", error); }
    finally { discovering = false; }
  }, 5000);

  // Register signal listeners for graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("[Worker] Received SIGTERM signal.");
    await stopAllWorkers();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("[Worker] Received SIGINT signal.");
    await stopAllWorkers();
    process.exit(0);
  });

  console.log(`[Worker] Worker service ready. Concurrency=${env.WORKER_CONCURRENCY}`);
}

// Auto-start if executed directly via node or tsx
const isDirectRun =
  process.argv.some((arg) => arg.endsWith("worker.ts") || arg.endsWith("worker.js")) ||
  process.env.PATRA_RUN_WORKER === "true";
if (isDirectRun) {
  startWorker().catch((err) => {
    console.error("[Worker] Fatal error starting worker:", err);
    process.exit(1);
  });
}
