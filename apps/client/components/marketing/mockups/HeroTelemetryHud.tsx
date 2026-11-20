"use client";

import { useEffect, useState } from "react";

export function HeroTelemetryHud() {
  const [inFlightCount, setInFlightCount] = useState(48);
  const [deliveredCount, setDeliveredCount] = useState(1184);

  // Gentle micro-telemetry animation to bring the console to life
  useEffect(() => {
    const interval = setInterval(() => {
      setInFlightCount((prev) => (prev > 12 ? prev - 2 : 48));
      setDeliveredCount((prev) => prev + 2);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full border border-[rgba(244,242,232,0.3)] bg-[#0755B5] text-[#F4F2E8] p-4 sm:p-7 select-none font-mono text-[13px] overflow-hidden">
      {/* Top Console Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[rgba(244,242,232,0.25)] pb-3 sm:pb-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 bg-[#5FD07F] mkt-pulse-dot" aria-hidden="true" />
          <span className="font-semibold tracking-wider text-[10px] sm:text-[11px] uppercase truncate">
            LIVE ENGINE TELEMETRY · SSE CONNECTED
          </span>
        </div>
        <div className="text-[10px] sm:text-[11px] text-[rgba(244,242,232,0.7)] tracking-wider uppercase">
          QUEUE: BULLMQ · WORKER #1
        </div>
      </div>

      {/* Campaign Details Header */}
      <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-[rgba(244,242,232,0.15)]">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[rgba(244,242,232,0.6)]">
            Active Campaign
          </div>
          <div className="text-[14px] sm:text-[15px] font-sans font-semibold tracking-tight text-[#F4F2E8] mt-0.5 truncate">
            Product Launch — Wave 1 Announcement
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[rgba(244,242,232,0.6)]">
            Sender & Transport
          </div>
          <div className="text-[12px] sm:text-[13px] text-[#F4F2E8] mt-0.5 truncate">
            team@patra.dev · Resend (Rate: 2/s)
          </div>
        </div>
      </div>

      {/* Funnel Progress Bar */}
      <div className="mt-4 sm:mt-5">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[rgba(244,242,232,0.8)] mb-2">
          <span>PROGRESS (1,248 RECIPIENTS)</span>
          <span className="tabular-nums font-semibold">95.3% COMPLETE</span>
        </div>
        <div className="h-2.5 w-full bg-[rgba(244,242,232,0.15)] flex overflow-hidden">
          <div style={{ width: "88%" }} className="bg-[#5FD07F] transition-all duration-700" title="Delivered" />
          <div style={{ width: "9%" }} className="bg-[#FAC6B0] transition-all duration-700" title="In Flight" />
          <div style={{ width: "3%" }} className="bg-[#FF7A6B]" title="Bounced" />
        </div>
      </div>

      {/* Counters Grid */}
      <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
        <div className="border border-[rgba(244,242,232,0.2)] bg-[rgba(7,85,181,0.6)] p-2.5 sm:p-3">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[rgba(244,242,232,0.6)]">Delivered</div>
          <div className="text-[18px] sm:text-[20px] font-sans font-bold text-[#5FD07F] mt-0.5 sm:mt-1 tabular-nums">
            {deliveredCount.toLocaleString()}
          </div>
        </div>
        <div className="border border-[rgba(244,242,232,0.2)] bg-[rgba(7,85,181,0.6)] p-2.5 sm:p-3">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[rgba(244,242,232,0.6)]">In Flight</div>
          <div className="text-[18px] sm:text-[20px] font-sans font-bold text-[#FAC6B0] mt-0.5 sm:mt-1 tabular-nums">
            {inFlightCount}
          </div>
        </div>
        <div className="border border-[rgba(244,242,232,0.2)] bg-[rgba(7,85,181,0.6)] p-2.5 sm:p-3">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[rgba(244,242,232,0.6)]">Bounced</div>
          <div className="text-[18px] sm:text-[20px] font-sans font-bold text-[#FF7A6B] mt-0.5 sm:mt-1 tabular-nums">
            14
          </div>
        </div>
        <div className="border border-[rgba(244,242,232,0.2)] bg-[rgba(7,85,181,0.6)] p-2.5 sm:p-3">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[rgba(244,242,232,0.6)]">Suppressed</div>
          <div className="text-[18px] sm:text-[20px] font-sans font-bold text-[#F4F2E8] mt-0.5 sm:mt-1 tabular-nums">
            2
          </div>
        </div>
      </div>

      {/* Recent Delivery Event Log */}
      <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-[rgba(244,242,232,0.2)] text-[10px] sm:text-[11px] space-y-1.5 text-[rgba(244,242,232,0.85)]">
        <div className="flex items-center justify-between gap-2 truncate">
          <span className="truncate">✓ del_891e4a · alex.turner@design.co</span>
          <span className="text-[#5FD07F] shrink-0">DELIVERED (124ms)</span>
        </div>
        <div className="flex items-center justify-between gap-2 truncate">
          <span className="truncate">✓ del_732f9c · sarah.lin@enterprise.io</span>
          <span className="text-[#5FD07F] shrink-0">DELIVERED (108ms)</span>
        </div>
        <div className="flex items-center justify-between gap-2 truncate">
          <span className="truncate">⚡ del_110b8e · marcus.v@acme.corp</span>
          <span className="text-[#FAC6B0] shrink-0">DISPATCHING</span>
        </div>
      </div>
    </div>
  );
}
