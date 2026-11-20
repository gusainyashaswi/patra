"use client";

export function OwnershipSection() {
  return (
    <section id="ownership" className="w-full border-b border-[rgba(7,85,181,0.25)] bg-[#F4F2E8] text-[#0755B5] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="max-w-3xl space-y-4">
          <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
            [08] DATA SOVEREIGNTY
          </div>
          <h2 className="display-section text-[#0755B5]">
            Your database. Your queues. Your infrastructure.
          </h2>
          <p className="text-[17px] sm:text-[18px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans">
            Patra runs entirely inside your own infrastructure. Your subscriber emails, custom fields, campaign stats, and design drafts stay on your machines—not in a third-party marketing cloud.
          </p>
        </div>

        {/* 3-Column Architectural Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 border-2 border-[#0755B5] bg-[#ffffff]">
          <div className="p-8 border-b md:border-b-0 md:border-r border-[#0755B5] space-y-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-[rgba(7,85,181,0.6)] uppercase pb-2 border-b border-[rgba(7,85,181,0.15)]">
              <span>STORAGE ENGINE</span>
              <span>MONGODB 7</span>
            </div>
            <h3 className="font-yellix text-[22px] font-bold">MongoDB Replica Sets</h3>
            <p className="text-[15px] leading-relaxed text-[rgba(7,85,181,0.8)] font-sans">
              System of record running with replica set <code>rs0</code> enabled for multi-document ACID transactions. Every query is strictly isolated by <code>organizationId</code>.
            </p>
            <div className="pt-2 font-mono text-[12px] text-[#1D7438]">
              ✓ Tenant isolation enforced at repository level
            </div>
          </div>

          <div className="p-8 border-b md:border-b-0 md:border-r border-[#0755B5] space-y-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-[rgba(7,85,181,0.6)] uppercase pb-2 border-b border-[rgba(7,85,181,0.15)]">
              <span>MESSAGE BUFFER</span>
              <span>REDIS 7</span>
            </div>
            <h3 className="font-yellix text-[22px] font-bold">BullMQ Distributed Queues</h3>
            <p className="text-[15px] leading-relaxed text-[rgba(7,85,181,0.8)] font-sans">
              Reliable job management backed by Redis. Dispatches are paced by provider rate-limits, and transient failures retry automatically with exponential backoff.
            </p>
            <div className="pt-2 font-mono text-[12px] text-[#1D7438]">
              ✓ Exponential backoff starting at 5s
            </div>
          </div>

          <div className="p-8 space-y-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-[rgba(7,85,181,0.6)] uppercase pb-2 border-b border-[rgba(7,85,181,0.15)]">
              <span>IMAGE HOSTING</span>
              <span>S3 / MINIO</span>
            </div>
            <h3 className="font-yellix text-[22px] font-bold">Object Storage Assets</h3>
            <p className="text-[15px] leading-relaxed text-[rgba(7,85,181,0.8)] font-sans">
              Uploaded email images are stored in your own S3 bucket or self-hosted MinIO instance. Never embed fragile base64 strings that email clients block.
            </p>
            <div className="pt-2 font-mono text-[12px] text-[#1D7438]">
              ✓ Up to 5 MB per asset with MIME validation
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
