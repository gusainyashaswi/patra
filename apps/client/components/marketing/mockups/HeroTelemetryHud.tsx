"use client";

import { useEffect, useState } from "react";

export function HeroTelemetryHud() {
  const [inFlightCount, setInFlightCount] = useState(24);
  const [deliveredCount, setDeliveredCount] = useState(1280);

  useEffect(() => {
    const interval = setInterval(() => {
      setInFlightCount((prev) => (prev > 6 ? prev - 2 : 24));
      setDeliveredCount((prev) => prev + 2);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full border-2 border-[#0755B5] bg-[#FFFFFF] text-[#0755B5] p-5 sm:p-7 select-none font-mono shadow-[6px_6px_0_0_#0755B5]">
      {/* Top Console Bar */}
      <div className="flex items-center justify-between border-b border-[rgba(7,85,181,0.2)] pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 bg-[#1D7438] mkt-pulse-dot" aria-hidden="true" />
          <span className="font-semibold text-[11px] uppercase tracking-wider">
            DISPATCH WORKER #1
          </span>
        </div>
        <span className="font-pixel text-[11px] uppercase text-[rgba(7,85,181,0.7)] tracking-wider">
          LIVE TELEMETRY
        </span>
      </div>

      {/* Campaign Details */}
      <div className="mt-4 pb-4 border-b border-[rgba(7,85,181,0.15)]">
        <div className="text-[10px] uppercase tracking-widest text-[rgba(7,85,181,0.6)] font-mono">
          Active Campaign
        </div>
        <div className="text-[16px] sm:text-[17px] font-yellix font-bold tracking-tight text-[#0755B5] mt-0.5">
          Product Launch Announcement
        </div>
        <div className="text-[12px] text-[rgba(7,85,181,0.75)] mt-0.5">
          team@patra.dev · Resend Transport (Rate: 2/s)
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-[rgba(7,85,181,0.8)] mb-1.5 font-mono">
          <span>PROGRESS (1,304 RECIPIENTS)</span>
          <span className="tabular-nums font-bold">98.2%</span>
        </div>
        <div className="h-2 w-full bg-[rgba(7,85,181,0.1)] flex overflow-hidden">
          <div style={{ width: "98%" }} className="bg-[#0755B5] transition-all duration-700" />
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="border border-[rgba(7,85,181,0.2)] bg-[#F4F2E8]/60 p-2.5">
          <div className="text-[9px] uppercase tracking-widest text-[rgba(7,85,181,0.6)]">Delivered</div>
          <div className="text-[18px] font-yellix font-bold text-[#1D7438] mt-0.5 tabular-nums">
            {deliveredCount.toLocaleString()}
          </div>
        </div>
        <div className="border border-[rgba(7,85,181,0.2)] bg-[#F4F2E8]/60 p-2.5">
          <div className="text-[9px] uppercase tracking-widest text-[rgba(7,85,181,0.6)]">In Flight</div>
          <div className="text-[18px] font-yellix font-bold text-[#8F5200] mt-0.5 tabular-nums">
            {inFlightCount}
          </div>
        </div>
        <div className="border border-[rgba(7,85,181,0.2)] bg-[#F4F2E8]/60 p-2.5">
          <div className="text-[9px] uppercase tracking-widest text-[rgba(7,85,181,0.6)]">Bounced</div>
          <div className="text-[18px] font-yellix font-bold text-[#0755B5] mt-0.5 tabular-nums">
            0
          </div>
        </div>
      </div>

      {/* Live Event Stream */}
      <div className="mt-4 pt-3 border-t border-[rgba(7,85,181,0.15)] text-[11px] text-[rgba(7,85,181,0.85)] flex items-center justify-between gap-2">
        <span className="truncate">✓ del_891e · alex@design.co</span>
        <span className="font-semibold text-[#1D7438] shrink-0">120ms</span>
      </div>
    </div>
  );
}
