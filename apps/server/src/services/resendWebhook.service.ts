import { createHmac, timingSafeEqual } from "node:crypto";
import { Campaign, CampaignRecipient } from "../models/campaign.model.js";
import { WebhookEvent } from "../models/infra.model.js";
import type { RecipientStatus } from "../lib/enums.js";

const MAX_SIGNATURE_AGE_SECONDS = 5 * 60;

export interface ResendWebhookPayload {
  type: string;
  created_at?: string;
  data?: { email_id?: string };
}

type EventUpdate = {
  status: RecipientStatus;
  timestampField: "deliveredAt" | "bouncedAt" | "failedAt" | "openedAt" | "clickedAt" | "complainedAt";
  allowedStatuses: RecipientStatus[];
  counter?: "deliveredCount" | "bouncedCount" | "failedCount";
};

const eventUpdates: Record<string, EventUpdate | undefined> = {
  "email.delivered": {
    status: "DELIVERED",
    timestampField: "deliveredAt",
    allowedStatuses: ["QUEUED", "SENT"],
    counter: "deliveredCount",
  },
  "email.bounced": {
    status: "BOUNCED",
    timestampField: "failedAt",
    allowedStatuses: ["QUEUED", "SENT", "FAILED"],
    counter: "bouncedCount",
  },
  "email.failed": {
    status: "FAILED",
    timestampField: "bouncedAt",
    allowedStatuses: ["QUEUED", "SENT"],
    counter: "failedCount",
  },
  "email.opened": {
    status: "OPENED",
    timestampField: "openedAt",
    allowedStatuses: ["SENT", "DELIVERED"],
  },
  "email.clicked": {
    status: "CLICKED",
    timestampField: "clickedAt",
    allowedStatuses: ["SENT", "DELIVERED", "OPENED"],
  },
  "email.complained": {
    status: "COMPLAINED",
    timestampField: "complainedAt",
    allowedStatuses: ["QUEUED", "SENT", "DELIVERED", "OPENED", "CLICKED"],
  },
};

function signatureMatches(expected: Buffer, provided: string): boolean {
  const actual = Buffer.from(provided, "base64");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Verifies the Svix headers used by Resend without parsing or re-serializing the body. */
export function verifyResendWebhook(
  body: Buffer,
  headers: { id?: string; timestamp?: string; signature?: string },
  webhookSecret: string,
): ResendWebhookPayload {
  if (!headers.id || !headers.timestamp || !headers.signature) {
    throw new Error("Missing Svix signature headers");
  }

  const timestamp = Number(headers.timestamp);
  if (!Number.isInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > MAX_SIGNATURE_AGE_SECONDS) {
    throw new Error("Expired or invalid Svix timestamp");
  }

  const encodedSecret = webhookSecret.startsWith("whsec_") ? webhookSecret.slice(6) : webhookSecret;
  const secret = Buffer.from(encodedSecret, "base64");
  if (!secret.length) throw new Error("Invalid webhook secret");

  const signedContent = `${headers.id}.${headers.timestamp}.${body.toString("utf8")}`;
  const expected = createHmac("sha256", secret).update(signedContent).digest();
  const valid = headers.signature.split(" ").some((entry) => {
    const [version, value] = entry.split(",");
    return version === "v1" && Boolean(value) && signatureMatches(expected, value);
  });
  if (!valid) throw new Error("Invalid Svix signature");

  const payload: unknown = JSON.parse(body.toString("utf8"));
  if (!payload || typeof payload !== "object" || typeof (payload as ResendWebhookPayload).type !== "string") {
    throw new Error("Invalid webhook payload");
  }
  return payload as ResendWebhookPayload;
}

export async function processResendWebhook(
  eventId: string,
  payload: ResendWebhookPayload,
): Promise<{ duplicate: boolean }> {
  let event;
  try {
    event = await WebhookEvent.create({
      provider: "RESEND",
      providerEventId: eventId,
      type: payload.type,
      payload,
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    event = await WebhookEvent.findOne({ providerEventId: eventId });
    if (event?.processedAt) return { duplicate: true };
  }

  const update = eventUpdates[payload.type];
  const messageId = payload.data?.email_id;
  if (update && messageId) {
    const eventTime = payload.created_at && !Number.isNaN(Date.parse(payload.created_at))
      ? new Date(payload.created_at)
      : new Date();
    const recipient = await CampaignRecipient.findOneAndUpdate(
      { providerMessageId: messageId, status: { $in: update.allowedStatuses } },
      { $set: { status: update.status, [update.timestampField]: eventTime } },
      { new: false },
    );
    if (recipient && update.counter) {
      await Campaign.updateOne({ _id: recipient.campaignId }, { $inc: { [`counters.${update.counter}`]: 1 } });
    }
  }

  await WebhookEvent.updateOne({ _id: event?._id }, { $set: { processedAt: new Date() } });
  return { duplicate: false };
}
