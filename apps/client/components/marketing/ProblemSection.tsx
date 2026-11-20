"use client";

export function ProblemSection() {
  return (
    <section className="w-full border-b border-[rgba(7,85,181,0.25)] bg-[#F4F2E8] text-[#0755B5] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
            [01] THE EMAIL PROBLEM
          </div>
          <h2 className="display-section text-[#0755B5]">
            You shouldn’t have to rebuild email plumbing. Or surrender your data to an ESP.
          </h2>
          <p className="text-[17px] sm:text-[18px] leading-relaxed text-[rgba(7,85,181,0.85)]">
            Teams that need to send email face two bad choices: lock into a marketing service that restricts their data and charges per subscriber, or build the entire sending engine from scratch.
          </p>
        </div>

        {/* 3-Column Comparative Editorial Layout */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 border-2 border-[#0755B5] bg-[#ffffff]">
          {/* Card 1: Marketing ESPs */}
          <div className="p-8 border-b md:border-b-0 md:border-r border-[#0755B5] flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-[rgba(7,85,181,0.6)] uppercase pb-3 border-b border-[rgba(7,85,181,0.2)]">
                <span>APPROACH A</span>
                <span>CLOSED ESP CLOUDS</span>
              </div>
              <h3 className="font-yellix text-[22px] font-bold mt-4">The Marketing ESP Trap</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[rgba(7,85,181,0.8)] font-sans">
                Mailchimp, Brevo, and customer engagement platforms lock your contacts inside their proprietary schemas. As your audience scales, arbitrary per-subscriber pricing penalties punish your growth.
              </p>
            </div>
            <ul className="space-y-2 text-[13px] font-mono text-[#B42318] pt-4 border-t border-[rgba(7,85,181,0.15)]">
              <li>✕ Steep per-contact pricing tiers</li>
              <li>✕ Proprietary, non-exportable templates</li>
              <li>✕ Zero control over sending queues</li>
            </ul>
          </div>

          {/* Card 2: Building From Scratch */}
          <div className="p-8 border-b md:border-b-0 md:border-r border-[#0755B5] flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-[rgba(7,85,181,0.6)] uppercase pb-3 border-b border-[rgba(7,85,181,0.2)]">
                <span>APPROACH B</span>
                <span>DIY IN-HOUSE CODE</span>
              </div>
              <h3 className="font-yellix text-[22px] font-bold mt-4">The DIY Plumbing Sinkhole</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[rgba(7,85,181,0.8)] font-sans">
                Building directly on top of provider APIs means solving concurrency, worker crash recovery, variable escaping, bounce webhooks, and rate-limiting from scratch—taking months away from your actual product.
              </p>
            </div>
            <ul className="space-y-2 text-[13px] font-mono text-[#8F5200] pt-4 border-t border-[rgba(7,85,181,0.15)]">
              <li>✕ Worker crashes cause duplicate sends</li>
              <li>✕ Manual CSV parsing and syntax bugs</li>
              <li>✕ Inflexible hardcoded templates</li>
            </ul>
          </div>

          {/* Card 3: The Patra Layer (Highlighted) */}
          <div className="p-8 bg-[#0755B5] text-[#F4F2E8] flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between font-mono text-[11px] text-[#5FD07F] uppercase pb-3 border-b border-[rgba(244,242,232,0.25)] font-bold">
                <span>APPROACH C</span>
                <span>THE PATRA PLATFORM</span>
              </div>
              <h3 className="font-yellix text-[22px] font-bold mt-4 text-[#F4F2E8]">Self-Hosted Infrastructure</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[rgba(244,242,232,0.9)] font-sans">
                Patra packages the entire infrastructure layer into a deployable self-hosted system. You bring your own mail provider; Patra manages transports, visual templates, audiences, and queued dispatch with zero per-seat tax.
              </p>
            </div>
            <ul className="space-y-2 text-[13px] font-mono text-[#5FD07F] pt-4 border-t border-[rgba(244,242,232,0.25)]">
              <li>✓ 100% data ownership on your database</li>
              <li>✓ BullMQ crash recovery & rate-limits</li>
              <li>✓ Visual block designer with versioning</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
