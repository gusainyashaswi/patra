"use client";

import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="w-full border-t border-[rgba(7,85,181,0.2)] bg-[#F4F2E8] text-[#0755B5] py-12 sm:py-16 font-sans">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-[rgba(7,85,181,0.2)]">
          {/* Brand */}
          <div className="space-y-2">
            <span className="font-yellix text-[28px] font-bold tracking-tight text-[#0755B5]">
              PATRA
            </span>
            <p className="max-w-md text-[14px] leading-relaxed text-[rgba(7,85,181,0.8)]">
              Self-hosted email infrastructure and campaign management platform. Sits above your mail providers to manage transports, visual templates, audiences, and queue-backed dispatches.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-6 font-mono text-[13px] uppercase tracking-wider">
            <a href="#features" className="hover:opacity-75 transition-opacity">Features</a>
            <a href="#designer" className="hover:opacity-75 transition-opacity">Designer</a>
            <a href="#faq" className="hover:opacity-75 transition-opacity">FAQ</a>
            <Link href="/dashboard?demo=1" className="hover:opacity-75 transition-opacity">Live Demo</Link>
            <Link href="/login" className="hover:opacity-75 transition-opacity">Log In</Link>
            <a
              href="https://github.com/gusainyashaswi/patra"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0755B5] font-bold hover:underline"
            >
              GitHub ↗
            </a>
          </div>
        </div>

        {/* Bottom Colophon */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 font-mono text-[12px] text-[rgba(7,85,181,0.65)]">
          <div>
            © {new Date().getFullYear()} Patra Mailing Engine. Open source under MIT license.
          </div>
          <div className="flex items-center gap-4">
            <span>SELF-HOSTED EMAIL INFRASTRUCTURE</span>
            <span>•</span>
            <span className="text-[#0755B5]">100% DATA OWNERSHIP</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
