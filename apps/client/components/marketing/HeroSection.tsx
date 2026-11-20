"use client";

import Link from "next/link";
import { HeroTelemetryHud } from "./mockups/HeroTelemetryHud";

export function HeroSection() {
  return (
    <section className="relative w-full border-b border-[rgba(7,85,181,0.2)] bg-[#F4F2E8] text-[#0755B5] pt-14 sm:pt-20 lg:pt-28 pb-16 sm:pb-24 overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Hero Narrative */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 min-w-0">
            {/* Minimalist Top Tag */}
            <div className="inline-flex max-w-full items-center gap-2 border border-[rgba(7,85,181,0.3)] bg-[#FFFFFF] px-3 py-1 font-pixel text-[11px] sm:text-[12px] uppercase tracking-widest text-[#0755B5] shadow-[2px_2px_0_0_#0755B5]">
              <span className="h-2 w-2 shrink-0 bg-[#1D7438]" />
              <span className="truncate">Self-Hosted Email Infrastructure</span>
            </div>

            {/* Display Heading */}
            <h1 className="display-hero text-[#0755B5] max-w-2xl font-yellix">
              Email infrastructure. Without the headache.
            </h1>

            {/* Subtitle Copy */}
            <p className="max-w-xl text-[17px] sm:text-[20px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans">
              Design modular emails, manage subscriber audiences, and dispatch queue-backed campaigns with complete data ownership.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
              <Link
                href="/signup"
                className="mkt-btn mkt-btn-primary text-[15px] font-mono tracking-wider w-full sm:w-auto justify-center"
              >
                Get started →
              </Link>
            </div>

            {/* Core Stack Badges */}
            <div className="pt-6 border-t border-[rgba(7,85,181,0.2)] flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] sm:text-[12px] text-[rgba(7,85,181,0.7)]">
              <span>• RESEND INTEGRATED</span>
              <span>• BULLMQ QUEUE</span>
              <span>• 100% SELF-HOSTED</span>
            </div>
          </div>

          {/* Right Product Showcase: Minimalist Telemetry HUD */}
          <div className="lg:col-span-5 w-full min-w-0">
            <HeroTelemetryHud />
          </div>
        </div>
      </div>
    </section>
  );
}
