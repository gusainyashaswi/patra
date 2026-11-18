import { csvCell } from "../lib/csv.js";
import { RECIPIENT_STATUSES } from "@patra/shared/enums";
import { streamCampaign, publishCampaign } from "../services/campaign-events.js";
import { Router } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { resourceParams, objectId } from "../middleware/orgAccess.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { Campaign, CampaignRecipient } from "../models/campaign.model.js";
import { startSend } from "../services/send.service.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { validateCampaignLinks, estimateCampaign } from "../services/campaign-options.js";
import { TemplateVersion } from "../models/template.model.js";
import { SenderIdentity, Domain, MailTransport } from "../models/mailTransport.model.js";
import { List } from "../models/audience.model.js";

export const campaignRouter = Router({ mergeParams: true });
campaignRouter.use(requirePermission("manage_campaigns"));

const createCampaignBody = z.object({
  name: z.string().trim().min(1).max(120),
  templateVersionId: objectId,
  senderIdentityId: objectId,
  listId: objectId,
});

campaignRouter.get("/options", asyncHandler(async (req, res) => {
  const organizationId = req.user!.organizationId!;
  const [versions, senders, lists] = await Promise.all([
    TemplateVersion.find({ organizationId }).select("subject version templateId").sort({ createdAt: -1 }),
    SenderIdentity.find({ organizationId }).select("displayName fromEmail domainId"),
    List.find({ organizationId }).select("name"),
  ]);
  const transports = await MailTransport.distinct("_id", { organizationId, type: "RESEND", status: "VERIFIED" });
  const domains = await Domain.find({ organizationId, verified: true, transportId: { $in: transports } });
  const allowed = new Map(domains.map(domain => [domain.id, domain.name]));
  const verifiedSenders = senders.filter(sender => allowed.get(String(sender.domainId)) === sender.fromEmail.split("@").at(-1));
  res.json({ data: { versions, senders: verifiedSenders, lists } });
}));

campaignRouter.post("/estimate", asyncHandler(async (req, res) => {
  const input = createCampaignBody.parse(req.body);
  res.json({ data: await estimateCampaign(req.user!.organizationId!, input) });
}));

campaignRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const campaigns = await Campaign.find({
      organizationId: req.user!.organizationId,
    }).sort({ createdAt: -1 });

    res.json({ data: campaigns });
  }),
);

campaignRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createCampaignBody.parse(req.body);
    await validateCampaignLinks(req.user!.organizationId!, input);
    const campaign = await Campaign.create({
      ...input,
      organizationId: req.user!.organizationId,
      status: "DRAFT",
      counters: {
        totalRecipients: 0,
        sentCount: 0,
        deliveredCount: 0,
        bouncedCount: 0,
        failedCount: 0,
      },
    });

    res.status(201).json({ data: campaign });
  }),
);

campaignRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { orgId, id } = resourceParams.parse(req.params);
    const campaign = await Campaign.findOne({
      _id: id,
      organizationId: orgId,
    });

    if (!campaign) throw new ApiError(404, "Campaign not found");
    await publishCampaign(orgId, id);
    res.json({ data: campaign });
  }),
);

// Rule 1 & Rule 2: POST /send locks with conditional update DRAFT -> QUEUED and returns 202
campaignRouter.post(
  "/:id/send",
  requirePermission("send_campaigns"),
  asyncHandler(async (req, res) => {
    const { orgId, id } = resourceParams.parse(req.params);
    const result = await startSend(orgId, id, String(req.user!._id));

    res.status(202).json({
      status: "accepted",
      message: "Campaign queued for sending",
      data: result,
    });
  }),
);

campaignRouter.post(
  "/:id/pause",
  asyncHandler(async (req, res) => {
    const { orgId, id } = resourceParams.parse(req.params);
    const campaign = await Campaign.findOneAndUpdate(
      { _id: id, organizationId: orgId, status: { $in: ["QUEUED", "SENDING"] } },
      { $set: { status: "PAUSED" } },
      { new: true },
    );

    if (!campaign) {
      const current = await Campaign.findOne({ _id: id, organizationId: orgId });
      if (!current) throw new ApiError(404, "Campaign not found");
      if (current.status === "PAUSED") return res.json({ data: current });
      throw new ApiError(409, "Only QUEUED or SENDING campaigns can be paused");
    }

    await publishCampaign(orgId, id);
    res.json({ data: campaign });
  }),
);

campaignRouter.post(
  "/:id/resume",
  asyncHandler(async (req, res) => {
    const { orgId, id } = resourceParams.parse(req.params);
    const campaign = await Campaign.findOneAndUpdate(
      { _id: id, organizationId: orgId, status: "PAUSED" },
      { $set: { status: "SENDING" } },
      { new: true },
    );

    if (!campaign) {
      const current = await Campaign.findOne({ _id: id, organizationId: orgId });
      if (!current) throw new ApiError(404, "Campaign not found");
      if (["QUEUED", "SENDING", "COMPLETED"].includes(current.status)) return res.json({ data: current });
      throw new ApiError(409, "Only PAUSED campaigns can be resumed");
    }

    await publishCampaign(orgId, id);
    res.json({ data: campaign });
  }),
);

campaignRouter.get("/:id/stream", asyncHandler(async (req, res) => {
  const { orgId, id } = resourceParams.parse(req.params);
  if (!await Campaign.exists({ _id: id, organizationId: orgId })) throw new ApiError(404, "Campaign not found");
  await streamCampaign(req, res, orgId, id);
}));

const recipientQuery = z.object({
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(RECIPIENT_STATUSES).optional(),
});

campaignRouter.get("/:id/recipients/export", asyncHandler(async (req, res) => {
  const { orgId, id } = resourceParams.parse(req.params);
  const { status } = recipientQuery.parse(req.query);
  if (!await Campaign.exists({ _id: id, organizationId: orgId })) throw new ApiError(404, "Campaign not found");
  res.type("text/csv").attachment("campaign-recipients.csv");
  res.write("Email,Status,Error,Requires review\r\n");
  const cursor = CampaignRecipient.find({ organizationId: orgId, campaignId: id, ...(status ? { status } : {}) }).sort({ _id: 1 }).cursor();
  try {
    for await (const row of cursor) {
      if (res.destroyed) break;
      if (!res.write([row.email, row.status, row.error, row.requiresReview ? "Yes" : "No"].map(csvCell).join(",") + "\r\n")) {
        await new Promise<void>(resolve => {
          const done = () => { res.off("drain", done); res.off("close", done); resolve(); };
          res.once("drain", done); res.once("close", done);
        });
      }
    }
  } finally { await cursor.close(); }
  res.end();
}));

campaignRouter.get(
  "/:id/recipients",
  asyncHandler(async (req, res) => {
    const { orgId, id } = resourceParams.parse(req.params);
    const { page, limit, status } = recipientQuery.parse(req.query);

    const filter: Record<string, unknown> = {
      campaignId: new Types.ObjectId(id),
      organizationId: new Types.ObjectId(orgId),
    };

    if (!(await Campaign.exists({ _id: id, organizationId: orgId }))) throw new ApiError(404, "Campaign not found");
    if (status) {
      filter.status = status;
    }

    const [rows, total] = await Promise.all([
      CampaignRecipient.find(filter)
        .sort({ createdAt: 1 })
        .skip(page * limit)
        .limit(limit),
      CampaignRecipient.countDocuments(filter),
    ]);

    res.json({
      data: {
        rows,
        total,
        page,
        limit,
      },
    });
  }),
);
