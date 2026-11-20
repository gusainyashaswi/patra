"use client";

import { useEffect, useState } from "react";

export function TrackingPreview() {
  const [filter, setFilter] = useState<string>("ALL");
  const [events, setEvents] = useState([
    { id: "del_99182a", email: "priya.nair@techscale.io", status: "DELIVERED", time: "2s ago", latency: "142ms", providerId: "resend_msg_01JBX" },
    { id: "del_88271b", email: "vikas.sharma@enterprise.test", status: "OPENED", time: "8s ago", latency: "210ms", providerId: "resend_msg_01JBW" },
    { id: "del_77360c", email: "samir.khan@olddomain.test", status: "BOUNCED", time: "14s ago", latency: "512ms", providerId: "resend_msg_01JBV", note: "Hard Bounce -> Auto-Suppressed" },
    { id: "del_66459d", email: "arjun.das@cloudstudio.com", status: "SENT", time: "22s ago", latency: "115ms", providerId: "resend_msg_01JBU" },
    { id: "del_55348e", email: "nisha.gupta@fintech.test", status: "DELIVERED", time: "30s ago", latency: "135ms", providerId: "resend_msg_01JBT" },
  ]);

  // Subtle live event injection to showcase Server-Sent Events (SSE)
  useEffect(() => {
    const timer = setInterval(() => {
      setEvents((prev) => {
        const first = prev[0];
        const nextStatus = first.status === "SENT" ? "DELIVERED" : first.status === "DELIVERED" ? "OPENED" : "DELIVERED";
        const updated = { ...first, status: nextStatus, time: "Just now" };
        return [updated, ...prev.slice(1)];
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const filtered = filter === "ALL" ? events : events.filter((e) => e.status === filter);

  return (
    <div className="w-full border-2 border-[rgba(244,242,232,0.4)] bg-[#0755B5] text-[#F4F2E8] p-5 sm:p-7 select-none font-mono text-[13px] shadow-xl">
      {/* Top Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(244,242,232,0.25)] pb-4">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 bg-[#5FD07F] mkt-pulse-dot" />
          <span className="font-bold tracking-wider text-[12px] uppercase">
            LIVE STREAM: /api/orgs/org_01/campaigns/cp_981/stream
          </span>
        </div>
        <div className="text-[11px] text-[rgba(244,242,232,0.7)] uppercase tracking-wider">
          SVIX WEBHOOK SIGNATURE: VERIFIED
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
        {["ALL", "DELIVERED", "OPENED", "BOUNCED", "SENT"].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 uppercase tracking-wider transition-colors cursor-pointer border ${
              filter === st
                ? "bg-[#F4F2E8] text-[#0755B5] font-bold border-[#F4F2E8]"
                : "border-[rgba(244,242,232,0.3)] hover:bg-white/10 text-[#F4F2E8]"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Real-time Recipient Status Stream */}
      <div className="mt-4 border border-[rgba(244,242,232,0.2)] bg-[rgba(7,85,181,0.5)] overflow-x-auto -mx-1 sm:mx-0">
        <table className="w-full min-w-[540px] sm:min-w-full text-left text-[12px] border-collapse">
          <thead>
            <tr className="border-b border-[rgba(244,242,232,0.2)] bg-[rgba(244,242,232,0.06)] text-[11px] uppercase tracking-wider text-[rgba(244,242,232,0.7)]">
              <th className="p-2.5">Recipient</th>
              <th className="p-2.5">Status Transition</th>
              <th className="p-2.5">Provider Message ID</th>
              <th className="p-2.5 text-right">Telemetry</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ev, i) => (
              <tr key={i} className="border-b border-[rgba(244,242,232,0.1)] last:border-0 hover:bg-[rgba(244,242,232,0.04)]">
                <td className="p-2.5 font-bold truncate max-w-[200px]">{ev.email}</td>
                <td className="p-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      ev.status === "DELIVERED"
                        ? "bg-[#11251A] text-[#5FD07F] border border-[#5FD07F]"
                        : ev.status === "OPENED"
                        ? "bg-[#121A30] text-[#86A6FF] border border-[#86A6FF]"
                        : ev.status === "BOUNCED"
                        ? "bg-[#2C1412] text-[#FF7A6B] border border-[#FF7A6B]"
                        : "bg-[#2A2010] text-[#F2B54A] border border-[#F2B54A]"
                    }`}
                  >
                    {ev.status}
                  </span>
                  {ev.note && <span className="ml-2 text-[10px] text-[#FF7A6B]">{ev.note}</span>}
                </td>
                <td className="p-2.5 text-[rgba(244,242,232,0.6)] font-mono text-[11px]">{ev.providerId}</td>
                <td className="p-2.5 text-right font-mono text-[11px] text-[rgba(244,242,232,0.8)]">
                  {ev.latency} · {ev.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Safety Notice Footer */}
      <div className="mt-4 pt-3 border-t border-[rgba(244,242,232,0.2)] flex flex-wrap items-center justify-between text-[11px] text-[rgba(244,242,232,0.7)]">
        <span>✓ Auto-pause triggered if bounce rate exceeds 5% after 50 dispatches</span>
        <span className="text-[#5FD07F] font-semibold">Active Bounce Rate: 1.1% (Safe)</span>
      </div>
    </div>
  );
}
