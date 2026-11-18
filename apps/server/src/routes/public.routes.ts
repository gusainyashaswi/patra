import { Router } from "express";
import { Types } from "mongoose";
import { Suppression } from "../models/audience.model.js";
import { verifyUnsubscribeToken } from "../services/render.service.js";

export const publicRouter = Router();

async function unsubscribe(token: string): Promise<boolean> {
  const verified = verifyUnsubscribeToken(token);
  if (!verified.valid || !verified.organizationId || !verified.email) return false;
  if (!Types.ObjectId.isValid(verified.organizationId)) return false;

  await Suppression.updateOne(
    { organizationId: verified.organizationId, email: verified.email },
    { $setOnInsert: { reason: "UNSUBSCRIBED" } },
    { upsert: true },
  );
  return true;
}

publicRouter.get("/unsubscribe/:token", async (req, res, next) => {
  try {
    if (!await unsubscribe(req.params.token)) {
      return res.status(400).type("html").send("<h1>Invalid or expired unsubscribe link</h1>");
    }
    return res.type("html").send("<h1>You have been unsubscribed</h1><p>You will no longer receive these emails.</p>");
  } catch (error) {
    return next(error);
  }
});

// RFC 8058 one-click unsubscribe requests use POST and must not require a browser session.
publicRouter.post("/unsubscribe/:token", async (req, res, next) => {
  try {
    if (!await unsubscribe(req.params.token)) {
      return res.status(400).json({ error: "Invalid or expired unsubscribe link" });
    }
    return res.status(200).json({ unsubscribed: true });
  } catch (error) {
    return next(error);
  }
});
