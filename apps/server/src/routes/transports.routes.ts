import { syncResendDomains } from "../services/domains.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resourceParams } from "../middleware/orgAccess.js";
import { Router } from "express";
import { requirePermission } from "../middleware/requirePermission.js";
import { validate } from "../middleware/validate.js";
import * as schema from "../schemas/transport.schema.js";
import * as service from "../services/transport.service.js";

export const transportRouter = Router({ mergeParams: true });

transportRouter.get(
  "/",
  requirePermission("manage_transport"),
  validate({ params: schema.orgParams }),
  async (req, res, next) => {
    try {
      res.json({ data: await service.list(req.params.orgId as string) });
    } catch (err) {
      next(err);
    }
  },
);

transportRouter.post(
  "/",
  requirePermission("manage_transport"),
  validate({ params: schema.orgParams, body: schema.createTransportBody }),
  async (req, res, next) => {
    try {
      res.status(201).json({ data: await service.create(req.params.orgId as string, req.body) });
    } catch (err) {
      next(err);
    }
  },
);

transportRouter.post(
  "/:id/test",
  requirePermission("manage_transport"),
  asyncHandler(async (req, res) => {
    const { orgId, id } = resourceParams.parse(req.params);
    res.json({ data: await service.checkConnection(orgId, id) });
  }),
);

transportRouter.post(
  "/:id/domains/sync",
  requirePermission("manage_transport"),
  asyncHandler(async (req, res) => {
    const { orgId, id } = resourceParams.parse(req.params);
    res.json({ data: await syncResendDomains(orgId, id) });
  }),
);
