import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { ensureDbConnected } from "../middleware/ensureDb.js";
import { requireOrgAccess } from "../middleware/orgAccess.js";
import { Membership, Organization } from "../models/identity.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { transportRouter } from "./transports.routes.js";
import { senderRouter } from "./senders.routes.js";

import { Domain } from "../models/mailTransport.model.js";
import { requirePermission } from "../middleware/requirePermission.js";

import { templateRouter } from "./templates.routes.js";
import { uploadRouter } from "./uploads.routes.js";
import { contactRouter, listRouter } from "./contacts.routes.js";
import { campaignRouter } from "./campaigns.routes.js";

export const orgRouter = Router();
const scopedRouter = Router({ mergeParams: true });

orgRouter.use(ensureDbConnected, requireAuth);
orgRouter.get("/", asyncHandler(async (req, res) => {
  const user = req.user!;
  const filter = user.isPlatformAdmin
    ? {}
    : { _id: { $in: await Membership.find({ userId: user._id }).distinct("organizationId") } };
  res.json({ data: await Organization.find(filter).sort({ name: 1 }) });
}));

scopedRouter.get("/", asyncHandler(async (req, res) => {
  res.json({ data: await Organization.findById(req.user!.organizationId) });
}));
scopedRouter.use("/transports", transportRouter);
scopedRouter.use("/senders", senderRouter);
scopedRouter.use("/templates", templateRouter);
scopedRouter.use("/uploads", uploadRouter);
scopedRouter.use("/contacts", contactRouter);
scopedRouter.use("/lists", listRouter);
scopedRouter.use("/campaigns", campaignRouter);
scopedRouter.get("/domains", requirePermission("manage_senders"), asyncHandler(async (req, res) => {
  const data = await Domain.find({ organizationId: req.user!.organizationId }).sort({ name: 1 });
  res.json({ data });
}));
orgRouter.use("/:orgId", requireOrgAccess, scopedRouter);
