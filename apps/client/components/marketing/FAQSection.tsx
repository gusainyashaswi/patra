"use client";

import { useState } from "react";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Does Patra replace delivery providers like Resend or AWS SES?",
      a: "No, Patra sits directly above them. We provide the operational layer: mail transport configuration, visual block templates, spreadsheet audience validation, rate-limited queued dispatching, and per-recipient delivery tracking. You bring your own provider credentials.",
    },
    {
      q: "What happens if the background worker process crashes mid-send?",
      a: "Patra is built for worker crash resilience. Every recipient in a campaign is assigned a unique BullMQ job ID equal to its recipient record ID. If a worker process is abruptly killed, a background reconciliation cron detects queued recipients missing active jobs and re-enqueues them safely with zero duplicates.",
    },
    {
      q: "Can I import Excel spreadsheets directly without converting to CSV?",
      a: "Yes. Patra natively parses both .csv and Excel (.xlsx) files up to 50,000 rows and 5 MB. A non-committing preview displays valid syntax, detected duplicates, and suppressed addresses before committing any data to your database.",
    },
    {
      q: "How does Patra handle unsubscribe requests and deliverability compliance?",
      a: "Every email compiled by Patra automatically includes an HMAC-signed unsubscribe token. Clicking the link instantly adds the recipient address to your organization's suppression collection, which is filtered at query time on every subsequent campaign.",
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="w-full border-b border-[rgba(7,85,181,0.2)] bg-[#F4F2E8] text-[#0755B5] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="max-w-2xl space-y-3">
          <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
            [ FREQUENTLY ASKED QUESTIONS ]
          </div>
          <h2 className="display-section text-[#0755B5] font-yellix">
            Frequently asked questions.
          </h2>
          <p className="text-[17px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans">
            Clear answers about Patra’s architecture, guarantees, and self-hosted deployment.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 max-w-3xl border-2 border-[#0755B5] bg-[#FFFFFF] divide-y divide-[#0755B5] shadow-[6px_6px_0_0_#0755B5]">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="transition-colors">
                <button
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-6 sm:p-7 flex items-start justify-between gap-6 cursor-pointer select-none hover:bg-[rgba(7,85,181,0.02)]"
                  aria-expanded={isOpen}
                >
                  <span className="font-yellix text-[18px] sm:text-[20px] font-bold text-[#0755B5] tracking-tight">
                    {faq.q}
                  </span>
                  <span className="font-mono text-[18px] font-bold text-[#0755B5] shrink-0">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-7 sm:px-7 text-[15px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans pt-1 border-t border-[rgba(7,85,181,0.15)] bg-[rgba(7,85,181,0.02)]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
