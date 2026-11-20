"use client";

import { TemplateEditorPreview } from "./mockups/TemplateEditorPreview";

export function TemplateDesignerShowcase() {
  return (
    <section id="designer" className="w-full border-b border-[rgba(244,242,232,0.25)] bg-[#0755B5] text-[#F4F2E8] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4 mb-14">
          <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(244,242,232,0.6)]">
            [04] VISUAL EMAIL DESIGNER
          </div>
          <h2 className="display-section text-[#F4F2E8]">
            Design with code precision. Publish immutable versions.
          </h2>
          <p className="text-[17px] sm:text-[18px] leading-relaxed text-[rgba(244,242,232,0.9)] font-sans">
            Build modular emails on a centered block canvas. Drag, reorder, and edit text, images, buttons, dividers, and spacers. Preview live merge variables, then compile immutable versions that campaigns can pin without fear of later accidental changes.
          </p>
        </div>

        {/* Big Full-Bleed Editor Mockup */}
        <div className="w-full">
          <TemplateEditorPreview />
        </div>

        {/* Feature Specs Footnote */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[13px] border-t border-[rgba(244,242,232,0.2)] pt-8">
          <div>
            <span className="text-[#5FD07F] font-bold">01 / IMMUTABLE SNAPSHOTS</span>
            <p className="font-sans text-[14px] text-[rgba(244,242,232,0.8)] mt-1">
              Publishing compiles a locked HTML/text version with an atomic increment. Campaigns pin that exact version.
            </p>
          </div>
          <div>
            <span className="text-[#5FD07F] font-bold">02 / VARIABLE ESCAPING</span>
            <p className="font-sans text-[14px] text-[rgba(244,242,232,0.8)] mt-1">
              Merge tags like <code>&#123;&#123;first_name&#125;&#125;</code> are strictly HTML-escaped at send time to prevent XSS injection.
            </p>
          </div>
          <div>
            <span className="text-[#5FD07F] font-bold">03 / COMPLIANCE GUARANTEE</span>
            <p className="font-sans text-[14px] text-[rgba(244,242,232,0.8)] mt-1">
              The compiler enforces a cryptographic HMAC unsubscribe link that templates cannot accidentally remove.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
