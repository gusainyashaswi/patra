"use client";

export function WorkflowSection() {
  const steps = [
    {
      step: "01",
      title: "Connect Your Transport",
      desc: "Provide your Resend API credentials, set requests-per-second limits and daily volume quotas, and link sender identities to verified domains.",
      detail: "AES-256-GCM encrypted credentials",
    },
    {
      step: "02",
      title: "Design & Publish",
      desc: "Compose modular blocks on the canvas. Preview merge tags like {{first_name}} with sample data, then publish an immutable, locked template version.",
      detail: "Atomic version counter increment",
    },
    {
      step: "03",
      title: "Validate Your Audience",
      desc: "Upload a CSV or Excel file up to 50,000 rows. Review parsed syntax errors, resolve duplicate rows, and filter out suppressed addresses with zero side effects.",
      detail: "Non-committing preview table",
    },
    {
      step: "04",
      title: "Dispatch & Track Live",
      desc: "Trigger the campaign. BullMQ queues jobs with rate throttling while the separate worker daemon delivers emails and live SSE streams delivery events.",
      detail: "Svix webhook signature verification",
    },
  ];

  return (
    <section className="w-full border-b border-[rgba(7,85,181,0.25)] bg-[#F4F2E8] text-[#0755B5] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="max-w-3xl space-y-4">
          <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
            [09] END-TO-END WORKFLOW
          </div>
          <h2 className="display-section text-[#0755B5]">
            From setup to inbox in four steps.
          </h2>
          <p className="text-[17px] sm:text-[18px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans">
            A clear, dependable dispatch flow built for engineering teams that need predictability at every stage.
          </p>
        </div>

        {/* 4 Steps Horizontal Stepper */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-2 border-[#0755B5] bg-[#ffffff]">
          {steps.map((st, i) => (
            <div
              key={st.step}
              className={`p-8 flex flex-col justify-between space-y-6 ${
                i < 3 ? "border-b lg:border-b-0 lg:border-r border-[#0755B5]" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(7,85,181,0.2)] font-mono text-[12px]">
                  <span className="font-pixel text-[#0755B5] text-[13px] font-bold">STEP {st.step}</span>
                  <span className="text-[rgba(7,85,181,0.6)]">PHASE {i + 1}</span>
                </div>
                <h3 className="font-yellix text-[22px] font-bold mt-4 tracking-tight">
                  {st.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[rgba(7,85,181,0.8)] font-sans">
                  {st.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[rgba(7,85,181,0.15)] font-mono text-[11px] text-[#1D7438]">
                ✓ {st.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
