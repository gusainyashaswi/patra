import { createRedisClient } from "../lib/redis.js";
import { Campaign } from "../models/campaign.model.js";
import type { Request, Response } from "express";

export const campaignChannel = (orgId: string, campaignId: string) => `campaign:${orgId}:${campaignId}`;
// Notifications are hints; MongoDB remains authoritative after reconnects.
export async function publishCampaign(orgId: string, campaignId: string) {
  const redis = createRedisClient({ lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null, connectTimeout: 1000 });
  redis.on("error", () => {});
  try { await redis.publish(campaignChannel(orgId, campaignId), JSON.stringify({ campaignId })); }
  catch { /* The client falls back to polling when Redis is unavailable. */ }
  finally { redis.disconnect(); }
}

export async function streamCampaign(req: Request, res: Response, orgId: string, campaignId: string) {
  const subscriber = createRedisClient({ maxRetriesPerRequest: 1, retryStrategy: () => null, connectTimeout: 1000 });
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let expiry: ReturnType<typeof setTimeout> | undefined;
  const close = () => { clearInterval(heartbeat); clearTimeout(expiry); subscriber.disconnect(); if (!res.writableEnded) res.end(); };
  res.on("close", close);
  subscriber.on("error", close);
  try {
    await subscriber.subscribe(campaignChannel(orgId, campaignId));
    if (res.destroyed) return close();
    res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    res.flushHeaders();
    const write = (event: string, data: unknown) => {
      if (!res.writableEnded && !res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)) close();
    };
    subscriber.on("message", () => write("change", { campaignId }));
    write("snapshot", await Campaign.findOne({ _id: campaignId, organizationId: orgId }));
    heartbeat = setInterval(() => write("heartbeat", { at: Date.now() }), 15000);
    // Bound stream lifetime so reconnects re-run authentication and permissions.
    expiry = setTimeout(close, 60000);
  } catch { close(); }
}
