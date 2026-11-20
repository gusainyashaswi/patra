"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

interface Carrier {
  id: "RESEND" | "SES" | "SMTP";
  name: string;
  role: string;
  rate: string;
  latency: string;
  status: "ACTIVE" | "STANDBY";
}

const CARRIERS: Carrier[] = [
  { id: "RESEND", name: "Resend", role: "Primary Provider", rate: "100 msg/s", latency: "14ms", status: "ACTIVE" },
  { id: "SES", name: "AWS SES", role: "High-Throughput", rate: "250 msg/s", latency: "22ms", status: "STANDBY" },
  { id: "SMTP", name: "Campus SMTP", role: "Custom Gateway", rate: "25 msg/s", latency: "38ms", status: "STANDBY" },
];

const LOG_EVENTS = [
  { time: "10:42:08.112", tag: "GATE", color: "text-[#5FD07F]", text: "Idempotency key idemp_098a verified · duplicate check pass" },
  { time: "10:42:08.240", tag: "MIME", color: "text-[#86A6FF]", text: "Template 'onboarding_v2' hydrated with 6 recipient variables" },
  { time: "10:42:08.384", tag: "ROUTER", color: "text-[#FBBF24]", text: "Selected carrier RESEND via real-time latency arbitration" },
  { time: "10:42:08.520", tag: "DELIVER", color: "text-[#5FD07F]", text: "Remote MTA accepted payload (250 2.0.0 OK dkim=pass spf=pass)" },
];

export function MailTransmissionSystem() {
  const [activeCarrier, setActiveCarrier] = useState<Carrier["id"]>("RESEND");
  const [logIndex, setLogIndex] = useState(0);

  // Periodic cycle of live telemetry feed
  useEffect(() => {
    const timer = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % LOG_EVENTS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const selected = CARRIERS.find((c) => c.id === activeCarrier) || CARRIERS[0];

  return (
    <div className="relative flex h-full min-h-[720px] w-full flex-col justify-between overflow-hidden bg-[#0755B5] p-6 text-[#F4F2E8] select-none sm:p-8 xl:p-10">
      {/* 1. Architectural Precision Drafting Grid Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(244, 242, 232, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(244, 242, 232, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
        }}
        aria-hidden="true"
      />

      {/* Subtle radial focus aura */}
      <div
        className="pointer-events-none absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 h-[440px] w-[440px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(244, 242, 232, 0.4) 0%, rgba(7, 85, 181, 0) 70%)",
        }}
        aria-hidden="true"
      />

      {/* Technical Ruler & Corner Coordinates */}
      <div className="pointer-events-none absolute left-4 top-3 font-mono text-[9px] uppercase tracking-widest text-[#F4F2E8]/40">
        + SYS_COORD // 28.6139°N 77.2090°E
      </div>
      <div className="pointer-events-none absolute right-4 top-3 font-mono text-[9px] uppercase tracking-widest text-[#F4F2E8]/40">
        GRID: 36×36 ARCH // 001 +
      </div>

      {/* 2. Top System Status Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#F4F2E8]/20 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5FD07F] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5FD07F]" />
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#F4F2E8]">
            THE MAIL TRANSMISSION SYSTEM
          </span>
          <span className="border border-[#F4F2E8]/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#F4F2E8]/80">
            PIPELINE v0.9
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-[#F4F2E8]/80">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-[#5FD07F]" /> 100% INBOX REACH
          </span>
          <span className="border-l border-[#F4F2E8]/20 pl-2.5 text-[#F4F2E8]/60">
            14MS LATENCY
          </span>
        </div>
      </div>

      {/* 3. Central Stage: Well-Spaced, Unobstructed Pipeline Architecture */}
      <div className="relative z-10 my-auto py-4">
        {/* Upper Tier: Ingest Template (Left) & Carrier Matrix (Right) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.1fr_1fr] items-start">
          {/* Card A: Template Composition (Upper Left) */}
          <div className="border border-[#F4F2E8]/35 bg-[#F4F2E8] p-3 text-[#0755B5] shadow-[4px_4px_0_0_rgba(244,242,232,0.25)]">
            <div className="flex items-center justify-between border-b border-[#0755B5]/20 pb-1.5 font-mono text-[9px] uppercase tracking-wider">
              <span className="font-bold">01 // TEMPLATE INGEST</span>
              <span className="border border-[#1D7438] bg-[#DCEBD9] px-1 font-semibold text-[#1D7438]">V2.4</span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] leading-snug">
              <div className="font-mono text-[9px] text-[#0755B5]/70">Subject: Welcome to Patra</div>
              <div className="font-bold text-[#0755B5] truncate">
                Hello <span className="border border-[#0755B5] bg-[#0755B5]/10 px-1 font-mono text-[9px]">{"{{first_name}}"}</span>
              </div>
              <p className="text-[10px] text-[#0755B5]/80 line-clamp-1">Your new workspace is active and ready.</p>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-[#0755B5]/15 pt-1.5 font-mono text-[8.5px]">
              <span className="text-[#1D7438] font-bold">IMMUTABLE SNAPSHOT</span>
              <span className="text-[#0755B5]/65">STRICT ESCAPING</span>
            </div>
          </div>

          {/* Card B: Carrier Routing Matrix (Upper Right) */}
          <div className="border border-[#F4F2E8]/35 bg-[#0755B5]/70 p-3 backdrop-blur-xs">
            <div className="flex items-center justify-between border-b border-[#F4F2E8]/20 pb-1.5 font-mono text-[9px] uppercase tracking-wider text-[#F4F2E8]/75">
              <span>03 // CARRIER ROUTING</span>
              <span className="text-[#5FD07F]">LATENCY-AWARE</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {CARRIERS.map((c) => {
                const isSelected = activeCarrier === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCarrier(c.id)}
                    aria-pressed={isSelected}
                    className={`text-left p-1.5 transition-all cursor-pointer border ${
                      isSelected
                        ? "border-[#F4F2E8] bg-[#F4F2E8] text-[#0755B5] shadow-[2px_2px_0_0_rgba(244,242,232,0.4)]"
                        : "border-[#F4F2E8]/30 bg-[#0755B5] text-[#F4F2E8] hover:border-[#F4F2E8]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[9px] font-bold">
                      <span className="truncate">{c.name}</span>
                      <span className={`h-1.5 w-1.5 shrink-0 ${isSelected ? "bg-[#1D7438] animate-pulse-dot" : "bg-[#F4F2E8]/40"}`} />
                    </div>
                    <div className="mt-0.5 font-mono text-[8px] opacity-75">{c.rate}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Connector SVG Flow Indicator */}
        <div className="my-2 flex items-center justify-center gap-3 font-mono text-[9px] text-[#F4F2E8]/50 uppercase tracking-widest">
          <span>↓ COMPILED PAYLOAD</span>
          <span className="h-px w-24 bg-[#F4F2E8]/20" />
          <span>ROUTED VIA {selected.name.toUpperCase()} ↓</span>
        </div>

        {/* Middle Tier: The Central Mail Object (100% Unobstructed Hero) */}
        <div className="relative mx-auto max-w-[460px]">
          <div className="border-2 border-[#F4F2E8] bg-[#F4F2E8] text-[#0755B5] shadow-[8px_8px_0_0_rgba(244,242,232,0.3)] transition-all duration-300 hover:scale-[1.01]">
            {/* Object Header Rail */}
            <div className="flex items-center justify-between border-b-2 border-[#0755B5] bg-[#0755B5] px-4 py-2 text-[#F4F2E8]">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-[#5FD07F] animate-pulse-dot" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                  02 // TRANSMISSION OBJECT
                </span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#F4F2E8]/75">
                ID: PKT_9941_TX
              </span>
            </div>

            {/* Inner Document Extract Payload */}
            <div className="border-b border-[#0755B5]/25 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#4D76A8]">
                    RECIPIENT RFC-5322
                  </span>
                  <div className="font-mono text-[12px] font-bold text-[#0755B5]">
                    aarav.sharma@example.test
                  </div>
                </div>
                <div className="border border-[#1D7438] bg-[#DCEBD9] px-2 py-0.5 font-mono text-[9px] font-bold text-[#1D7438]">
                  VERIFIED READY
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-[#0755B5]/20 pt-2 font-mono text-[9px] text-[#4D76A8]">
                <span>LATENCY: {selected.latency}</span>
                <span className="font-bold text-[#0755B5]">ACTIVE CARRIER: {selected.name}</span>
                <span>ENC: TLS 1.3</span>
              </div>

              {/* Barcode / Authentication Hash Glyph */}
              <div className="mt-2.5 flex items-center gap-1 opacity-45" aria-hidden="true">
                <span className="h-2.5 w-1 bg-[#0755B5]" />
                <span className="h-2.5 w-2 bg-[#0755B5]" />
                <span className="h-2.5 w-0.5 bg-[#0755B5]" />
                <span className="h-2.5 w-1.5 bg-[#0755B5]" />
                <span className="h-2.5 w-3 bg-[#0755B5]" />
                <span className="h-2.5 w-1 bg-[#0755B5]" />
                <span className="h-2.5 w-0.5 bg-[#0755B5]" />
                <span className="h-2.5 w-2 bg-[#0755B5]" />
                <span className="h-2.5 w-1.5 bg-[#0755B5]" />
                <span className="h-2.5 w-3.5 bg-[#0755B5]" />
              </div>
            </div>

            {/* Object Base & Physical Dispatch Seal */}
            <div className="flex items-center justify-between bg-[#F4F2E8] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-7 w-7 place-items-center border border-[#0755B5] bg-[#0755B5] text-[#F4F2E8]">
                  <Icon.Send size={13} />
                </div>
                <div>
                  <div className="font-display text-[12px] font-bold tracking-tight text-[#0755B5]">
                    PATRA TRANSMISSION
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-[#1A4D8C]">
                    DISPATCH GATEWAY: {selected.id}
                  </div>
                </div>
              </div>

              <div className="border border-[#0755B5] px-2 py-0.5 text-center font-mono text-[8px] font-bold uppercase tracking-widest text-[#0755B5]">
                VERIFIED
              </div>
            </div>
          </div>
        </div>

        {/* Lower Tier: Delivery Health Telemetry (Dedicated Separate Pod) */}
        <div className="mt-4 border border-[#F4F2E8]/35 bg-[#F4F2E8] p-3 text-[#0755B5] shadow-[4px_4px_0_0_rgba(244,242,232,0.25)]">
          <div className="flex items-center justify-between font-mono text-[9px] font-bold uppercase tracking-wider">
            <span>04 // DELIVERY TELEMETRY</span>
            <span className="text-[#1D7438]">INBOX REACH 99.2%</span>
          </div>
          <div className="mt-1.5 flex h-2 overflow-hidden border border-[#0755B5] bg-[#0755B5]/10">
            <div className="bg-[#1D7438] transition-all duration-500" style={{ width: "72%" }} />
            <div className="bg-[#0755B5] transition-all duration-500" style={{ width: "26%" }} />
            <div className="bg-[#B42318] transition-all duration-500" style={{ width: "2%" }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between font-mono text-[9px]">
            <span className="text-[#1D7438] font-bold">774 Delivered (72%)</span>
            <span className="text-[#0755B5] font-bold">300 In Flight (26%)</span>
            <span className="text-[#B42318] font-bold">12 Bounced (2%)</span>
          </div>
        </div>
      </div>

      {/* 4. Real-time Transmission Activity Stream Terminal */}
      <div className="relative z-10 border border-[#F4F2E8]/30 bg-[#0755B5]/90 p-3 backdrop-blur-xs shadow-[4px_4px_0_0_rgba(244,242,232,0.15)]">
        <div className="flex items-center justify-between border-b border-[#F4F2E8]/20 pb-1.5">
          <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-wider text-[#F4F2E8]">
            <span className="h-1.5 w-1.5 bg-[#5FD07F] animate-pulse-dot" />
            <span>ACTIVITY LOG STREAM</span>
          </div>
          <span className="font-mono text-[8.5px] text-[#F4F2E8]/60 uppercase tracking-widest">
            ROUTER CLUSTER: AS-EAST-1
          </span>
        </div>

        <div className="mt-2 space-y-1 font-mono text-[10px] leading-relaxed">
          {LOG_EVENTS.map((ev, i) => {
            const isCurrent = i === logIndex;
            return (
              <div
                key={ev.time}
                className={`flex items-start gap-2 transition-all duration-300 ${
                  isCurrent ? "opacity-100 font-bold" : "opacity-40"
                }`}
              >
                <span className="text-[#F4F2E8]/60 shrink-0 tabular">{ev.time}</span>
                <span className={`${ev.color} shrink-0`}>[{ev.tag}]</span>
                <span className="truncate text-[#F4F2E8]">{ev.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Expressive Swiss Editorial Statement */}
      <div className="relative z-10 mt-4 border-l-[3px] border-[#F4F2E8] pl-4">
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#F4F2E8]/75">
          INFRASTRUCTURE ORCHESTRATION / 001
        </div>
        <h2 className="display mt-1 text-[28px] sm:text-[34px] xl:text-[38px] leading-[1.02] tracking-[-0.035em] text-[#F4F2E8] text-balance">
          THE LAYER <br />
          ABOVE YOUR <br />
          MAIL PROVIDER.
        </h2>
        <p className="mt-2 max-w-lg text-[13px] sm:text-[14px] leading-relaxed text-[#F4F2E8]/85 text-pretty">
          Bring Resend, SES or SMTP. Patra handles templates, audiences, queued delivery and per-recipient tracking with zero vendor lock-in.
        </p>
      </div>
    </div>
  );
}
