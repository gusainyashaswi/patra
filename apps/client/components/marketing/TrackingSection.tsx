"use client";

import { TrackingPreview } from "./mockups/TrackingPreview";

export function TrackingSection() {
  return (
    <section id="tracking" className="w-full border-b border-[rgba(244,242,232,0.25)] bg-[#0755B5] text-[#F4F2E8] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(244,242,232,0.6)]">
              [07] DELIVERY TELEMETRY
            </div>
            <h2 className="display-section text-[#F4F2E8]">
              Know what happens after you hit send.
            </h2>
            <p className="text-[17px] leading-relaxed text-[rgba(244,242,232,0.9)] font-sans">
              Delivery webhooks from Resend are cryptographically verified with Svix before touching your database. Recipient states progress strictly forward: <code>QUEUED &lt; SENT &lt; DELIVERED &lt; OPENED</code>.
            </p>

            <div className="space-y-4 pt-2 font-mono text-[13px]">
              <div className="border-l-2 border-[#F4F2E8] pl-4">
                <div className="font-bold text-[#F4F2E8]">Server-Sent Events (SSE)</div>
                <div className="text-[13px] text-[rgba(244,242,232,0.8)] font-sans mt-0.5">
                  Real-time Redis pub/sub streams delivery counters to your browser tab without repetitive polling loops.
                </div>
              </div>
              <div className="border-l-2 border-[#F4F2E8] pl-4">
                <div className="font-bold text-[#F4F2E8]">Auto-Pause Protection</div>
                <div className="text-[13px] text-[rgba(244,242,232,0.8)] font-sans mt-0.5">
                  If hard bounces pass 5% after 50 dispatches, the campaign automatically pauses to protect your domain reputation.
                </div>
              </div>
              <div className="border-l-2 border-[#F4F2E8] pl-4">
                <div className="font-bold text-[#F4F2E8]">Cursor-Based CSV Export</div>
                <div className="text-[13px] text-[rgba(244,242,232,0.8)] font-sans mt-0.5">
                  Export 50,000+ recipient delivery logs through a streamed database cursor with minimal RAM consumption.
                </div>
              </div>
            </div>
          </div>

          {/* Right Product Showcase: Live Telemetry Console */}
          <div className="lg:col-span-7 w-full">
            <TrackingPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
