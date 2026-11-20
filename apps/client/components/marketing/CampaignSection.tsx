"use client";

import { CampaignPreview } from "./mockups/CampaignPreview";

export function CampaignSection() {
  return (
    <section id="campaigns" className="w-full border-b border-[rgba(7,85,181,0.25)] bg-[#F4F2E8] text-[#0755B5] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
              [06] CAMPAIGN MANAGEMENT
            </div>
            <h2 className="display-section text-[#0755B5]">
              Snapshot everything. Send without duplicates.
            </h2>
            <p className="text-[17px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans">
              Campaigns pin a published template version, a verified sender identity, and an audience. Pre-send estimation counts exact sendable recipients minus suppressions and missing variables.
            </p>

            <div className="space-y-4 pt-2 font-mono text-[13px]">
              <div className="border-l-2 border-[#0755B5] pl-4">
                <div className="font-bold text-[#0755B5]">Idempotency Gates</div>
                <div className="text-[13px] text-[rgba(7,85,181,0.75)] font-sans mt-0.5">
                  Sends transition <code>DRAFT → QUEUED</code> atomically. Retried triggers return 409 Conflict with zero duplicated jobs.
                </div>
              </div>
              <div className="border-l-2 border-[#0755B5] pl-4">
                <div className="font-bold text-[#0755B5]">Variable Validation</div>
                <div className="text-[13px] text-[rgba(7,85,181,0.75)] font-sans mt-0.5">
                  Recipients missing required variables are marked <code>SKIPPED</code> rather than dispatched with broken blanks.
                </div>
              </div>
              <div className="border-l-2 border-[#0755B5] pl-4">
                <div className="font-bold text-[#0755B5]">Pause & Resume Controls</div>
                <div className="text-[13px] text-[rgba(7,85,181,0.75)] font-sans mt-0.5">
                  Pause an in-flight campaign with one click; workers respect state transitions on the very next queued job.
                </div>
              </div>
            </div>
          </div>

          {/* Right Product Showcase: Campaign Composer Mockup */}
          <div className="lg:col-span-7 w-full">
            <CampaignPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
