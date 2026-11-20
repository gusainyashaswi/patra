"use client";

import { TemplateEditorPreview } from "./mockups/TemplateEditorPreview";

export function TemplateDesignerShowcase() {
  return (
    <section id="designer" className="w-full border-b border-[rgba(7,85,181,0.2)] bg-[#0755B5] text-[#F4F2E8] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3 mb-12">
          <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(244,242,232,0.7)]">
            [ VISUAL DESIGNER ]
          </div>
          <h2 className="display-section text-[#F4F2E8] font-yellix">
            Design with precision. Publish immutable versions.
          </h2>
          <p className="text-[17px] leading-relaxed text-[rgba(244,242,232,0.85)] font-sans">
            Build modular emails on a centered block canvas. Preview live merge variables and compile locked versions that queued campaigns pin with zero regression risk.
          </p>
        </div>

        {/* Editor Mockup */}
        <div className="w-full border-2 border-[#F4F2E8] shadow-[6px_6px_0_0_#F4F2E8]">
          <TemplateEditorPreview />
        </div>
      </div>
    </section>
  );
}
