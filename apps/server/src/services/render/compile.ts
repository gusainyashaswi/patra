import { escapeHtml, extractVariables, interpolateVariables } from "./variables.js";
import type { ITemplatePageSettings } from "../../models/template.model.js";

export interface CompileOptions {
  subject: string;
  previewText?: string;
  page?: ITemplatePageSettings;
  blocks: Array<Record<string, any>>;
  sampleData?: Record<string, unknown>;
  unsubscribeUrl?: string;
}

export interface CompileResult {
  html: string;
  text: string;
  variables: string[];
}

export function compileTemplate(options: CompileOptions): CompileResult {
  const {
    subject,
    previewText = "",
    page = {},
    blocks = [],
    sampleData,
    unsubscribeUrl = "#unsubscribe",
  } = options;

  const bg = page.bg || "#ffffff";
  const width = page.width || 600;
  const textColor = page.text || "#1c1917";
  const defaultAlign = page.align || "left";

  // Collect all variables
  const variables = extractVariables({ subject, previewText, blocks });

  // Helper to format/interpolate string if sampleData is passed
  const format = (content: string, shouldEscape: boolean = true) => {
    if (sampleData && Object.keys(sampleData).length > 0) {
      return interpolateVariables(content, sampleData, shouldEscape);
    }
    return shouldEscape ? escapeHtml(content) : content;
  };

  // Compile blocks into HTML
  const blockHtmls = blocks.map((b) => {
    const type = b.type;
    switch (type) {
      case "text": {
        const rawText = b.text ?? b.content ?? "";
        const formatted = format(rawText, true).replace(/\n/g, "<br />");
        const size = b.size || 15;
        const weight = b.weight || 400;
        const align = b.align || defaultAlign;
        const color = b.muted ? "#78716c" : textColor;
        return `
          <tr>
            <td style="padding: 6px 0; font-size: ${size}px; font-weight: ${weight}; color: ${color}; text-align: ${align}; line-height: 1.6;">
              ${formatted}
            </td>
          </tr>
        `;
      }

      case "image": {
        const src = format(b.src || "", true);
        const alt = format(b.alt || "", true);
        const height = b.height ? `height="${b.height}"` : "";
        const align = b.align || "center";
        if (!src) return "";
        return `
          <tr>
            <td align="${align}" style="padding: 10px 0; text-align: ${align};">
              <img src="${src}" alt="${alt}" ${height} style="max-width: 100%; height: auto; display: block; border: 0;" />
            </td>
          </tr>
        `;
      }

      case "button": {
        const label = format(b.label || b.text || "Click here", true);
        const href = format(b.href || "#", true);
        const color = b.color || b.backgroundColor || "#1c1917";
        const align = b.align || defaultAlign;
        return `
          <tr>
            <td align="${align}" style="padding: 14px 0; text-align: ${align};">
              <table border="0" cellspacing="0" cellpadding="0" style="display: inline-table;">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: ${color};">
                    <a href="${href}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 6px;">
                      ${label}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
      }

      case "divider": {
        return `
          <tr>
            <td style="padding: 12px 0;">
              <hr style="border: 0; border-top: 1px solid #e7e5e4; margin: 0;" />
            </td>
          </tr>
        `;
      }

      case "spacer": {
        const height = b.height || 24;
        return `
          <tr>
            <td height="${height}" style="height: ${height}px; font-size: 1px; line-height: ${height}px;">&nbsp;</td>
          </tr>
        `;
      }

      default:
        return "";
    }
  });

  const formattedSubject = format(subject, true);
  const formattedPreview = format(previewText, true);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formattedSubject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${
    formattedPreview
      ? `<div style="display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${formattedPreview}</div>`
      : ""
  }
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: ${bg}; width: 100%;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table width="${width}" border="0" cellpadding="0" cellspacing="0" style="max-width: ${width}px; width: 100%; background-color: #ffffff; border-radius: 8px; padding: 24px;">
          ${blockHtmls.join("\n")}
          <tr>
            <td style="padding-top: 32px; text-align: center; font-size: 12px; color: #a8a29e; line-height: 1.5;">
              <p style="margin: 0;">You received this email because you are a registered contact.</p>
              <p style="margin: 4px 0 0;"><a href="${unsubscribeUrl}" style="color: #78716c; text-decoration: underline;">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Compile Plain Text version
  const textLines: string[] = [];
  if (formattedSubject) textLines.push(format(subject, false));
  if (formattedPreview) textLines.push(format(previewText, false));
  if (textLines.length) textLines.push("----------------------------------------");

  for (const b of blocks) {
    switch (b.type) {
      case "text": {
        const raw = b.text ?? b.content ?? "";
        textLines.push(format(raw, false));
        break;
      }
      case "button": {
        const label = format(b.label || b.text || "Click here", false);
        const href = format(b.href || "#", false);
        textLines.push(`${label}: ${href}`);
        break;
      }
      case "divider": {
        textLines.push("---");
        break;
      }
      case "spacer": {
        textLines.push("");
        break;
      }
      case "image": {
        const alt = format(b.alt || "Image", false);
        const src = format(b.src || "", false);
        if (src) textLines.push(`[${alt}]: ${src}`);
        break;
      }
    }
  }

  textLines.push("");
  textLines.push(`Unsubscribe: ${unsubscribeUrl}`);

  const text = textLines.join("\n\n");

  return { html, text, variables };
}
