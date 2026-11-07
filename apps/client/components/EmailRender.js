"use client";

import { Icon } from "./icons";
import { cx } from "./ui";

export const sampleData = { name: "Aarav", email: "aarav@example.test", college: "Rishihood University", ticket_id: "RF-2026-0412" };

// Renders {{var}} as a chip while editing, or substitutes sample data in preview.
export function MergeText({ text, preview }) {
  const parts = String(text).split(/(\{\{\s*\w+\s*\}\})/g);
  return parts.map((p, i) => {
    const m = p.match(/^\{\{\s*(\w+)\s*\}\}$/);
    if (!m) return <span key={i}>{p}</span>;
    if (preview) return <span key={i}>{sampleData[m[1]] ?? ""}</span>;
    return (
      <span key={i} className="mx-px rounded bg-[#fff1e8] px-1 font-mono text-[0.85em] text-[#f05a35] ring-1 ring-[#fed7c3]">
        {m[1]}
      </span>
    );
  });
}

// Email content always renders in "paper" colors regardless of app theme,
// because that's what recipients see.
export function BlockView({ block, page, preview }) {
  const align = block.align ?? page.align ?? "left";
  switch (block.type) {
    case "text":
      return (
        <p
          style={{
            fontSize: block.size,
            fontWeight: block.weight,
            textAlign: align,
            color: block.muted ? "#78716c" : page.text,
            lineHeight: block.size > 18 ? 1.3 : 1.6,
            margin: 0,
          }}
        >
          <MergeText text={block.text} preview={preview} />
        </p>
      );
    case "button":
      return (
        <div style={{ textAlign: align }}>
          <span
            style={{
              display: "inline-block",
              background: block.color ?? "#1c1917",
              color: "#fff",
              padding: "11px 20px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <MergeText text={block.label} preview={preview} />
          </span>
        </div>
      );
    case "image":
      return block.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={block.src} alt={block.alt} style={{ width: "100%", height: block.height, objectFit: "cover", borderRadius: 6 }} />
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-1.5 rounded-md"
          style={{
            height: block.height,
            background: "repeating-linear-gradient(135deg,#f5f5f4 0 10px,#efeeec 10px 20px)",
            color: "#78716c",
          }}
        >
          <Icon.Image size={20} />
          <span style={{ fontSize: 12 }}>{block.alt || "Image"}</span>
        </div>
      );
    case "divider":
      return <hr style={{ border: 0, borderTop: "1px solid #e7e5e4", margin: "4px 0" }} />;
    case "spacer":
      return <div style={{ height: block.height ?? 24 }} aria-hidden="true" />;
    default:
      return null;
  }
}

export function EmailPaper({ template, preview = true, width, className, children }) {
  const page = template.page;
  return (
    <div className={cx("w-full", className)} style={{ background: page.bg }}>
      <div className="mx-auto" style={{ maxWidth: width ?? page.width }}>
        <div className="flex flex-col gap-4 bg-white p-8" style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
          {children ??
            template.blocks.map((b) => <BlockView key={b.id} block={b} page={page} preview={preview} />)}
        </div>
        <p className="px-8 py-5 text-center" style={{ fontSize: 11.5, color: "#a8a29e" }}>
          You’re receiving this because you registered for Rishihood Fest.{" "}
          <span style={{ textDecoration: "underline" }}>Unsubscribe</span>
        </p>
      </div>
    </div>
  );
}
