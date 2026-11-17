import { parse } from "csv-parse/sync";
import { readSheet } from "read-excel-file/node";
import yauzl from "yauzl";
import { ApiError } from "../utils/apiError.js";

const MAX_ROWS = 50_000;
const MAX_COLUMNS = 64;
const MAX_EXPANDED_BYTES = 24 * 1024 * 1024;

async function checkWorkbook(file: Buffer) {
  const zip = await yauzl.fromBufferPromise(file, { validateEntrySizes: true });
  try {
    if (zip.entryCount > 512) throw new Error("Too many workbook parts");
    let size = 0;
    for await (const entry of zip.eachEntry()) {
      if (entry.fileName.endsWith("/")) continue;
      size += entry.uncompressedSize;
      if (size > MAX_EXPANDED_BYTES) throw new Error("Workbook is too large after decompression");
      const stream = await zip.openReadStreamPromise(entry);
      const sheet = /^xl\/worksheets\/[^/]+\.xml$/i.test(entry.fileName);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        if (sheet) chunks.push(chunk);
      }
      if (!sheet) continue;
      const xml = Buffer.concat(chunks).toString("utf8");
      for (const match of xml.matchAll(/\br\s*=\s*["']([A-Z]{0,3})(\d{1,7})["']/g)) {
        const column = [...match[1]].reduce((index, letter) => index * 26 + letter.charCodeAt(0) - 64, 0);
        if (column > MAX_COLUMNS || Number(match[2]) > MAX_ROWS + 1) {
          throw new Error("Workbook exceeds the row or column limit");
        }
      }
    }
  } finally {
    zip.close();
  }
}

export async function readContactFile(name: string, file: Buffer): Promise<string[][]> {
  if (!file.length) throw new ApiError(400, "The file is empty.");
  const extension = /\.(csv|xlsx)$/i.exec(name)?.[1].toLowerCase();
  if (extension !== "csv" && extension !== "xlsx") throw new ApiError(400, "Choose a .csv or .xlsx file.");
  let rows: string[][];
  try {
    if (extension === "xlsx") {
      await checkWorkbook(file);
      const sheet = await readSheet(file, 1);
      rows = sheet.map((row) => row.map((value) => value instanceof Date ? value.toISOString() : String(value ?? "")));
    } else {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(file);
      if (text.includes("\0")) throw new Error("Binary file");
      rows = parse(text, { bom: true, relax_column_count: true, max_record_size: 128 * 1024, to: MAX_ROWS + 2 });
    }
  } catch (error) {
    const detail = error instanceof Error && /Workbook|workbook parts/.test(error.message) ? ` ${error.message}.` : "";
    throw new ApiError(400, `Could not read this ${extension.toUpperCase()} file.${detail}`);
  }
  if (!rows.length) throw new ApiError(400, "The file has no header row.");
  if (rows.length > MAX_ROWS + 1 || rows.some((row) => row.length > MAX_COLUMNS)) {
    throw new ApiError(400, "Use at most 50,000 data rows and 64 columns.");
  }
  return rows;
}
