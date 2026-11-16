import { Router } from "express";
import { resourceParams } from "../middleware/orgAccess.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validate } from "../middleware/validate.js";
import * as schema from "../schemas/template.schema.js";
import * as service from "../services/template.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const templateRouter = Router({ mergeParams: true });

// Require permission for all template operations
templateRouter.use(requirePermission("manage_templates"));

// 1. GET /api/orgs/:orgId/templates — List all templates with latest version
templateRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const data = await service.listTemplates(orgId);
    res.json({ data });
  }),
);

// 2. POST /api/orgs/:orgId/templates — Create a new template draft
templateRouter.post(
  "/",
  validate({ body: schema.createTemplateBody }),
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const data = await service.createTemplate(orgId, req.body);
    res.status(201).json({ data });
  }),
);

// 3. GET /api/orgs/:orgId/templates/:id — Fetch template draft & version history
templateRouter.get(
  "/:id",
  validate({ params: resourceParams }),
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const id = req.params.id as string;
    const data = await service.getTemplate(orgId, id);
    res.json({ data });
  }),
);

// 4. PUT /api/orgs/:orgId/templates/:id/draft — Autosave draft canvas blocks
templateRouter.put(
  "/:id/draft",
  validate({ params: resourceParams, body: schema.saveDraftBody }),
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const id = req.params.id as string;
    const data = await service.saveDraft(orgId, id, req.body);
    res.json({ data });
  }),
);

// 5. POST /api/orgs/:orgId/templates/:id/publish — Compile blocks, increment version ($inc), store immutable TemplateVersion
templateRouter.post(
  "/:id/publish",
  validate({ params: resourceParams, body: schema.publishTemplateBody }),
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const id = req.params.id as string;
    const data = await service.publishTemplate(orgId, id, req.body);
    res.status(201).json({ data });
  }),
);

// 6. POST /api/orgs/:orgId/templates/:id/preview — Render HTML with sample variable values
templateRouter.post(
  "/:id/preview",
  validate({ params: resourceParams, body: schema.previewTemplateBody }),
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const id = req.params.id as string;
    const data = await service.previewTemplate(orgId, id, req.body?.sampleData);
    res.json({ data });
  }),
);

// 7. POST /api/orgs/:orgId/templates/:id/test-send — Send a test email to the user's address via Resend
templateRouter.post(
  "/:id/test-send",
  validate({ params: resourceParams, body: schema.testSendBody }),
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId!;
    const id = req.params.id as string;
    const userEmail = req.user?.email;
    const data = await service.testSendTemplate(orgId, id, req.body, userEmail);
    res.json({ data });
  }),
);
