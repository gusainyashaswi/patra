import express, { Router } from "express";
import { Types, type PipelineStage } from "mongoose";
import { z } from "zod";
import { objectId } from "../middleware/orgAccess.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { Contact, List, Suppression } from "../models/audience.model.js";
import { analyzeImport, saveImport } from "../services/contact-import.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const contactRouter = Router({ mergeParams: true });
export const listRouter = Router({ mergeParams: true });
contactRouter.use(requirePermission("manage_contacts"));
listRouter.use(requirePermission("manage_contacts"));

const upload = express.raw({ type: "application/octet-stream", limit: "5mb", inflate: false });
const importQuery = z.object({ filename: z.string().min(1).max(255) });
const commitQuery = importQuery.extend({
  requestId: z.string().uuid(),
  listId: objectId.optional(),
  listName: z.string().trim().min(1).max(100).optional(),
  duplicateMode: z.enum(["skip", "update"]).default("update"),
}).refine((options) => Boolean(options.listId) !== Boolean(options.listName), "Choose an existing list or enter a new list name.");

function importBytes(body: unknown): Buffer {
  if (!Buffer.isBuffer(body)) throw new ApiError(400, "Upload a CSV or Excel file.");
  return body;
}

contactRouter.post("/import/preview", upload, asyncHandler(async (req, res) => {
  const { filename } = importQuery.parse(req.query);
  const result = await analyzeImport(req.user!.organizationId!, filename, importBytes(req.body));
  const counts = {
    valid: result.ready.length,
    invalid: result.invalid.length,
    duplicate: result.duplicate.length,
    suppressed: result.suppressed.length,
    existing: result.ready.filter((row) => result.existing.has(row.email)).length,
  };
  res.json({ data: {
    counts, fields: result.fields,
    valid: result.ready.slice(0, 100).map((row) => ({ ...row, existing: result.existing.has(row.email) })),
    invalid: result.invalid.slice(0, 100),
    duplicate: result.duplicate.slice(0, 100),
    suppressed: result.suppressed.slice(0, 100),
  } });
}));

contactRouter.post("/import", upload, asyncHandler(async (req, res) => {
  const options = commitQuery.parse(req.query);
  const organizationId = req.user!.organizationId!;
  const result = await analyzeImport(organizationId, options.filename, importBytes(req.body));
  res.status(201).json({ data: await saveImport(organizationId, result, options) });
}));

function csvCell(value: string | number) {
  const text = String(value);
  // Stop spreadsheet apps from running formulas in exported cells.
  const safe = /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
}

contactRouter.post("/import/rejected", upload, asyncHandler(async (req, res) => {
  const { filename } = importQuery.parse(req.query);
  const result = await analyzeImport(req.user!.organizationId!, filename, importBytes(req.body));
  const rows = [...result.invalid, ...result.duplicate, ...result.suppressed].sort((a, b) => a.line - b.line);
  const csv = rows.map(({ line, email, name, reason }) => [line, email, name, reason].map(csvCell).join(",")).join("\r\n");
  res.type("text/csv").attachment("skipped-contacts.csv").send("Row,Email,Name,Reason\r\n" + csv);
}));

const contactQuery = z.object({
  q: z.string().trim().max(100).default(""),
  view: z.enum(["all", "active", "suppressed"]).default("all"),
  page: z.coerce.number().int().min(0).max(50_000).default(0),
  listId: objectId.optional(),
});
const pageSize = 12;

function joinSuppression(organizationId: Types.ObjectId): PipelineStage.Lookup {
  return {
    $lookup: {
      from: Suppression.collection.name,
      localField: "email", foreignField: "email",
      pipeline: [{ $match: { organizationId } }, { $project: { reason: 1, _id: 0 } }, { $limit: 1 }],
      as: "suppression",
    },
  };
}

contactRouter.get("/", asyncHandler(async (req, res) => {
  const { q, view, page, listId } = contactQuery.parse(req.query);
  const organizationId = new Types.ObjectId(req.user!.organizationId!);
  const filter: Record<string, unknown> = { organizationId };
  if (listId) {
    const list = await List.findOne({ organizationId, _id: listId }).select("contactIds");
    if (!list) throw new ApiError(404, "List not found");
    filter._id = { $in: list.contactIds };
  }
  if (q) {
    const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ email: pattern }, { name: pattern }, { "customFields.college": pattern }];
  }
  const filterView: PipelineStage.FacetPipelineStage[] = view === "all" ? [] :
    [{ $match: { "suppression.0": { $exists: view === "suppressed" } } }];
  const [result] = await Contact.aggregate([
    { $match: filter },
    joinSuppression(organizationId),
    { $facet: {
      counts: [{ $group: {
        _id: null, all: { $sum: 1 },
        suppressed: { $sum: { $cond: [{ $gt: [{ $size: "$suppression" }, 0] }, 1, 0] } },
      } }],
      rows: [
        ...filterView,
        { $sort: { email: 1, _id: 1 } }, { $skip: page * pageSize }, { $limit: pageSize },
        { $project: {
          _id: 0, id: { $toString: "$_id" }, email: 1, name: 1, college: "$customFields.college",
          suppressed: { $arrayElemAt: ["$suppression.reason", 0] },
        } },
      ],
    } },
  ]);
  const counts = result.counts[0] ?? { all: 0, suppressed: 0 };
  const active = counts.all - counts.suppressed;
  const total = view === "all" ? counts.all : view === "active" ? active : counts.suppressed;
  res.json({ data: { rows: result.rows, total, pageSize, counts: { all: counts.all, active, suppressed: counts.suppressed } } });
}));

listRouter.get("/", asyncHandler(async (req, res) => {
  const organizationId = new Types.ObjectId(req.user!.organizationId!);
  const data = await List.aggregate([
    { $match: { organizationId } },
    { $sort: { name: 1 } },
    { $project: { _id: 0, id: { $toString: "$_id" }, name: 1, count: { $size: "$contactIds" } } },
  ]);
  res.json({ data });
}));

listRouter.get("/:id/estimate", asyncHandler(async (req, res) => {
  const id = objectId.parse(req.params.id);
  const organizationId = new Types.ObjectId(req.user!.organizationId!);
  const list = await List.findOne({ organizationId, _id: id }).select("contactIds");
  if (!list) throw new ApiError(404, "List not found");
  const [result] = await Contact.aggregate([
    { $match: { organizationId, _id: { $in: list.contactIds } } },
    joinSuppression(organizationId),
    { $group: {
      _id: null, total: { $sum: 1 },
      suppressed: { $sum: { $cond: [{ $gt: [{ $size: "$suppression" }, 0] }, 1, 0] } },
    } },
  ]);
  const { total, suppressed } = result ?? { total: 0, suppressed: 0 };
  res.json({ data: { total, suppressed, sendable: total - suppressed } });
}));
