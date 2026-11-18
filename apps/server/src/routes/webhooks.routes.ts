import { Router } from "express";
import { env } from "../config/env.js";
import { processResendWebhook, verifyResendWebhook } from "../services/resendWebhook.service.js";

export const webhookRouter = Router();

webhookRouter.post("/resend", async (req, res, next) => {
  if (!env.RESEND_WEBHOOK_SECRET) {
    return res.status(503).json({ error: "Resend webhooks are not configured" });
  }

  let payload;
  try {
    payload = verifyResendWebhook(req.body as Buffer, {
      id: req.get("svix-id") ?? undefined,
      timestamp: req.get("svix-timestamp") ?? undefined,
      signature: req.get("svix-signature") ?? undefined,
    }, env.RESEND_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Invalid webhook" });
  }

  try {
    const result = await processResendWebhook(req.get("svix-id")!, payload);
    return res.status(200).json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    return next(error);
  }
});
