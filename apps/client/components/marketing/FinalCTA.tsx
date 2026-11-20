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
    <section className="w-full bg-[#0755B5] text-[#F4F2E8] py-24 sm:py-32 overflow-hidden border-b border-[rgba(244,242,232,0.25)]">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 text-center flex flex-col items-center space-y-8">
        <div className="inline-flex items-center gap-2 border border-[rgba(244,242,232,0.35)] bg-[rgba(244,242,232,0.08)] px-3 py-1 font-pixel text-[11px] sm:text-[12px] uppercase tracking-widest text-[#F4F2E8]">
          <span className="h-1.5 w-1.5 bg-[#5FD07F]" />
          READY TO DEPLOY IN UNDER 2 MINUTES
        </div>

        <h2 className="display-hero text-[#F4F2E8] max-w-4xl">
          Take control of your email infrastructure.
        </h2>

        <p className="max-w-2xl text-[17px] sm:text-[20px] leading-relaxed text-[rgba(244,242,232,0.9)] font-sans">
          Deploy with Docker Compose, connect your Resend credentials, and send auditable, rate-limited email campaigns without vendor lock-in.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="mkt-btn mkt-btn-inverse text-[15px] font-medium w-full sm:w-auto justify-center"
          >
            Create your account →
          </Link>
          <Link
            href="/dashboard?demo=1"
            className="mkt-btn mkt-btn-ghost-cream text-[15px] font-medium w-full sm:w-auto justify-center"
          >
            Launch interactive demo
          </Link>
        </div>

        {/* Terminal Quick-Start Block */}
        <div className="mt-8 w-full max-w-2xl border border-[rgba(244,242,232,0.3)] bg-[rgba(7,85,181,0.85)] p-4 sm:p-5 text-left font-mono text-[12px] sm:text-[13px] flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 overflow-x-auto truncate">
            <span className="text-[#5FD07F] select-none">$ </span>
            <span className="text-[#F4F2E8]">{cloneCmd}</span>
          </div>
          <button
            onClick={copy}
            className="shrink-0 border border-[rgba(244,242,232,0.4)] px-3 py-1 hover:bg-white/10 text-[11px] uppercase tracking-wider text-[#F4F2E8] cursor-pointer"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>

        {/* GitHub Direct Link */}
        <div className="pt-2">
          <a
            href="https://github.com/gusainyashaswi/patra"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-mono text-[rgba(244,242,232,0.7)] hover:text-[#F4F2E8] underline"
          >
            View Patra source repository on GitHub ↗
          </a>
        </div>
      </div>
    </section>
  );
}
