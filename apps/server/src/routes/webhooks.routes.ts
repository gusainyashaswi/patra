import { Router, raw } from "express";
import mongoose from "mongoose";
import { Webhook } from "svix";
import { z } from "zod";
import { Campaign, CampaignRecipient } from "../models/campaign.model.js";
import { WebhookEvent } from "../models/infra.model.js";
import { Suppression } from "../models/audience.model.js";
import { ApiError } from "../utils/apiError.js";

const eventSchema = z.object({
  type: z.string(),
  created_at: z.string().datetime({ offset: true }),
  data: z.object({
    email_id: z.string().min(1),
    bounce: z.object({ type: z.string(), message: z.string().optional() }).optional(),
    failed: z.object({ reason: z.string() }).optional(),
  }).passthrough(),
});
const transitions = {
  "email.delivered": { status: "DELIVERED", date: "deliveredAt", counter: "deliveredCount", rank: 1 },
  "email.opened": { status: "OPENED", date: "openedAt", rank: 2 },
  "email.clicked": { status: "CLICKED", date: "clickedAt", rank: 3 },
  "email.failed": { status: "FAILED", date: "failedAt", counter: "failedCount", rank: 4 },
  "email.bounced": { status: "BOUNCED", date: "bouncedAt", counter: "bouncedCount", rank: 5 },
  "email.complained": { status: "COMPLAINED", date: "complainedAt", rank: 6 },
} as const;
const ranks: Record<string, number> = { QUEUED: 0, SENT: 0, DELIVERED: 1, OPENED: 2, CLICKED: 3, FAILED: 4, BOUNCED: 5, COMPLAINED: 6, SKIPPED: 7 };

export const webhookRouter = Router();
webhookRouter.post("/resend", raw({ type: "application/json", limit: "256kb" }), async (req, res, next) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ message: "Webhook signing secret is not configured" });
  let verified: unknown;
  const eventId = req.get("svix-id") || "";
  try {
    if (!Buffer.isBuffer(req.body)) throw new Error("Raw body required");
    new Webhook(secret).verify(req.body.toString("utf8"), {
      "svix-id": eventId,
      "svix-timestamp": req.get("svix-timestamp") || "",
      "svix-signature": req.get("svix-signature") || "",
    });
    verified = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(401).json({ message: "Invalid webhook signature" });
  }
  try {
    // Ignore unrelated event families without accepting malformed tracking events.
    const type = z.object({ type: z.string() }).parse(verified).type;
    const transition = transitions[type as keyof typeof transitions];
    if (!transition) return res.status(200).json({ received: true, ignored: true });
    const event = eventSchema.parse(verified);
    if (mongoose.connection.readyState !== 1) throw new ApiError(503, "Database is not connected");
    await mongoose.connection.transaction(async (session) => {
      if (await WebhookEvent.exists({ providerEventId: eventId }).session(session)) return;
      // A provider callback can beat the worker's message-ID commit. Leave it
      // unacknowledged so Resend retries, rather than permanently losing the event.
      const recipient = await CampaignRecipient.findOne({ providerMessageId: event.data.email_id }).session(session);
      if (!recipient) throw new ApiError(503, "Message is not available yet; retry this event");
      const scope = { organizationId: recipient.organizationId, _id: recipient.campaignId };
      if (!(await Campaign.exists(scope).session(session))) throw new ApiError(503, "Campaign is not available");
      await WebhookEvent.create([{ provider: "resend", providerEventId: eventId, type, payload: verified }], { session });
      const firstOccurrence = !recipient.get(transition.date);
      if (firstOccurrence) recipient.set(transition.date, new Date(event.created_at));
      if (transition.rank > (ranks[recipient.status] ?? 0)) {
        recipient.status = transition.status;
        if (type === "email.failed") recipient.error = event.data.failed?.reason || "Provider reported a send failure";
        if (type === "email.bounced") recipient.error = event.data.bounce?.message || "Provider reported a bounce";
      }
      await recipient.save({ session });
      if (firstOccurrence && "counter" in transition) {
        await Campaign.updateOne(scope, { $inc: { [`counters.${transition.counter}`]: 1 } }, { session });
      }
      const reason = type === "email.complained" ? "COMPLAINT"
        : type === "email.bounced" && event.data.bounce?.type === "Permanent" ? "HARD_BOUNCE" : null;
      if (reason) await Suppression.updateOne(
        { organizationId: recipient.organizationId, email: recipient.email },
        { $setOnInsert: { reason } }, { upsert: true, session },
      );
    });
    return res.status(200).json({ received: true });
  } catch (error) {
    // A concurrent delivery may have won the event's unique index.
    if ((error as { code?: number }).code === 11000 && await WebhookEvent.exists({ providerEventId: eventId })) {
      return res.status(200).json({ received: true });
    }
    next(error);
  }
});
