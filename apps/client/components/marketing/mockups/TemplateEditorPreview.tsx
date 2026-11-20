"use client";

import { useState } from "react";

export function TemplateEditorPreview() {
  const [activeTab, setActiveTab] = useState<"desktop" | "mobile">("desktop");
  const [selectedBlock, setSelectedBlock] = useState<"hero" | "text" | "button" | "divider">("hero");

  return (
    <div className="w-full border-2 border-[#0755B5] bg-[#F4F2E8] text-[#0755B5] overflow-hidden select-none font-sans shadow-lg">
      {/* Top Application Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#0755B5] bg-[#0755B5] text-[#F4F2E8] px-4 py-3 text-[13px] font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-wider text-[14px]">RELEASE_NOTES_V3.DRAFT</span>
          <span className="bg-[#5FD07F] text-[#0E0E0E] text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest">
            v2 Published
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[12px] text-[rgba(244,242,232,0.8)]">
          <span>FROM: updates@patra.dev</span>
          <span>SUBJECT: Patra 1.0 is here, &#123;&#123;name&#125;&#125;</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Viewport Switcher */}
          <div className="flex border border-[rgba(244,242,232,0.4)]">
            <button
              onClick={() => setActiveTab("desktop")}
              className={`px-2.5 py-1 text-[11px] font-mono uppercase cursor-pointer transition-colors ${
                activeTab === "desktop" ? "bg-[#F4F2E8] text-[#0755B5] font-bold" : "text-[#F4F2E8] hover:bg-white/10"
              }`}
            >
              Desktop (600px)
            </button>
            <button
              onClick={() => setActiveTab("mobile")}
              className={`px-2.5 py-1 text-[11px] font-mono uppercase cursor-pointer transition-colors ${
                activeTab === "mobile" ? "bg-[#F4F2E8] text-[#0755B5] font-bold" : "text-[#F4F2E8] hover:bg-white/10"
              }`}
            >
              Mobile (380px)
            </button>
          </div>
          <span className="hidden md:inline-flex bg-[#F4F2E8] text-[#0755B5] text-[11px] font-bold px-3 py-1 uppercase tracking-wider">
            Publish v3
          </span>
        </div>
      </div>

      {/* Editor Body: Left Library, Center Canvas, Right Properties */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] min-h-[540px]">
        {/* LEFT: Block Library & Variables */}
        <div className="hidden lg:flex flex-col border-r border-[#0755B5] bg-[#F4F2E8] p-4 text-[13px] font-mono">
          <div className="font-pixel text-[11px] uppercase tracking-wider text-[rgba(7,85,181,0.7)] mb-3">
            Available Blocks
          </div>
          <div className="space-y-1.5 mb-6">
            <div className="flex items-center gap-2.5 border border-[#0755B5] bg-[#ffffff] p-2 cursor-pointer hover:bg-[rgba(7,85,181,0.06)]">
              <span className="text-[14px]">T</span>
              <span className="font-semibold">Text Block</span>
            </div>
            <div className="flex items-center gap-2.5 border border-[#0755B5] bg-[#ffffff] p-2 cursor-pointer hover:bg-[rgba(7,85,181,0.06)]">
              <span className="text-[14px]">🖼</span>
              <span className="font-semibold">Image Banner</span>
            </div>
            <div className="flex items-center gap-2.5 border border-[#0755B5] bg-[#ffffff] p-2 cursor-pointer hover:bg-[rgba(7,85,181,0.06)]">
              <span className="text-[14px]">▢</span>
              <span className="font-semibold">Button CTA</span>
            </div>
            <div className="flex items-center gap-2.5 border border-[#0755B5] bg-[#ffffff] p-2 cursor-pointer hover:bg-[rgba(7,85,181,0.06)]">
              <span className="text-[14px]">—</span>
              <span className="font-semibold">Divider Rule</span>
            </div>
            <div className="flex items-center gap-2.5 border border-[#0755B5] bg-[#ffffff] p-2 cursor-pointer hover:bg-[rgba(7,85,181,0.06)]">
              <span className="text-[14px]">↕</span>
              <span className="font-semibold">Spacer Block</span>
            </div>
          </div>

          <div className="font-pixel text-[11px] uppercase tracking-wider text-[rgba(7,85,181,0.7)] mb-2">
            Merge Variables
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="border border-[rgba(7,85,181,0.4)] bg-[#ffffff] px-2 py-0.5 cursor-pointer hover:border-[#0755B5]">
              &#123;&#123;first_name&#125;&#125;
            </span>
            <span className="border border-[rgba(7,85,181,0.4)] bg-[#ffffff] px-2 py-0.5 cursor-pointer hover:border-[#0755B5]">
              &#123;&#123;company&#125;&#125;
            </span>
            <span className="border border-[rgba(7,85,181,0.4)] bg-[#ffffff] px-2 py-0.5 cursor-pointer hover:border-[#0755B5]">
              &#123;&#123;ticket_id&#125;&#125;
            </span>
          </div>

          <div className="mt-auto pt-4 border-t border-[rgba(7,85,181,0.2)] text-[11px] text-[rgba(7,85,181,0.7)] leading-relaxed">
            Variables are HTML-escaped at dispatch time. Missing required variables trigger automatic recipient skips.
          </div>
        </div>

        {/* CENTER: Canvas / EmailPaper Preview */}
        <div className="bg-[rgba(7,85,181,0.05)] p-3 sm:p-6 flex items-start justify-center overflow-x-hidden overflow-y-auto">
          <div
            className={`w-full transition-all duration-300 bg-[#ffffff] border-2 border-[#0755B5] p-5 sm:p-8 text-[#0755B5] shadow-sm ${
              activeTab === "desktop" ? "max-w-full sm:max-w-[560px]" : "max-w-full sm:max-w-[360px]"
            }`}
          >
            {/* Header Brand */}
            <div className="flex items-center justify-between border-b border-[rgba(7,85,181,0.2)] pb-4 mb-6">
              <span className="font-yellix text-[20px] sm:text-[22px] font-bold tracking-tight">PATRA</span>
              <span className="text-[11px] font-mono text-[rgba(7,85,181,0.6)] uppercase">ISSUE #04</span>
            </div>

            {/* Block 1: Headline Hero (Selectable) */}
            <div
              onClick={() => setSelectedBlock("hero")}
              className={`p-2.5 sm:p-3 cursor-pointer transition-all ${
                selectedBlock === "hero" ? "ring-2 ring-[#0755B5] bg-[rgba(7,85,181,0.03)]" : "hover:bg-[rgba(7,85,181,0.02)]"
              }`}
            >
              <h2 className="font-yellix text-[22px] sm:text-[30px] font-normal leading-tight tracking-tight">
                Self-hosted delivery for product engineers.
              </h2>
            </div>

            {/* Block 2: Text Body (Selectable) */}
            <div
              onClick={() => setSelectedBlock("text")}
              className={`mt-4 p-3 cursor-pointer transition-all ${
                selectedBlock === "text" ? "ring-2 ring-[#0755B5] bg-[rgba(7,85,181,0.03)]" : "hover:bg-[rgba(7,85,181,0.02)]"
              }`}
            >
              <p className="font-sans text-[15px] leading-relaxed text-[rgba(7,85,181,0.9)]">
                Hello <strong className="font-mono bg-[rgba(7,85,181,0.1)] px-1">&#123;&#123;first_name&#125;&#125;</strong>, we just shipped Patra 1.0. You now have complete sovereign control over email template versioning, audience imports from spreadsheets, and rate-limited dispatches.
              </p>
            </div>

            {/* Block 3: Divider (Selectable) */}
            <div
              onClick={() => setSelectedBlock("divider")}
              className={`my-5 py-2 cursor-pointer ${
                selectedBlock === "divider" ? "ring-2 ring-[#0755B5]" : ""
              }`}
            >
              <hr className="border-t border-[#0755B5]" />
            </div>

            {/* Block 4: Button CTA (Selectable) */}
            <div
              onClick={() => setSelectedBlock("button")}
              className={`p-3 text-center cursor-pointer ${
                selectedBlock === "button" ? "ring-2 ring-[#0755B5] bg-[rgba(7,85,181,0.03)]" : ""
              }`}
            >
              <div className="inline-block bg-[#0755B5] text-[#F4F2E8] font-sans font-medium text-[14px] px-6 py-2.5">
                Explore Release Notes →
              </div>
            </div>

            {/* System Automated Unsubscribe Footer */}
            <div className="mt-8 pt-4 border-t border-[rgba(7,85,181,0.15)] text-[11px] text-[rgba(7,85,181,0.6)] font-mono leading-relaxed">
              <p>Sent by Patra Inc. · 100% auditable dispatch.</p>
              <p className="mt-1">
                Mandatory compliance link: <span className="underline cursor-pointer">Unsubscribe securely</span>
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Properties Inspector */}
        <div className="hidden lg:flex flex-col border-l border-[#0755B5] bg-[#F4F2E8] p-4 text-[13px] font-mono">
          <div className="font-pixel text-[11px] uppercase tracking-wider text-[rgba(7,85,181,0.7)] mb-3">
            Block Properties
          </div>
          <div className="space-y-4">
            <div>
              <span className="block text-[11px] uppercase text-[rgba(7,85,181,0.6)] mb-1">
                Active Selection
              </span>
              <div className="border border-[#0755B5] bg-[#ffffff] px-2.5 py-1.5 font-bold uppercase text-[12px]">
                {selectedBlock === "hero" && "Header Block (H1)"}
                {selectedBlock === "text" && "Paragraph Block (Rich Text)"}
                {selectedBlock === "button" && "Button Element (CTA)"}
                {selectedBlock === "divider" && "Horizontal Rule (1px)"}
              </div>
            </div>

            <div>
              <span className="block text-[11px] uppercase text-[rgba(7,85,181,0.6)] mb-1">
                Typography Scale
              </span>
              <div className="border border-[#0755B5] bg-[#ffffff] px-2.5 py-1.5 flex justify-between">
                <span>Font Size</span>
                <span className="font-bold">{selectedBlock === "hero" ? "28px" : "15px"}</span>
              </div>
            </div>

            <div>
              <span className="block text-[11px] uppercase text-[rgba(7,85,181,0.6)] mb-1">
                Canvas Width (Body)
              </span>
              <div className="border border-[#0755B5] bg-[#ffffff] px-2.5 py-1.5 flex justify-between">
                <span>Container Width</span>
                <span className="font-bold">600px (Email Standard)</span>
              </div>
            </div>

            <div>
              <span className="block text-[11px] uppercase text-[rgba(7,85,181,0.6)] mb-1">
                Compiler Sanity
              </span>
              <div className="border border-[rgba(7,85,181,0.3)] bg-[rgba(7,85,181,0.05)] p-2.5 text-[11px] space-y-1">
                <div className="text-[#1D7438]">✓ HTML Sanitized (Strict)</div>
                <div className="text-[#1D7438]">✓ Plain-text part generated</div>
                <div className="text-[#1D7438]">✓ Unsubscribe tag enforced</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
