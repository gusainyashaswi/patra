"use client";

export function ProductOverview() {
  const pillars = [
    {
      num: "01",
      title: "Visual Block Designer",
      desc: "Assemble responsive emails on a modular canvas. Drag text, images, buttons, and dividers. Preview variables in real time and compile immutable versions.",
      tag: "TEMPLATES",
    },
    {
      num: "02",
      title: "Audience & Suppression Engine",
      desc: "Import subscriber lists from CSV or Excel (.xlsx). Automated bounce classification and HMAC unsubscribe handling protect your sender reputation.",
      tag: "AUDIENCE",
    },
    {
      num: "03",
      title: "BullMQ Queued Dispatch",
      desc: "Background dispatch workers process outgoing mail with strict rate limiting, exponential backoff retries, and worker crash reconciliation.",
      tag: "DELIVERY",
    },
    {
      num: "04",
      title: "Carrier-Agnostic Transports",
      desc: "Connect Resend, Amazon SES, or custom SMTP with AES-256-GCM encrypted API keys. Verify domains and manage multi-tenant senders.",
      tag: "TRANSPORTS",
    },
  ];

  return (
    <section id="features" className="w-full border-b border-[rgba(7,85,181,0.2)] bg-[#F4F2E8] text-[#0755B5] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
            [ ARCHITECTURE & CAPABILITIES ]
          </div>
          <h2 className="display-section text-[#0755B5] font-yellix">
            The complete transmission engine.
          </h2>
          <p className="text-[17px] leading-relaxed text-[rgba(7,85,181,0.85)]">
            Everything between your application database and inbox delivery, packaged into one self-hosted platform.
          </p>
        </div>

        {/* 4 Pillars Grid (2x2) */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 border-2 border-[#0755B5] bg-[#FFFFFF] shadow-[6px_6px_0_0_#0755B5]">
          {pillars.map((pillar, idx) => (
            <div
              key={pillar.num}
              className={`p-7 sm:p-9 flex flex-col justify-between space-y-4 ${
                idx % 2 === 0 ? "md:border-r border-[#0755B5]" : ""
              } ${idx < 2 ? "border-b border-[#0755B5]" : ""}`}
            >
              <div>
                <div className="font-mono text-[11px] text-[rgba(7,85,181,0.6)] uppercase pb-2.5 border-b border-[rgba(7,85,181,0.15)] flex justify-between items-center">
                  <span>{pillar.num}</span>
                  <span className="font-pixel text-[10px] tracking-wider">{pillar.tag}</span>
                </div>
                <h3 className="font-yellix text-[22px] sm:text-[24px] font-bold mt-4 tracking-tight">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[rgba(7,85,181,0.8)] font-sans">
                  {pillar.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
