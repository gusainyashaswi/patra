"use client";

import { TransportPreview } from "./mockups/TransportPreview";

export function TransportSection() {
  return (
    <section id="transports" className="w-full border-b border-[rgba(7,85,181,0.25)] bg-[#F4F2E8] text-[#0755B5] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
              [03] MAIL TRANSPORT MANAGEMENT
            </div>
            <h2 className="display-section text-[#0755B5]">
              Bring your provider. We enforce the limits.
            </h2>
            <p className="text-[17px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans">
              Connect to Resend or other providers behind a standardized adapter interface. API credentials are encrypted with AES-256-GCM before database writes and never returned to the browser.
            </p>

            <div className="space-y-4 pt-2 font-mono text-[13px]">
              <div className="border-l-2 border-[#0755B5] pl-4">
                <div className="font-bold text-[#0755B5]">Carrier Throttling</div>
                <div className="text-[13px] text-[rgba(7,85,181,0.75)] font-sans mt-0.5">
                  Set per-second sending limits and UTC daily quotas to protect provider reputation.
                </div>
              </div>
              <div className="border-l-2 border-[#0755B5] pl-4">
                <div className="font-bold text-[#0755B5]">Verified Domain Binding</div>
                <div className="text-[13px] text-[rgba(7,85,181,0.75)] font-sans mt-0.5">
                  Sender identities are strictly validated against verified domains synced via provider APIs.
                </div>
              </div>
              <div className="border-l-2 border-[#0755B5] pl-4">
                <div className="font-bold text-[#0755B5]">Zero Direct Coupling</div>
                <div className="text-[13px] text-[rgba(7,85,181,0.75)] font-sans mt-0.5">
                  Sending logic interacts solely with the <code>ITransport</code> interface, isolating dispatch code.
                </div>
              </div>
            </div>
          </div>

          {/* Right Product Showcase: Transport Settings Mockup */}
          <div className="lg:col-span-7 w-full">
            <TransportPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
