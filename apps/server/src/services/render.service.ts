import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { missingMergeFields } from "./contact-merge.js";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]!,
  );

const variableTokenRegex = /\{\{\s*(\w+)\s*\}\}/g;

export interface RenderParams {
  subject: string;
  html: string;
  text: string;
  variables: string[];
  data: Record<string, unknown>;
  organizationId: string;
  email: string;
  allowMissingVariables?: boolean;
}

export type RenderResult =
  | {
      success: true;
      subject: string;
      html: string;
      text: string;
      headers: Record<string, string>;
    }
  | {
      success: false;
      error: string;
      missing: string[];
    };

export function generateUnsubscribeToken(
  organizationId: string,
  email: string,
  expiresInDays = 30,
): string {
  const expiry = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const payload = `${organizationId}:${email.toLowerCase().trim()}:${expiry}`;
  const hmac = createHmac("sha256", env.CREDENTIALS_KEY);
  hmac.update(payload);
  const signature = hmac.digest("hex");

  const raw = JSON.stringify({
    o: organizationId,
    e: email.toLowerCase().trim(),
    x: expiry,
    s: signature,
  });

  return Buffer.from(raw, "utf8").toString("base64url");
}

export function verifyUnsubscribeToken(
  token: string,
): { valid: boolean; organizationId?: string; email?: string } {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parsed = JSON.parse(raw);
    const { o, e, x, s } = parsed;

    if (typeof o !== "string" || !/^[a-f0-9]{24}$/i.test(o) ||
        typeof e !== "string" || e.length > 254 || !/^[^\s@]+@[^\s@]+$/.test(e) ||
        typeof x !== "number" || !Number.isFinite(x) ||
        typeof s !== "string" || !/^[a-f0-9]{64}$/.test(s)) return { valid: false };
    if (Date.now() > Number(x)) return { valid: false };

    const payload = `${o}:${e}:${x}`;
    const hmac = createHmac("sha256", env.CREDENTIALS_KEY);
    hmac.update(payload);
    const expectedSig = hmac.digest("hex");

    if (!timingSafeEqual(Buffer.from(expectedSig, "hex"), Buffer.from(s, "hex"))) return { valid: false };

    return { valid: true, organizationId: o, email: e };
  } catch {
    return { valid: false };
  }
}

export function renderEmail(params: RenderParams): RenderResult {
  const { subject, html, text, variables, data, organizationId, email } = params;

  // Check required variables
  const missing = missingMergeFields(variables, data);

  if (missing.length > 0 && !params.allowMissingVariables) {
    return {
      success: false,
      error: `Missing required variables: ${missing.join(", ")}`,
      missing,
    };
  }

  const interpolateText = (template: string) =>
    template.replace(variableTokenRegex, (match, key) => {
      const val = data[key];
      return val !== undefined && val !== null ? String(val) : params.allowMissingVariables ? "" : match;
    });

  const interpolateHtml = (template: string) =>
    template.replace(variableTokenRegex, (match, key) => {
      const val = data[key];
      return val !== undefined && val !== null ? escapeHtml(String(val)) : params.allowMissingVariables ? "" : match;
    });

  const renderedSubject = interpolateText(subject);
  let renderedHtml = interpolateHtml(html);
  let renderedText = interpolateText(text);

  // Generate Unsubscribe link
  const token = generateUnsubscribeToken(organizationId, email);
  const baseUrl = process.env.API_URL || `http://localhost:${env.PORT}`;
  const unsubscribeUrl = `${baseUrl.replace(/\/$/, "")}/api/public/unsubscribe/${token}`;

  // Append unsubscribe link to HTML if not present
  if (!renderedHtml.includes(unsubscribeUrl)) {
    const footerHtml = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e7e5e4;">
        <tr>
          <td align="center" style="padding:16px 8px;font-size:12px;color:#a8a29e;font-family:sans-serif;">
            <p style="margin:0 0 4px 0;">You received this email because you are a registered contact.</p>
            <p style="margin:0;"><a href="${unsubscribeUrl}" style="color:#78716c;text-decoration:underline;">Unsubscribe</a></p>
          </td>
        </tr>
      </table>`;

    if (renderedHtml.includes("</body>")) {
      renderedHtml = renderedHtml.replace("</body>", `${footerHtml}</body>`);
    } else {
      renderedHtml += footerHtml;
    }
  }

  // Append unsubscribe to text
  if (!renderedText.includes(unsubscribeUrl)) {
    renderedText += `\n\nUnsubscribe: ${unsubscribeUrl}`;
  }

  const headers: Record<string, string> = {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };

  return {
    success: true,
    subject: renderedSubject,
    html: renderedHtml,
    text: renderedText,
    headers,
  };
}
