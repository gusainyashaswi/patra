"use client";

import Link from "next/link";
import { HeroTelemetryHud } from "./mockups/HeroTelemetryHud";

export function HeroSection() {
  return (
    <section className="relative w-full border-b border-[rgba(244,242,232,0.25)] bg-[#0755B5] text-[#F4F2E8] pt-12 sm:pt-20 lg:pt-24 pb-16 sm:pb-24 overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Hero Narrative */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 min-w-0">
            {/* Top Monospace Label */}
            <div className="inline-flex max-w-full items-center gap-2 border border-[rgba(244,242,232,0.35)] bg-[rgba(244,242,232,0.08)] px-2.5 sm:px-3 py-1 font-pixel text-[10px] sm:text-[12px] uppercase tracking-widest text-[#F4F2E8]">
              <span className="h-1.5 w-1.5 shrink-0 bg-[#5FD07F]" />
              <span className="truncate sm:whitespace-normal">Patra Mail Platform · Carrier-Agnostic Dispatch Core</span>
            </div>

            {/* Massive Display Title */}
            <h1 className="display-hero text-[#F4F2E8] max-w-2xl">
              Email infrastructure. Without the infrastructure headache.
            </h1>

            {/* Subtitle Copy */}
            <p className="max-w-xl text-[16px] sm:text-[19px] leading-relaxed text-[rgba(244,242,232,0.9)] font-sans font-normal">
              Design beautiful emails, manage your audience, launch campaigns and track every delivery. All through one flexible, self-hostable platform.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
              <Link
                href="/signup"
                className="mkt-btn mkt-btn-inverse text-[15px] font-medium w-full sm:w-auto justify-center"
              >
                Get started →
              </Link>
              <Link
                href="/dashboard?demo=1"
                className="mkt-btn mkt-btn-ghost-cream text-[15px] font-medium w-full sm:w-auto justify-center"
              >
                Explore the platform
              </Link>
            </div>

            {/* Core Capability Badges */}
            <div className="pt-6 border-t border-[rgba(244,242,232,0.2)] flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] sm:text-[12px] text-[rgba(244,242,232,0.75)]">
              <span>• RESEND INTEGRATED</span>
              <span>• MONGODB 7 ACID</span>
              <span>• BULLMQ WORKER</span>
              <span>• 100% SELF-HOSTED</span>
            </div>
          </div>

          {/* Right Product Showcase: Live Telemetry Console */}
          <div className="lg:col-span-5 w-full min-w-0">
            <HeroTelemetryHud />
          </div>
        </div>
      </div>
    </section>
  );
}
