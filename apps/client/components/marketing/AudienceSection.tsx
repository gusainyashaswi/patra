"use client";

import { AudiencePreview } from "./mockups/AudiencePreview";

export function AudienceSection() {
  return (
    <section id="audience" className="w-full border-b border-[rgba(7,85,181,0.25)] bg-[#F4F2E8] text-[#0755B5] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
              [05] AUDIENCE MANAGEMENT
            </div>
            <h2 className="display-section text-[#0755B5]">
              Clean audiences. Zero dirty sends.
            </h2>
            <p className="text-[17px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans">
              Drop in a CSV or Excel (<code>.xlsx</code>) file with up to 50,000 rows. Patra parses the file in memory, validates every email, detects duplicates, and checks your suppression list before a single row touches your database.
            </p>

            <div className="space-y-4 pt-2 font-mono text-[13px]">
              <div className="border-l-2 border-[#0755B5] pl-4">
                <div className="font-bold text-[#0755B5]">Non-Committing Preview</div>
                <div className="text-[13px] text-[rgba(7,85,181,0.75)] font-sans mt-0.5">
                  Inspect parsed rows, syntax rejections, and duplicate counts with zero database side effects.
                </div>
              </div>
              <div className="border-l-2 border-[#0755B5] pl-4">
                <div className="font-bold text-[#0755B5]">Export Skipped Records</div>
                <div className="text-[13px] text-[rgba(7,85,181,0.75)] font-sans mt-0.5">
                  Download invalid and skipped rows as a CSV to fix addresses in your CRM before re-uploading.
                </div>
              </div>
              <div className="border-l-2 border-[#0755B5] pl-4">
                <div className="font-bold text-[#0755B5]">Automatic Suppression List</div>
                <div className="text-[13px] text-[rgba(7,85,181,0.75)] font-sans mt-0.5">
                  Hard-bounced addresses and unsubscribed recipients are excluded at query time from every send.
                </div>
              </div>
            </div>
          </div>

          {/* Right Product Showcase: Audience Import Inspector */}
          <div className="lg:col-span-7 w-full">
            <AudiencePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
