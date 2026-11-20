"use client";

import { Icon } from "@/components/icons";

export function MailTransmissionSystem() {
  return (
    <div className="relative flex h-full min-h-[720px] w-full flex-col justify-between overflow-hidden bg-[#0755B5] p-8 text-[#F4F2E8] select-none sm:p-12 xl:p-16">
      {/* 1. Subtle Architectural Drafting Grid Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(244, 242, 232, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(244, 242, 232, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      {/* 2. Top System Status Rail */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#F4F2E8]/20 pb-5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5FD07F] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#5FD07F]" />
          </span>
          <span className="font-mono text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.18em] text-[#F4F2E8]">
            PATRA TRANSMISSION CORE
          </span>
        </div>

        <div className="font-mono text-[12px] uppercase tracking-wider text-[#F4F2E8]/75">
          99.9% UPTIME · 14MS LATENCY
        </div>
      </div>

      {/* 3. Center: Prominent, Generously-Sized Minimalist Dispatch Object */}
      <div className="relative z-10 my-auto py-6 sm:py-8">
        <div className="mx-auto w-full max-w-[640px] xl:max-w-[700px] border-[2.5px] border-[#F4F2E8] bg-[#F4F2E8] text-[#0755B5] shadow-[14px_14px_0_0_rgba(244,242,232,0.25)] transition-all">
          {/* Object Header Rail */}
          <div className="flex items-center justify-between border-b-[2.5px] border-[#0755B5] bg-[#0755B5] px-6 py-4 text-[#F4F2E8]">
            <div className="flex items-center gap-2.5 font-mono text-[12px] sm:text-[13px] font-bold uppercase tracking-wider">
              <span className="h-2 w-2 bg-[#5FD07F]" />
              <span>01 // OUTBOUND TRANSMISSION</span>
            </div>
            <span className="border border-[#1D7438] bg-[#DCEBD9] px-3 py-1 font-mono text-[11px] font-bold tracking-wide text-[#1D7438]">
              DELIVERED · 250 OK
            </span>
          </div>

          {/* Clean Document Payload */}
          <div className="bg-white p-7 sm:p-9 space-y-6">
            <div>
              <span className="block font-mono text-[11px] uppercase tracking-widest text-[#4D76A8]">
                RECIPIENT RFC-5322
              </span>
              <div className="mt-1 font-mono text-[18px] sm:text-[22px] font-bold text-[#0755B5] tracking-tight">
                aarav.sharma@example.test
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 border-t border-[#0755B5]/12 pt-5">
              <div>
                <span className="block font-mono text-[11px] uppercase tracking-widest text-[#4D76A8]">
                  SUBJECT
                </span>
                <div className="mt-1 text-[15px] sm:text-[17px] font-bold text-[#0755B5] tracking-tight">
                  Welcome to Patra · Workspace Active
                </div>
              </div>
              <div>
                <span className="block font-mono text-[11px] uppercase tracking-widest text-[#4D76A8]">
                  DISPATCH ROUTE
                </span>
                <div className="mt-1 font-mono text-[13px] sm:text-[14px] font-medium text-[#0755B5]">
                  Resend · TLS 1.3 · DKIM Pass
                </div>
              </div>
            </div>

            <div className="rounded-none border border-[#0755B5]/15 bg-[#F4F2E8]/40 p-4 text-[13px] sm:text-[14px] text-[#0755B5]/85 leading-relaxed font-sans">
              &ldquo;Your self-hosted workspace is operational. Templates, recipient segments, and queue rate limits have been verified.&rdquo;
            </div>

            <div className="border-t border-dashed border-[#0755B5]/25 pt-4 font-mono text-[11px] sm:text-[12px] text-[#4D76A8] flex flex-wrap items-center justify-between gap-2">
              <span>QUEUE LATENCY: 14MS</span>
              <span className="text-[#0755B5] font-semibold">TLS 1.3 ENCRYPTION</span>
              <span className="text-[#1D7438] font-bold">100% INBOX REACH</span>
            </div>
          </div>

          {/* Object Base Seal */}
          <div className="flex items-center justify-between bg-[#F4F2E8] px-6 py-4 border-t border-[#0755B5]/15">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center border border-[#0755B5] bg-[#0755B5] text-[#F4F2E8]">
                <Icon.Send size={15} />
              </div>
              <span className="font-display text-[14px] sm:text-[15px] font-bold tracking-tight text-[#0755B5]">
                PATRA MAIL PLATFORM
              </span>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#0755B5]/65">
              ID: PKT_9941_TX
            </span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Swiss Editorial Statement */}
      <div className="relative z-10 border-l-[3.5px] border-[#F4F2E8] pl-6 space-y-2.5">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#F4F2E8]/75">
          SELF-HOSTED EMAIL INFRASTRUCTURE
        </div>
        <h2 className="display text-[34px] sm:text-[42px] xl:text-[48px] leading-[1.04] tracking-[-0.035em] font-bold text-[#F4F2E8] text-balance">
          The layer above your mail provider.
        </h2>
        <p className="max-w-lg text-[14px] sm:text-[15px] leading-relaxed text-[#F4F2E8]/85 text-pretty">
          Bring Resend, AWS SES, or custom SMTP. Manage templates, audiences, and queued dispatches with complete data ownership.
        </p>

        <div className="flex flex-wrap items-center gap-3.5 pt-2 font-mono text-[11px] uppercase tracking-widest text-[#F4F2E8]/65">
          <span>[ ZERO LOCK-IN ]</span>
          <span>[ BULLMQ QUEUES ]</span>
          <span>[ 100% SELF-HOSTED ]</span>
        </div>
      </div>
    </div>
  );
}
