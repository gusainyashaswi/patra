"use client";

import { useState } from "react";

export function CampaignPreview() {
  const [queued, setQueued] = useState(false);

  return (
    <div className="w-full border-2 border-[#0755B5] bg-[#F4F2E8] p-5 sm:p-7 text-[#0755B5] shadow-sm font-sans select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(7,85,181,0.25)] pb-4">
        <div>
          <span className="font-pixel text-[11px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
            Campaign Composer & Idempotency Gate
          </span>
          <h3 className="font-yellix text-[22px] font-semibold tracking-tight text-[#0755B5] mt-0.5">
            New Broadcast: Q4 Community Release
          </h3>
        </div>
        <span className="text-[11px] font-mono uppercase bg-[rgba(7,85,181,0.08)] border border-[#0755B5] px-2.5 py-1">
          STATUS: DRAFT
        </span>
      </div>

      {/* Form Controls */}
      <div className="mt-5 space-y-4 font-mono text-[13px]">
        {/* Template Version Pin */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[rgba(7,85,181,0.7)] mb-1">
            Pinned Template Version
          </label>
          <div className="border border-[#0755B5] bg-[#ffffff] px-3.5 py-2.5 flex items-center justify-between">
            <span className="font-bold">Release Notes (Version 3 — Immutable)</span>
            <span className="text-[11px] text-[#1D7438]">PINNED</span>
          </div>
        </div>

        {/* Sender Identity Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[rgba(7,85,181,0.7)] mb-1">
              Sender Identity
            </label>
            <div className="border border-[#0755B5] bg-[#ffffff] px-3.5 py-2.5">
              <span>Yashaswi &lt;updates@patra.dev&gt;</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[rgba(7,85,181,0.7)] mb-1">
              Target Audience
            </label>
            <div className="border border-[#0755B5] bg-[#ffffff] px-3.5 py-2.5">
              <span>Developers List (1,248 contacts)</span>
            </div>
          </div>
        </div>

        {/* Pre-Send Estimator Card */}
        <div className="border-2 border-[#0755B5] bg-[rgba(7,85,181,0.04)] p-4">
          <div className="text-[11px] font-pixel uppercase tracking-widest text-[rgba(7,85,181,0.7)] mb-2">
            Pre-Dispatch Estimator Calculation
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-[#ffffff] border border-[rgba(7,85,181,0.3)] p-2.5">
              <div className="text-[10px] text-[rgba(7,85,181,0.6)] uppercase">Total List</div>
              <div className="text-[16px] font-bold mt-0.5">1,248</div>
            </div>
            <div className="bg-[#ffffff] border border-[rgba(7,85,181,0.3)] p-2.5">
              <div className="text-[10px] text-[rgba(7,85,181,0.6)] uppercase">Suppressed</div>
              <div className="text-[16px] font-bold text-[#B42318] mt-0.5">- 14</div>
            </div>
            <div className="bg-[#ffffff] border border-[rgba(7,85,181,0.3)] p-2.5">
              <div className="text-[10px] text-[rgba(7,85,181,0.6)] uppercase">Missing Vars</div>
              <div className="text-[16px] font-bold text-[#8F5200] mt-0.5">0</div>
            </div>
            <div className="bg-[#ffffff] border-2 border-[#0755B5] p-2.5">
              <div className="text-[10px] text-[rgba(7,85,181,0.8)] font-bold uppercase">Sendable</div>
              <div className="text-[16px] font-bold text-[#1D7438] mt-0.5">1,234</div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-[rgba(7,85,181,0.75)] font-sans">
            Suppressed addresses and recipients missing required template variables are excluded before dispatch begins.
          </div>
        </div>
      </div>

      {/* Dispatch Action */}
      <div className="mt-6 pt-4 border-t border-[rgba(7,85,181,0.2)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <span className="text-[12px] font-mono text-[rgba(7,85,181,0.7)]">
          {queued ? "✓ Atomic 202 Accepted — BullMQ job queued" : "Idempotency guaranteed: duplicate sends return 409"}
        </span>
        <button
          onClick={() => setQueued(true)}
          className="mkt-btn mkt-btn-primary mkt-btn-sm text-[13px] font-mono w-full sm:w-auto"
        >
          {queued ? "✓ Enqueued to Worker" : "Send Campaign (1,234 Recipients)"}
        </button>
      </div>
    </div>
  );
}
