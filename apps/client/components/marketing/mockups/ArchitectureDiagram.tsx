"use client";

export function ArchitectureDiagram() {
  return (
    <div className="w-full border-2 border-[rgba(244,242,232,0.35)] bg-[#0755B5] p-5 sm:p-8 text-[#F4F2E8] font-mono text-[12px] shadow-xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(244,242,232,0.25)] pb-4">
        <div>
          <span className="font-pixel text-[11px] uppercase tracking-widest text-[rgba(244,242,232,0.6)]">
            SYSTEM TOPOLOGY & CRASH RESILIENCE
          </span>
          <h3 className="font-yellix text-[24px] font-semibold tracking-tight text-[#F4F2E8] mt-0.5">
            Decoupled API & BullMQ Queue Worker
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-[11px] uppercase tracking-wider bg-[rgba(244,242,232,0.1)] border border-[rgba(244,242,232,0.3)]">
            DOCKER COMPOSE READY
          </span>
        </div>
      </div>

      {/* 3-Tier Grid Diagram */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Tier 1: Ingestion & Control */}
        <div className="border border-[rgba(244,242,232,0.3)] bg-[rgba(7,85,181,0.6)] p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-[11px] text-[rgba(244,242,232,0.6)] uppercase pb-2 border-b border-[rgba(244,242,232,0.15)]">
              <span>TIER 01</span>
              <span>CLIENT & API</span>
            </div>
            <h4 className="font-sans font-bold text-[16px] text-[#F4F2E8] mt-3">Next.js Client + Express API</h4>
            <p className="font-sans text-[13px] text-[rgba(244,242,232,0.8)] mt-2 leading-relaxed">
              Accepts multipart CSV/XLSX imports, serves visual email designer, checks org permissions, and returns immediate <code>202 Accepted</code> for sends.
            </p>
          </div>
          <div className="bg-[rgba(244,242,232,0.06)] border border-[rgba(244,242,232,0.2)] p-2.5 text-[11px] space-y-1">
            <div>• AES-256-GCM Secret Encryption</div>
            <div>• Atomic Idempotency Gate (409)</div>
            <div>• Svix Webhook Signature Verify</div>
          </div>
        </div>

        {/* Tier 2: State & Storage System */}
        <div className="border-2 border-[#F4F2E8] bg-[rgba(7,85,181,0.9)] p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-[11px] text-[#5FD07F] font-bold uppercase pb-2 border-b border-[rgba(244,242,232,0.25)]">
              <span>TIER 02</span>
              <span>STATE & BUFFER</span>
            </div>
            <h4 className="font-sans font-bold text-[16px] text-[#F4F2E8] mt-3">MongoDB 7 + Redis BullMQ</h4>
            <p className="font-sans text-[13px] text-[rgba(244,242,232,0.85)] mt-2 leading-relaxed">
              MongoDB replica set (<code>rs0</code>) guarantees ACID transactions and tenant isolation. Redis manages job queues, rate throttles, and SSE pub/sub fanout.
            </p>
          </div>
          <div className="bg-[rgba(244,242,232,0.08)] border border-[rgba(244,242,232,0.25)] p-2.5 text-[11px] space-y-1">
            <div className="text-[#5FD07F]">✓ BullMQ Backpressure Queue</div>
            <div>• Pub/Sub Real-time Events</div>
            <div>• MinIO / S3 Object Storage</div>
          </div>
        </div>

        {/* Tier 3: Asynchronous Dispatch Engine */}
        <div className="border border-[rgba(244,242,232,0.3)] bg-[rgba(7,85,181,0.6)] p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-[11px] text-[rgba(244,242,232,0.6)] uppercase pb-2 border-b border-[rgba(244,242,232,0.15)]">
              <span>TIER 03</span>
              <span>WORKER DAEMON</span>
            </div>
            <h4 className="font-sans font-bold text-[16px] text-[#F4F2E8] mt-3">Isolated Node.js Worker</h4>
            <p className="font-sans text-[13px] text-[rgba(244,242,232,0.8)] mt-2 leading-relaxed">
              Independent long-running process. Pulls jobs, interpolates variables, calls Resend adapter, retries transient 5xx errors, and auto-reconciles on crash.
            </p>
          </div>
          <div className="bg-[rgba(244,242,232,0.06)] border border-[rgba(244,242,232,0.2)] p-2.5 text-[11px] space-y-1">
            <div>• SIGKILL Crash Resilience</div>
            <div>• 5-Minute Auto-Reconciliation</div>
            <div>• 5% Bounce Rate Auto-Pause</div>
          </div>
        </div>
      </div>

      {/* Provider Connectivity Bar */}
      <div className="mt-6 p-4 border border-[rgba(244,242,232,0.25)] bg-[rgba(244,242,232,0.05)] flex flex-wrap items-center justify-between gap-3 text-[12px]">
        <div className="flex items-center gap-3">
          <span className="text-[#5FD07F] font-bold">● PRODUCTION ADAPTER:</span>
          <span>Resend (Verified Sending Domains + Svix Telemetry)</span>
        </div>
        <div className="text-[rgba(244,242,232,0.7)]">
          PLUGGABLE INTERFACE: <code>ITransport (send, verify)</code>
        </div>
      </div>
    </div>
  );
}
