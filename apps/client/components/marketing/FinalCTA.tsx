"use client";

import Link from "next/link";
import { useState } from "react";

export function FinalCTA() {
  const [copied, setCopied] = useState(false);
  const cloneCmd = "git clone https://github.com/gusainyashaswi/patra.git && cd patra && docker compose up -d";

  const copy = () => {
    navigator.clipboard.writeText(cloneCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="w-full bg-[#F4F2E8] text-[#0755B5] py-20 sm:py-28 overflow-hidden border-b border-[rgba(7,85,181,0.2)]">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 text-center flex flex-col items-center space-y-6">
        <div className="inline-flex items-center gap-2 border border-[rgba(7,85,181,0.3)] bg-[#FFFFFF] px-3 py-1 font-pixel text-[11px] uppercase tracking-widest text-[#0755B5] shadow-[2px_2px_0_0_#0755B5]">
          <span className="h-2 w-2 bg-[#1D7438]" />
          READY TO DEPLOY IN UNDER 2 MINUTES
        </div>

        <h2 className="display-hero text-[#0755B5] max-w-3xl font-yellix">
          Take control of your email infrastructure.
        </h2>

        <p className="max-w-xl text-[17px] sm:text-[19px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans">
          Deploy with Docker Compose, connect your credentials, and dispatch auditable campaigns with zero vendor lock-in.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
          <Link
            href="/signup"
            className="mkt-btn mkt-btn-primary text-[15px] font-mono tracking-wider w-full sm:w-auto justify-center"
          >
            Create your account →
          </Link>
          <Link
            href="/dashboard?demo=1"
            className="mkt-btn mkt-btn-ghost-blue text-[15px] font-mono tracking-wider w-full sm:w-auto justify-center"
          >
            Launch demo
          </Link>
        </div>

        {/* Minimal Terminal Block */}
        <div className="mt-6 w-full max-w-xl border-2 border-[#0755B5] bg-[#FFFFFF] p-3.5 sm:p-4 text-left font-mono text-[12px] flex items-center justify-between gap-4 shadow-[4px_4px_0_0_#0755B5]">
          <div className="min-w-0 flex-1 overflow-x-auto truncate">
            <span className="text-[#1D7438] select-none font-bold">$ </span>
            <span className="text-[#0755B5]">{cloneCmd}</span>
          </div>
          <button
            onClick={copy}
            className="shrink-0 border border-[#0755B5] px-2.5 py-1 hover:bg-[#0755B5] hover:text-[#F4F2E8] text-[11px] uppercase tracking-wider text-[#0755B5] cursor-pointer transition-colors"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>
    </section>
  );
}
