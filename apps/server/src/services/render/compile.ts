import type { Draft } from "../../schemas/template.schema.js";
import { ApiError } from "../../utils/apiError.js";

const samples: Record<string, string> = {
  name: "Aarav", email: "aarav@example.test", college: "Rishihood University", ticket_id: "RF-2026-0412",
};
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]!));
const tokens = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;
const variableCandidates = /\{\{([^{}]*)\}\}/g;
const variableName = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function extractTemplateVariables(values: string[]): string[] {
  const variables = new Set<string>();

  for (const value of values) {
    for (const match of value.matchAll(variableCandidates)) {
      const name = match[1].trim();
      if (!variableName.test(name)) {
        throw new ApiError(
          400,
          `Invalid variable name "${name}". Use letters, numbers, and underscores; names cannot start with a number.`,
        );
      }
      variables.add(name);
    }
  }

  return [...variables];
}

function link(value: string, sample: boolean) {
  try {
    const url = new URL(value);
    if (["http:", "https:"].includes(url.protocol) && !url.username && !url.password) return url.href;
  } catch {
    // A draft can contain a link that is still being edited.
  }
  if (sample) return "";
  throw new ApiError(400, "Images and buttons need valid HTTP or HTTPS URLs.");
}

export function compileTemplate(draft: Draft, sample = false) {
  const texts = [draft.subject, draft.previewText];
  for (const block of draft.blocks) {
    if (block.type === "text") texts.push(block.text);
    if (block.type === "button") texts.push(block.label);
    if (block.type === "image") texts.push(block.alt);
  }
  const variables = extractTemplateVariables(texts);
  if (variables.some(key => key.length > 64 || ["__proto__", "prototype", "constructor"].includes(key))) {
    throw new ApiError(400, "Merge field names must be at most 64 characters and cannot use reserved names.");
  }
  if (!sample && (!draft.name.trim() || !draft.subject.trim() || !draft.blocks.length)) {
    throw new ApiError(400, "Add a template name, subject, and at least one block.");
  }
  const fill = (value: string) => sample ? value.replace(tokens, (_match, key) => Object.hasOwn(samples, key) ? samples[key] : `[Sample ${key}]`) : value;
  const safe = (value: string) => escape(fill(value));
  const plain: string[] = [];
  const rows = draft.blocks.map((block) => {
    let body = "";
    switch (block.type) {
      case "text":
        plain.push(fill(block.text));
        body = `<p style="margin:0;font-size:${block.size}px;font-weight:${block.weight};line-height:1.55;color:${block.muted ? "#78716c" : draft.page.text}">${safe(block.text).replace(/\r?\n/g, "<br>")}</p>`;
        break;
      case "button": {
        const href = link(block.href, sample);
        plain.push(href ? `${fill(block.label)}: ${href}` : fill(block.label));
        const style = `display:inline-block;background:${block.color ?? "#1c1917"};color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600`;
        body = href ? `<a href="${escape(href)}" style="${style}">${safe(block.label)}</a>` : `<span style="${style}">${safe(block.label)}</span>`;
        break;
      }
      case "image": {
        const src = link(block.src, sample);
        if (block.alt) plain.push(fill(block.alt));
        if (src) body = `<img src="${escape(src)}" alt="${safe(block.alt)}" width="${draft.page.width - 48}" style="display:block;width:100%;max-width:100%;height:auto;border:0">`;
        break;
      }
      case "divider": body = '<hr style="border:0;border-top:1px solid #e7e5e4">'; break;
      case "spacer": return `<tr><td height="${block.height}" style="font-size:1px">&nbsp;</td></tr>`;
    }
    return body ? `<tr><td align="${block.align ?? draft.page.align}" style="padding:8px 24px">${body}</td></tr>` : "";
  }).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:${draft.page.bg}"><div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${safe(draft.previewText)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 8px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:${draft.page.width}px;background:#fff;color:${draft.page.text};font-family:Arial,sans-serif"><tr><td height="16"></td></tr>${rows}<tr><td height="16"></td></tr></table></td></tr></table></body></html>`;
  const text = plain.join("\n\n").trim();
  if (!sample && !text) throw new ApiError(400, "Add text or describe your image before publishing or sending.");
  return { subject: fill(draft.subject), previewText: fill(draft.previewText), html, text, variables };
}
