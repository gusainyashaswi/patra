import { Queue } from "bullmq";
import { getRedisConnection } from "../lib/redis.js";
import { getSendQueueName } from "./names.js";

export interface SendEmailJobData {
  campaignId: string;
  recipientId: string;
  organizationId: string;
}

const sendQueues = new Map<string, Queue<SendEmailJobData>>();

export function getSendQueue(transportId: string): Queue<SendEmailJobData> {
  const name = getSendQueueName(transportId);
  let queue = sendQueues.get(name);
  if (!queue) {
    queue = new Queue<SendEmailJobData>(name, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
    sendQueues.set(name, queue);
  }
  return queue;
}

export async function closeAllQueues(): Promise<void> {
  for (const queue of sendQueues.values()) {
    await queue.close();
  }
  sendQueues.clear();
}
