import path from "node:path";
import * as xlsx from "xlsx";
import { Contact } from "../models/audience.model.js";
import { suppressionRepo } from "../repositories/suppression.repo.js";
import { ApiError } from "../utils/apiError.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ParsedContactRow {
  email: string;
  name?: string;
  customFields: Record<string, string>;
  status: "valid" | "invalid" | "duplicate_in_file" | "existing" | "suppressed";
  reason?: string;
}

export interface ImportPreviewResult {
  total: number;
  validCount: number;
  invalidCount: number;
  duplicateInFileCount: number;
  existingCount: number;
  suppressedCount: number;
  columns: string[];
  detectedEmailColumn: string;
  detectedNameColumn: string | null;
  previewRows: ParsedContactRow[];
  contacts: Array<{
    email: string;
    name?: string;
    customFields: Record<string, string>;
  }>;
}

export function parseFileBuffer(
  fileBuffer: Buffer,
  fileName: string,
): Array<Record<string, unknown>> {
  const ext = path.extname(fileName).toLowerCase();
  if (ext !== ".csv" && ext !== ".xlsx" && ext !== ".xls") {
    throw new ApiError(400, "Unsupported file format. Please upload a .csv or .xlsx file.");
  }

  try {
    const workbook = xlsx.read(fileBuffer, {
      type: "buffer",
      cellFormula: false,
      cellHTML: false,
      raw: false,
    });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new ApiError(400, "The spreadsheet has no worksheets.");
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      blankrows: false,
    });

    if (rows.length === 0) {
      throw new ApiError(400, "The uploaded spreadsheet has no data rows.");
    }

    if (rows.length > 50000) {
      throw new ApiError(400, "Spreadsheet exceeds maximum limit of 50,000 rows.");
    }

    return rows;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, `Failed to parse file: ${error?.message || "Invalid format"}`);
  }
}

export async function previewContactImport(
  organizationId: string,
  fileBuffer: Buffer,
  fileName: string,
): Promise<ImportPreviewResult> {
  const rawRows = parseFileBuffer(fileBuffer, fileName);

  const columns = Object.keys(rawRows[0] || {});
  if (!columns.length) {
    throw new ApiError(400, "Could not detect any headers in the uploaded file.");
  }

  // 1. Detect Email Column
  let detectedEmailColumn = columns.find((col) =>
    /^(email|e-mail|mail|email_address|emailaddress)$/i.test(col.trim()),
  );

  if (!detectedEmailColumn) {
    // Fall back to first column with cells containing '@'
    for (const col of columns) {
      const hasAt = rawRows.slice(0, 15).some((row) => {
        const val = String(row[col] ?? "");
        return val.includes("@") && EMAIL_REGEX.test(val.trim());
      });
      if (hasAt) {
        detectedEmailColumn = col;
        break;
      }
    }
  }

  if (!detectedEmailColumn) {
    throw new ApiError(
      400,
      "Could not detect an email column. Please make sure your file has a header like 'email'.",
    );
  }

  // 2. Detect Name Column (optional)
  const detectedNameColumn =
    columns.find((col) =>
      /^(name|full_name|fullname|contact_name|display_name|first_name)$/i.test(col.trim()),
    ) || null;

  // 3. Collect emails and customFields
  const seenInFile = new Set<string>();
  const parsedRows: ParsedContactRow[] = [];
  const candidateEmails: string[] = [];

  for (const row of rawRows) {
    const rawEmail = String(row[detectedEmailColumn] ?? "").trim();
    const email = rawEmail.toLowerCase();
    const name = detectedNameColumn ? String(row[detectedNameColumn] ?? "").trim() : undefined;

    // Build customFields from all other columns
    const customFields: Record<string, string> = {};
    for (const col of columns) {
      if (col !== detectedEmailColumn && col !== detectedNameColumn) {
        const val = row[col];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          customFields[col] = String(val).trim();
        }
      }
    }

    if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
      parsedRows.push({
        email: rawEmail || "(empty)",
        name,
        customFields,
        status: "invalid",
        reason: "Invalid email syntax",
      });
      continue;
    }

    if (seenInFile.has(email)) {
      parsedRows.push({
        email,
        name,
        customFields,
        status: "duplicate_in_file",
        reason: "Duplicate within uploaded file",
      });
      continue;
    }

    seenInFile.add(email);
    candidateEmails.push(email);

    parsedRows.push({
      email,
      name,
      customFields,
      status: "valid",
    });
  }

  // 4. Check against Suppression list and existing Database Contacts
  const [suppressedSet, existingContacts] = await Promise.all([
    suppressionRepo.findSuppressedEmails(organizationId, candidateEmails),
    Contact.find({ organizationId, email: { $in: candidateEmails } })
      .select("email")
      .lean(),
  ]);

  const existingSet = new Set(existingContacts.map((c) => c.email.toLowerCase()));

  let validCount = 0;
  let invalidCount = 0;
  let duplicateInFileCount = 0;
  let existingCount = 0;
  let suppressedCount = 0;

  for (const row of parsedRows) {
    if (row.status === "invalid") {
      invalidCount++;
      continue;
    }
    if (row.status === "duplicate_in_file") {
      duplicateInFileCount++;
      continue;
    }

    if (suppressedSet.has(row.email)) {
      row.status = "suppressed";
      row.reason = "Email is on organization suppression list";
      suppressedCount++;
      continue;
    }

    if (existingSet.has(row.email)) {
      row.status = "existing";
      row.reason = "Email already exists in contacts";
      existingCount++;
      continue;
    }

    row.status = "valid";
    validCount++;
  }

  // Eligible contacts for commit (valid + existing)
  const contactsToImport = parsedRows
    .filter((r) => r.status === "valid" || r.status === "existing")
    .map((r) => ({
      email: r.email,
      name: r.name,
      customFields: r.customFields,
    }));

  return {
    total: rawRows.length,
    validCount,
    invalidCount,
    duplicateInFileCount,
    existingCount,
    suppressedCount,
    columns,
    detectedEmailColumn,
    detectedNameColumn,
    previewRows: parsedRows.slice(0, 25),
    contacts: contactsToImport,
  };
}
