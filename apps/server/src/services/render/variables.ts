export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Extracts all unique {{variable}} names found inside blocks, subject, or strings.
 */
export function extractVariables(content: unknown): string[] {
  if (!content) return [];
  const text = typeof content === "string" ? content : JSON.stringify(content);
  const matches = text.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);
  if (!matches) return [];

  const set = new Set<string>();
  for (const m of matches) {
    const key = m.replace(/[{}]/g, "").trim();
    if (key) set.add(key);
  }
  return Array.from(set);
}

/**
 * Replaces {{variable}} placeholders with values from sample/contact data.
 */
export function interpolateVariables(
  str: string,
  data: Record<string, unknown> = {},
  shouldEscapeHtml: boolean = true,
): string {
  if (!str) return "";
  return str.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    const val = data[key];
    if (val === undefined || val === null) {
      return match;
    }
    const strVal = String(val);
    return shouldEscapeHtml ? escapeHtml(strVal) : strVal;
  });
}
