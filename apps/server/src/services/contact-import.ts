import { Types } from "mongoose";
import type { AnyBulkWriteOperation } from "mongoose";
import { z } from "zod";
import { Contact, List, Suppression, type IContact } from "../models/audience.model.js";
import { ApiError } from "../utils/apiError.js";
import { readContactFile } from "./contact-file.js";

const emailSchema = z.string().email().max(254);
const reserved = new Set(["constructor", "prototype", "__proto__"]);
const batchSize = 1000;
type ContactRow = { line: number; email: string; name: string; customFields: Record<string, string> };
type RejectedRow = { line: number; email: string; name: string; reason: string };

export async function suppressedEmails(organizationId: string, emails: string[]) {
  return new Set(await Suppression.distinct("email", { organizationId, email: { $in: emails } }));
}

export async function analyzeImport(organizationId: string, filename: string, file: Buffer) {
  const [header, ...body] = await readContactFile(filename, file);
  const columns = header.map((value) => value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, ""));
  let emailIndex = columns.findIndex((name) => ["email", "email_address", "e_mail"].includes(name));
  if (emailIndex < 0) emailIndex = body.find((row) => row.some((cell) => emailSchema.safeParse(cell.trim()).success))
    ?.findIndex((cell) => emailSchema.safeParse(cell.trim()).success) ?? -1;
  if (emailIndex < 0) throw new ApiError(400, "Add an email column to the header row.");
  columns[emailIndex] = "email";
  const fields = columns.filter(Boolean);
  if (new Set(fields).size !== fields.length || fields.some((field) => field.length > 64 || reserved.has(field))) {
    throw new ApiError(400, "Column names must become unique field names of at most 64 characters.");
  }
  const nameIndex = columns.indexOf("name");
  const invalid: RejectedRow[] = [];
  const duplicate: RejectedRow[] = [];
  const suppressed: RejectedRow[] = [];
  const unique = new Map<string, ContactRow>();
  body.forEach((cells, index) => {
    if (!cells.some((cell) => cell.trim())) return;
    const email = (cells[emailIndex] ?? "").trim().toLowerCase();
    const name = (cells[nameIndex] ?? "").trim();
    const line = index + 2;
    const row = { line, email: email.slice(0, 254), name: name.slice(0, 200) };
    if (!emailSchema.safeParse(email).success || cells.length > columns.length || name.length > 200 || cells.some((cell) => cell.length > 2000)) {
      invalid.push({ ...row, reason: !emailSchema.safeParse(email).success ? "Invalid email address" : "Row has extra columns or a value is too long" });
      return;
    }
    if (unique.has(email)) {
      duplicate.push({ ...row, reason: "Appears earlier in this file" });
      return;
    }
    const customFields = Object.fromEntries(columns.flatMap((column, i) => {
      const value = cells[i]?.trim();
      return column && i !== emailIndex && i !== nameIndex && value ? [[column, value]] : [];
    }));
    unique.set(email, { ...row, customFields });
  });
  const rows = [...unique.values()];
  const ready: ContactRow[] = [];
  const existing = new Set<string>();
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const emails = batch.map((row) => row.email);
    const [blocked, known] = await Promise.all([
      suppressedEmails(organizationId, emails),
      Contact.distinct("email", { organizationId, email: { $in: emails } }),
    ]);
    known.forEach((email) => existing.add(email));
    for (const row of batch) {
      if (blocked.has(row.email)) suppressed.push({ line: row.line, email: row.email, name: row.name, reason: "Address is suppressed" });
      else ready.push(row);
    }
  }
  return { ready, invalid, duplicate, suppressed, existing, fields: fields.filter((item) => item !== "email" && item !== "name") };
}

export async function saveImport(
  organizationId: string,
  imported: Awaited<ReturnType<typeof analyzeImport>>,
  options: { requestId: string; listId?: string; listName?: string; duplicateMode: "skip" | "update" },
) {
  const { listId, listName, requestId, duplicateMode } = options;
  if (!imported.ready.length) throw new ApiError(400, "There are no sendable rows to import.");
  if (listId && !(await List.exists({ _id: listId, organizationId }))) throw new ApiError(404, "List not found");
  const contactIds = [];
  let added = 0;
  let updated = 0;
  for (let offset = 0; offset < imported.ready.length; offset += batchSize) {
    const batch = imported.ready.slice(offset, offset + batchSize);
    const writes: AnyBulkWriteOperation<IContact>[] = batch.map(({ email, name, customFields }) => {
      const filter = { organizationId: new Types.ObjectId(organizationId), email };
      const changes: Record<string, string> = Object.fromEntries(
        Object.entries(customFields).map(([key, value]) => [`customFields.${key}`, value]),
      );
      if (name) changes.name = name;
      return {
        updateOne: {
          filter,
          update: duplicateMode === "update" && Object.keys(changes).length
            ? { $set: changes, $setOnInsert: filter }
            : { $setOnInsert: { ...filter, name, customFields } },
          upsert: true,
        },
      };
    });
    const result = await Contact.bulkWrite(writes, { ordered: false });
    added += result.upsertedCount;
    if (duplicateMode === "update") updated += result.matchedCount;
    const ids = await Contact.distinct("_id", { organizationId, email: { $in: batch.map((row) => row.email) } });
    contactIds.push(...ids);
  }
  const filter = listId ? { _id: listId, organizationId } : { organizationId, importKey: requestId };
  const list = await List.findOneAndUpdate(filter, {
    ...(listId ? {} : { $setOnInsert: { organizationId, importKey: requestId, name: listName } }),
    $addToSet: { contactIds: { $each: contactIds } },
  }, { upsert: !listId, new: true, runValidators: true });
  if (!list) throw new ApiError(404, "List not found");
  return {
    list: { id: list.id, name: list.name, count: list.contactIds.length }, added, updated, included: contactIds.length,
    skipped: imported.invalid.length + imported.duplicate.length + imported.suppressed.length,
  };
}
