"use client";

import { ArchitectureDiagram } from "./mockups/ArchitectureDiagram";

export function DeveloperSection() {
  return (
    <section id="architecture" className="w-full border-b border-[rgba(244,242,232,0.25)] bg-[#0755B5] text-[#F4F2E8] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="max-w-3xl space-y-4 mb-14">
          <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(244,242,232,0.6)]">
            [11] SYSTEM ARCHITECTURE & FAULT TOLERANCE
          </div>
          <h2 className="display-section text-[#F4F2E8]">
            Engineered for resilience. Tested against failure.
          </h2>
          <p className="text-[17px] sm:text-[18px] leading-relaxed text-[rgba(244,242,232,0.9)] font-sans">
            Sending bulk email reliably requires an engine that survives container restarts, network partitions, and provider throttling. Patra was built from day one around crash resilience and idempotency.
          </p>
        </div>

        {/* Big Interactive Architecture Diagram */}
        <div className="w-full">
          <ArchitectureDiagram />
        </div>

        {/* Resilience Verification Callouts */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-[12px] border-t border-[rgba(244,242,232,0.2)] pt-8">
          <div className="space-y-1">
            <span className="text-[#5FD07F] font-bold">CRASH RECONCILIATION</span>
            <p className="font-sans text-[13px] text-[rgba(244,242,232,0.8)] mt-1">
              5-minute cron discovers orphaned queued recipients if a worker is killed mid-dispatch (SIGKILL).
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[#5FD07F] font-bold">IDEMPOTENT JOBS</span>
            <p className="font-sans text-[13px] text-[rgba(244,242,232,0.8)] mt-1">
              BullMQ job ID is pinned directly to the recipient record ID. Retries never spawn duplicate emails.
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[#5FD07F] font-bold">FORWARD-ONLY STATE</span>
            <p className="font-sans text-[13px] text-[rgba(244,242,232,0.8)] mt-1">
              Delayed webhooks cannot regress recipient status (QUEUED &lt; SENT &lt; DELIVERED &lt; OPENED).
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[#5FD07F] font-bold">ISOLATED PROCESSES</span>
            <p className="font-sans text-[13px] text-[rgba(244,242,232,0.8)] mt-1">
              The Express API and BullMQ worker run as separate containers. API restarts never halt in-flight delivery.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
