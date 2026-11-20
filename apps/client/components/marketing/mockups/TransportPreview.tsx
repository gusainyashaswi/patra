"use client";

import { useState } from "react";

export function TransportPreview() {
  const [tested, setTested] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setTested(true);
    }, 700);
  };

  return (
    <div className="w-full border-2 border-[#0755B5] bg-[#F4F2E8] p-5 sm:p-7 text-[#0755B5] shadow-sm font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(7,85,181,0.25)] pb-4">
        <div>
          <span className="font-pixel text-[11px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
            Mail Transport Configuration
          </span>
          <h3 className="font-yellix text-[22px] font-semibold tracking-tight text-[#0755B5] mt-0.5">
            Resend Production Adapter
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider bg-[rgba(7,85,181,0.1)] border border-[#0755B5]">
            <span className="h-1.5 w-1.5 bg-[#1D7438]" /> DEFAULT TRANSPORT
          </span>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="mt-5 space-y-4">
        {/* Encrypted Key Field */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-[rgba(7,85,181,0.7)] mb-1">
            API Key (Encrypted with AES-256-GCM)
          </label>
          <div className="flex items-center gap-2 border border-[#0755B5] bg-[#ffffff] px-3.5 py-2.5 font-mono text-[13px] text-[#0755B5]">
            <span className="flex-1 tracking-widest">re_99f2b84**********************</span>
            <span className="text-[11px] uppercase tracking-wider text-[rgba(7,85,181,0.6)] bg-[rgba(7,85,181,0.06)] px-2 py-0.5">
              RESTRICTED
            </span>
          </div>
        </div>

        {/* Rate & Daily Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[rgba(7,85,181,0.7)] mb-1">
              Rate Limit (Dispatches / Second)
            </label>
            <div className="border border-[#0755B5] bg-[#ffffff] px-3.5 py-2.5 font-mono text-[14px] flex items-center justify-between">
              <span className="font-bold">2 msgs/sec</span>
              <span className="text-[11px] text-[rgba(7,85,181,0.6)]">Provider Max: 10/s</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[rgba(7,85,181,0.7)] mb-1">
              Daily Volume Quota (UTC)
            </label>
            <div className="border border-[#0755B5] bg-[#ffffff] px-3.5 py-2.5 font-mono text-[14px] flex items-center justify-between">
              <span className="font-bold">50,000 msgs/day</span>
              <span className="text-[11px] text-[#1D7438]">Active Tier</span>
            </div>
          </div>
        </div>

        {/* Verified Sending Domain Sync */}
        <div className="border border-[rgba(7,85,181,0.3)] bg-[rgba(7,85,181,0.04)] p-4">
          <div className="flex items-center justify-between text-[13px] font-mono">
            <span className="font-semibold">Synced Domain: patra.dev</span>
            <span className="text-[#1D7438] font-bold">✓ VERIFIED (SPF, DKIM, DMARC)</span>
          </div>
          <p className="mt-1 text-[13px] text-[rgba(7,85,181,0.8)] font-sans">
            Sender identities are strictly bound to verified domains. Unverified from addresses are rejected on the server.
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-[rgba(7,85,181,0.2)] flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={handleTest}
          disabled={testing}
          className="mkt-btn mkt-btn-primary mkt-btn-sm text-[12px] font-mono"
        >
          {testing ? "Testing Connection…" : tested ? "✓ Connection Live (28ms)" : "Test Provider Connection"}
        </button>
        <span className="text-[12px] font-mono text-[rgba(7,85,181,0.6)]">
          Last verified: Today, 14:22 UTC
        </span>
      </div>
    </div>
  );
}
