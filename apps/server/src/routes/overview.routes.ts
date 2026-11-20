import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Campaign, CampaignRecipient } from "../models/campaign.model.js";
import { MailTransport, Domain, SenderIdentity } from "../models/mailTransport.model.js";
import { TemplateVersion } from "../models/template.model.js";
import { List } from "../models/audience.model.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const overviewRouter = Router({ mergeParams: true });
overviewRouter.get("/", requirePermission("view_overview"), asyncHandler(async (req, res) => {
  const { period } = z.object({ period: z.enum(["7d", "30d", "90d"]).default("30d") }).parse(req.query);
  const organizationId = new Types.ObjectId(req.user!.organizationId!);
  const until = new Date();
  const days = Number(period.slice(0, -1));
  const since = new Date(Date.UTC(until.getUTCFullYear(), until.getUTCMonth(), until.getUTCDate() - days + 1));
  const dateRange = { $gte: since, $lte: until };
  const fields = { sent: "sentAt", delivered: "deliveredAt", bounced: "bouncedAt", failed: "failedAt", opened: "openedAt" } as const;
  const counts = await Promise.all(Object.values(fields).map(field => CampaignRecipient.countDocuments({ organizationId, [field]: dateRange })));
  const stats = Object.fromEntries(Object.keys(fields).map((key, index) => [key, counts[index]]));
  stats.pending = await CampaignRecipient.countDocuments({ organizationId, status: "QUEUED" });
  const [campaigns, transports, domains, senders, versions, lists] = await Promise.all([
    Campaign.find({ organizationId }).sort({ createdAt: -1 }).limit(5),
    MailTransport.find({ organizationId }).select("name status type"),
    Domain.find({ organizationId }).select("name verified transportId"),
    SenderIdentity.find({ organizationId }).select("domainId transportId fromEmail"),
    TemplateVersion.countDocuments({ organizationId }), List.countDocuments({ organizationId, "contactIds.0": { $exists: true } }),
  ]);
  const verifiedTransports = new Set(transports.filter(t => t.type === "RESEND" && t.status === "VERIFIED").map(t => t.id));
  const verifiedDomains = new Set(domains.filter(d => d.verified && verifiedTransports.has(String(d.transportId))).map(d => d.id));
  const setup = [
    { label: "Connect Resend", href: "/settings", done: verifiedTransports.size > 0 },
    { label: "Add a verified sender", href: "/settings", done: senders.some(s => verifiedDomains.has(String(s.domainId))) },
    { label: "Import an audience", href: "/contacts/import", done: lists > 0 },
    { label: "Publish a template", href: "/templates", done: versions > 0 },
    { label: "Queue first campaign", href: "/campaigns/new", done: campaigns.length > 0 },
  ];
  const alerts = [
    ...transports.filter(t => t.status !== "VERIFIED").map(t => ({ tone: "warning", title: `${t.name} needs a connection test`, href: "/settings" })),
    ...domains.filter(d => !d.verified).map(d => ({ tone: "warning", title: `${d.name} is not verified`, href: "/settings" })),
    ...(stats.sent > 0 && stats.bounced / stats.sent > 0.02 ? [{ tone: "danger", title: "Bounce rate exceeds 2% for this period", href: "/campaigns" }] : []),
  ];
  const bucketDays = Math.ceil(days / 7);
  const length = Math.ceil(days / bucketDays);
  const series = { days: Array.from({ length }, (_, i) => new Date(since.getTime() + i * bucketDays * 86400000).toISOString().slice(5, 10)), delivered: Array(length).fill(0), bounced: Array(length).fill(0), failed: Array(length).fill(0) };
  for (const key of ["delivered", "bounced", "failed"] as const) {
    const field = fields[key];
    const rows = await CampaignRecipient.aggregate<{ _id: number; count: number }>([
      { $match: { organizationId, [field]: dateRange } },
      { $group: { _id: { $floor: { $divide: [{ $subtract: [`$${field}`, since] }, bucketDays * 86400000] } }, count: { $sum: 1 } } },
    ]);
    for (const row of rows) if (row._id >= 0 && row._id < length) series[key][row._id] = row.count;
  }
  res.json({ data: { period, since, until, timezone: "UTC", stats, series, campaigns, setup, alerts } });
}));
