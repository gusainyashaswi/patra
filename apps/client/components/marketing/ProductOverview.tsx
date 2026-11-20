"use client";

export function ProductOverview() {
  const pillars = [
    {
      num: "01",
      title: "Transport & Sender Identities",
      desc: "Connect your provider credentials with AES-256-GCM encryption at rest. Bind sender identities directly to verified domains, set requests-per-second limits, and enforce daily quotas.",
      features: ["Resend adapter with domain sync", "Encrypted key storage", "Rate limits & UTC daily caps"],
    },
    {
      num: "02",
      title: "Visual Block Designer",
      desc: "A responsive email canvas designed for engineering precision. Assemble text, images, buttons, dividers, and spacers. Preview sample variables live, and compile immutable versions.",
      features: ["Zero-dependency HTML compiler", "Variable escaping & safety", "Immutable version snapshots"],
    },
    {
      num: "03",
      title: "Audience & Ingestion Engine",
      desc: "Import up to 50,000 contact rows from CSV or Excel (.xlsx) files. Inspect parsed records in a non-committing preview that filters syntax errors, duplicates, and suppressions before writing.",
      features: ["CSV & Excel .xlsx parsing", "Non-committing preview", "Auto-suppression filtering"],
    },
    {
      num: "04",
      title: "Queued Dispatch & Telemetry",
      desc: "Atomic campaign scheduling with idempotency gates. BullMQ workers process dispatches with exponential backoff retries, while Svix webhooks stream real-time events over SSE.",
      features: ["Atomic 409 idempotency gate", "Worker crash reconciliation", "Svix signature verified webhooks"],
    },
  ];

  return (
    <section className="w-full border-b border-[rgba(7,85,181,0.25)] bg-[#F4F2E8] text-[#0755B5] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
            [02] ARCHITECTURAL SCOPE
          </div>
          <h2 className="display-section text-[#0755B5]">
            The layer above your mail provider.
          </h2>
          <p className="text-[17px] sm:text-[18px] leading-relaxed text-[rgba(7,85,181,0.85)]">
            Patra doesn’t replace providers like Resend or SES. It sits directly above them, managing everything between your product data and inbox delivery.
          </p>
        </div>

        {/* 4 Pillars Grid (2x2) */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 border-2 border-[#0755B5] bg-[#ffffff]">
          {pillars.map((pillar, idx) => (
            <div
              key={pillar.num}
              className={`p-8 sm:p-10 flex flex-col justify-between space-y-6 ${
                idx % 2 === 0 ? "md:border-r border-[#0755B5]" : ""
              } ${idx < 2 ? "border-b border-[#0755B5]" : ""}`}
            >
              <div>
                <div className="font-mono text-[12px] text-[rgba(7,85,181,0.6)] uppercase pb-3 border-b border-[rgba(7,85,181,0.15)] flex justify-between items-center">
                  <span>PILLAR {pillar.num}</span>
                  <span className="font-pixel text-[11px]">CORE PLATFORM</span>
                </div>
                <h3 className="font-yellix text-[26px] font-bold mt-4 tracking-tight">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-[15px] sm:text-[16px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans">
                  {pillar.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[rgba(7,85,181,0.15)]">
                <ul className="space-y-1.5 text-[13px] font-mono text-[#0755B5]">
                  {pillar.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <span className="text-[#1D7438]">✓</span> {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
