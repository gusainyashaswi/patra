export function getSendQueueName(transportId: string): string {
  // In BullMQ v5, queue names cannot contain ':' (used internally as key separator)
  return `send-email-${transportId}`;
}

export const RECONCILE_QUEUE_NAME = "reconciliation";
export const RECONCILE_JOB_NAME = "reconcile-queued-recipients";
