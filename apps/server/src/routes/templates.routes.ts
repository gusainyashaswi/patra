import express, { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import mongoose from "mongoose";
import { resourceParams, objectId } from "../middleware/orgAccess.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { Template, TemplateVersion, type ITemplate } from "../models/template.model.js";
import type { HydratedDocument } from "mongoose";
import { draftSchema } from "../schemas/template.schema.js";
import { compileTemplate } from "../services/render/compile.js";
import { sendTemplateTest } from "../services/template-test.service.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const templateRouter = Router({ mergeParams: true });
templateRouter.use(requirePermission("manage_templates"), express.json({ limit: "768kb" }));
const revisionSchema = z.object({ revision: z.string().uuid() });
const saveSchema = revisionSchema.extend({ draft: draftSchema });
const testSchema = revisionSchema.extend({ senderId: objectId, requestId: z.string().uuid() });

function latestVersion(template: HydratedDocument<ITemplate>) {
  return TemplateVersion.findOne({ templateId: template._id, organizationId: template.organizationId }).sort({ version: -1 });
}

async function serialize(template: HydratedDocument<ITemplate>) {
  const latest = await latestVersion(template);
  return {
    ...draftSchema.parse(template.draftBlocks),
    id: template.id,
    revision: template.draftRevision,
    status: latest && latest.draftRevision === template.draftRevision ? "PUBLISHED" : "DRAFT",
    latestVersion: latest?.version ?? 0,
    updatedAt: template.get("updatedAt"),
  };
}

async function findTemplate(params: unknown) {
  const { orgId, id } = resourceParams.parse(params);
  const template = await Template.findOne({ _id: id, organizationId: orgId, draftRevision: { $exists: true } });
  if (!template) throw new ApiError(404, "Template not found");
  return template;
}

function checkRevision(template: HydratedDocument<ITemplate>, revision: string) {
  if (template.draftRevision !== revision) throw new ApiError(409, "This draft changed elsewhere. Reopen it before continuing.");
}

templateRouter.get("/", asyncHandler(async (req, res) => {
  const templates = await Template.find({ organizationId: req.user!.organizationId, draftRevision: { $exists: true } }).sort({ updatedAt: -1 });
  res.json({ data: await Promise.all(templates.map(serialize)) });
}));

templateRouter.post("/", asyncHandler(async (req, res) => {
  const draft = draftSchema.parse(req.body);
  const template = await Template.create({
    organizationId: req.user!.organizationId, name: draft.name.trim() || "Untitled template",
    draftBlocks: draft, draftRevision: randomUUID(),
  });
  res.status(201).json({ data: await serialize(template) });
}));

templateRouter.get("/:id", asyncHandler(async (req, res) => {
  res.json({ data: await serialize(await findTemplate(req.params)) });
}));

templateRouter.put("/:id/draft", asyncHandler(async (req, res) => {
  const { draft, revision } = saveSchema.parse(req.body);
  const current = await findTemplate(req.params);
  const template = await Template.findOneAndUpdate(
    { _id: current._id, organizationId: current.organizationId, draftRevision: revision },
    { $set: { name: draft.name.trim() || "Untitled template", draftBlocks: draft, draftRevision: randomUUID() } },
    { new: true, runValidators: true },
  );
  if (!template) throw new ApiError(409, "This draft changed elsewhere. Reopen it before saving.");
  res.json({ data: await serialize(template) });
}));

templateRouter.post("/:id/preview", asyncHandler(async (req, res) => {
  await findTemplate(req.params);
  res.json({ data: compileTemplate(draftSchema.parse(req.body), true) });
}));

templateRouter.post("/:id/publish", asyncHandler(async (req, res) => {
  const { revision } = revisionSchema.parse(req.body);
  const template = await findTemplate(req.params);
  checkRevision(template, revision);
  const draft = draftSchema.parse(template.draftBlocks);
  const compiled = compileTemplate(draft);
  let publishedVersion;
  let alreadyPublished = false;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const lockedTemplate = await Template.findOneAndUpdate(
        { _id: template._id, organizationId: template.organizationId, draftRevision: revision },
        { $set: { status: "PUBLISHED" } },
        { new: true, session },
      );
      if (!lockedTemplate) throw new ApiError(409, "This draft changed elsewhere. Reopen it before continuing.");

      const latest = await TemplateVersion.findOne({
        templateId: lockedTemplate._id,
        organizationId: lockedTemplate.organizationId,
      }).sort({ version: -1 }).session(session);
      if (latest?.draftRevision === revision) {
        publishedVersion = latest;
        alreadyPublished = true;
        return;
      }
      const [version] = await TemplateVersion.create([{
        ...compiled,
        blocks: draft.blocks,
        templateId: lockedTemplate._id,
        organizationId: lockedTemplate.organizationId,
        version: (latest?.version ?? 0) + 1,
        draftRevision: revision,
      }], { session });
      publishedVersion = version;
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    throw new ApiError(409, "A version was just published. Reopen the draft and try again.");
  } finally {
    await session.endSession();
  }
  res.status(alreadyPublished ? 200 : 201).json({ data: publishedVersion });
}));

templateRouter.post("/:id/test-send", requirePermission("send_campaigns"), asyncHandler(async (req, res) => {
  const { revision, senderId, requestId } = testSchema.parse(req.body);
  const template = await findTemplate(req.params);
  checkRevision(template, revision);
  const draft = draftSchema.parse(template.draftBlocks);
  compileTemplate(draft);
  res.json({ data: await sendTemplateTest(String(template.organizationId), senderId, req.user!.email, requestId, compileTemplate(draft, true)) });
}));
