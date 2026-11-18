// Quoting handles commas/newlines; the apostrophe prevents spreadsheet formulas.
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
}
