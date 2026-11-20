"use client";

export function UseCasesSection() {
  const cases = [
    {
      label: "CASE 01 / SAAS PRODUCT TEAMS",
      title: "Product Releases & Changelogs",
      desc: "Send high-deliverability release announcements and updates directly through your own verified sending domains without paying per-subscriber penalties to marketing clouds.",
      metric: "Zero per-contact pricing",
    },
    {
      label: "CASE 02 / COMMUNITY & EVENTS",
      title: "Event Registrations & Broadcasts",
      desc: "Import attendee rosters directly from spreadsheet exports with automatic duplicate deduplication, email syntax validation, and instant suppression filtering.",
      metric: "50,000 row Excel/CSV parsing",
    },
    {
      label: "CASE 03 / PRIVACY & COMPLIANCE",
      title: "Sovereign Contact Lists",
      desc: "Maintain strict privacy standards by keeping customer contact records on your own on-premise MongoDB instance rather than leaking user emails to third-party marketing clouds.",
      metric: "Full on-premise data control",
    },
    {
      label: "CASE 04 / AGENCIES & STUDIOS",
      title: "Multi-Identity Mail Infrastructure",
      desc: "Give internal teams a clean visual email builder with immutable version locking while routing mail through isolated sender identities and carrier-level rate throttles.",
      metric: "Multi-domain identity support",
    },
  ];

  return (
    <section className="w-full border-b border-[rgba(7,85,181,0.25)] bg-[#F4F2E8] text-[#0755B5] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="max-w-3xl space-y-4">
          <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
            [10] APPLIED SCENARIOS
          </div>
          <h2 className="display-section text-[#0755B5]">
            Built for teams that care about deliverability and control.
          </h2>
          <p className="text-[17px] sm:text-[18px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans">
            How engineering, product, and operations teams leverage Patra for their mailing infrastructure.
          </p>
        </div>

        {/* 2x2 Asymmetric Case Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 border-2 border-[#0755B5] bg-[#ffffff]">
          {cases.map((cs, i) => (
            <div
              key={cs.label}
              className={`p-8 sm:p-10 flex flex-col justify-between space-y-6 ${
                i % 2 === 0 ? "md:border-r border-[#0755B5]" : ""
              } ${i < 2 ? "border-b border-[#0755B5]" : ""}`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(7,85,181,0.2)] font-mono text-[11px] text-[rgba(7,85,181,0.65)]">
                  <span>{cs.label}</span>
                </div>
                <h3 className="font-yellix text-[24px] font-bold mt-4 tracking-tight">
                  {cs.title}
                </h3>
                <p className="mt-3 text-[15px] sm:text-[16px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans">
                  {cs.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[rgba(7,85,181,0.15)] font-mono text-[12px] text-[#1D7438]">
                ✓ {cs.metric}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
