"use client";

import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="w-full border-t border-[rgba(244,242,232,0.25)] bg-[#0755B5] text-[#F4F2E8] py-14 sm:py-20 font-sans">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-14 border-b border-[rgba(244,242,232,0.2)]">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <span className="font-yellix text-[32px] font-bold tracking-tight text-[#F4F2E8]">
              PATRA
            </span>
            <p className="max-w-md text-[15px] leading-relaxed text-[rgba(244,242,232,0.85)]">
              Self-hostable email infrastructure and campaign management platform. Sits above your mail providers to manage transports, visual templates, audiences, and rate-limited dispatches.
            </p>
            <div className="pt-2 font-mono text-[12px] text-[rgba(244,242,232,0.65)] space-y-1">
              <div>• Node.js 22 + TypeScript + Next.js 16</div>
              <div>• MongoDB 7 (Replica Set rs0) + Redis 7 (BullMQ)</div>
              <div>• Svix Webhooks + MinIO / S3 Object Storage</div>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div className="space-y-3 font-mono text-[13px]">
            <div className="font-pixel text-[11px] uppercase tracking-widest text-[rgba(244,242,232,0.6)] mb-2">
              Platform Features
            </div>
            <ul className="space-y-2">
              <li><a href="#transports" className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]">Transport Management</a></li>
              <li><a href="#designer" className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]">Visual Block Designer</a></li>
              <li><a href="#audience" className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]">Audience Validation</a></li>
              <li><a href="#campaigns" className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]">Idempotent Campaigns</a></li>
              <li><a href="#tracking" className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]">Live SSE Telemetry</a></li>
            </ul>
          </div>

          {/* Col 3: Architecture */}
          <div className="space-y-3 font-mono text-[13px]">
            <div className="font-pixel text-[11px] uppercase tracking-widest text-[rgba(244,242,232,0.6)] mb-2">
              Architecture & Stack
            </div>
            <ul className="space-y-2">
              <li><a href="#architecture" className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]">BullMQ Worker Daemon</a></li>
              <li><a href="#ownership" className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]">MongoDB Replica Sets</a></li>
              <li><a href="#transports" className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]">AES-256-GCM Encryption</a></li>
              <li><a href="#tracking" className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]">Svix Webhook Verification</a></li>
              <li><a href="#faq" className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]">Crash Reconciliation Cron</a></li>
            </ul>
          </div>

          {/* Col 4: Repository & Access */}
          <div className="space-y-3 font-mono text-[13px]">
            <div className="font-pixel text-[11px] uppercase tracking-widest text-[rgba(244,242,232,0.6)] mb-2">
              Repository & App
            </div>
            <ul className="space-y-2">
              <li><Link href="/dashboard?demo=1" className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]">Interactive Demo Mode</Link></li>
              <li><Link href="/signup" className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]">Register Account</Link></li>
              <li><Link href="/login" className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]">Sign in to Console</Link></li>
              <li>
                <a
                  href="https://github.com/gusainyashaswi/patra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[rgba(244,242,232,0.8)] hover:text-[#F4F2E8]"
                >
                  GitHub Repository ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Colophon */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 font-mono text-[12px] text-[rgba(244,242,232,0.6)]">
          <div>
            © {new Date().getFullYear()} Patra Mailing Service. Open source MIT license.
          </div>
          <div className="flex items-center gap-4">
            <span>SELF-HOSTED EMAIL INFRASTRUCTURE</span>
            <span>•</span>
            <a
              href="https://github.com/gusainyashaswi/patra"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F4F2E8] hover:underline"
            >
              github.com/gusainyashaswi/patra
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
