import express, { Router } from "express";
import multer from "multer";
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

const importMimeTypes = [
  "application/octet-stream",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const multipartImport = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    callback(null, importMimeTypes.includes(file.mimetype));
  },
});
const rawImport = express.raw({ type: importMimeTypes, limit: "5mb", inflate: false });
const importUpload = [multipartImport.single("file"), rawImport];
const importQuery = z.object({ filename: z.string().min(1).max(255).optional() });
const commitQuery = importQuery.extend({
  requestId: z.string().uuid(),
  listId: objectId.optional(),
  listName: z.string().trim().min(1).max(100).optional(),
  duplicateMode: z.enum(["skip", "update"]).default("update"),
}).refine((options) => Boolean(options.listId) !== Boolean(options.listName), "Choose an existing list or enter a new list name.");

function importInput(req: express.Request): { filename: string; bytes: Buffer } {
  const { filename: queryFilename } = importQuery.parse(req.query);
  if (req.file) {
    const filename = queryFilename ?? req.file.originalname;
    if (!filename) throw new ApiError(400, "The uploaded file needs a filename.");
    return { filename, bytes: req.file.buffer };
  }
  if (!queryFilename || !Buffer.isBuffer(req.body)) throw new ApiError(400, "Upload a CSV or Excel file.");
  return { filename: queryFilename, bytes: req.body };
}

contactRouter.post("/import/preview", ...importUpload, asyncHandler(async (req, res) => {
  const { filename, bytes } = importInput(req);
  const result = await analyzeImport(req.user!.organizationId!, filename, bytes);
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

contactRouter.post("/import", ...importUpload, asyncHandler(async (req, res) => {
  const options = commitQuery.parse(req.query);
  const organizationId = req.user!.organizationId!;
  const { filename, bytes } = importInput(req);
  const result = await analyzeImport(organizationId, filename, bytes);
  res.status(201).json({ data: await saveImport(organizationId, result, options) });
}));

function csvCell(value: string | number) {
  const text = String(value);
  // Stop spreadsheet apps from running formulas in exported cells.
  const safe = /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
}

contactRouter.post("/import/rejected", ...importUpload, asyncHandler(async (req, res) => {
  const { filename, bytes } = importInput(req);
  const result = await analyzeImport(req.user!.organizationId!, filename, bytes);
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
const createContactBody = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().max(200).optional(),
  college: z.string().trim().max(2000).optional(),
  listId: objectId.optional(),
  listName: z.string().trim().min(1).max(100).optional(),
}).refine((options) => Boolean(options.listId) !== Boolean(options.listName), "Choose an existing audience or enter a new audience name.");
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

contactRouter.get("/fields", asyncHandler(async (req, res) => {
  const rows = await Contact.aggregate<{ _id: string }>([
    { $match: { organizationId: new Types.ObjectId(req.user!.organizationId!) } },
    { $project: { fields: { $objectToArray: { $cond: [{ $eq: [{ $type: "$customFields" }, "object"] }, "$customFields", {}] } } } },
    { $unwind: "$fields" }, { $group: { _id: "$fields.k" } }, { $sort: { _id: 1 } }, { $limit: 200 },
  ]);
  const fields = rows.map(row => row._id).filter(key => /^\w{1,64}$/.test(key) && !["__proto__", "prototype", "constructor", "name", "email"].includes(key));
  res.json({ data: fields });
}));

contactRouter.post("/", asyncHandler(async (req, res) => {
  const input = createContactBody.parse(req.body);
  const organizationId = new Types.ObjectId(req.user!.organizationId!);
  const changes: Record<string, string> = {};
  if (input.name) changes.name = input.name;
  if (input.college) changes["customFields.college"] = input.college;
  const contact = await Contact.findOneAndUpdate(
    { organizationId, email: input.email },
    {
      ...(Object.keys(changes).length ? { $set: changes } : {}),
      $setOnInsert: { organizationId, email: input.email },
    },
    { upsert: true, new: true, runValidators: true },
  );
  const list = input.listId
    ? await List.findOneAndUpdate({ _id: input.listId, organizationId }, { $addToSet: { contactIds: contact._id } }, { new: true })
    : await List.findOneAndUpdate(
      { organizationId, name: input.listName },
      { $setOnInsert: { organizationId, name: input.listName }, $addToSet: { contactIds: contact._id } },
      { upsert: true, new: true, runValidators: true },
    );
  if (!list) throw new ApiError(404, "Audience not found");
  res.status(201).json({ data: { contact, list: { id: list.id, name: list.name, count: list.contactIds.length } } });
}));

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
