"use client";

import { useState } from "react";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Does Patra replace email delivery providers like Resend or AWS SES?",
      a: "No, Patra sits directly above them. We provide the operational layer: mail transport configuration, visual block templates, spreadsheet audience validation, rate-limited queued dispatching, and per-recipient delivery tracking. You bring your own provider credentials.",
    },
    {
      q: "What happens if the background worker process crashes mid-send?",
      a: "Patra is built for worker crash resilience. Every recipient in a campaign is assigned a unique BullMQ job ID equal to its recipient record ID. If a worker process is abruptly killed (SIGKILL), a background reconciliation cron runs every 5 minutes to detect queued recipients missing active jobs and re-enqueues them safely with zero duplicates.",
    },
    {
      q: "Which email providers are supported right now?",
      a: "Resend is the production-verified provider adapter in this release, complete with verified sending domain synchronization and Svix cryptographic webhook signature verification. The underlying architecture uses a pluggable ITransport interface, allowing SMTP and AWS SES adapters to plug into the same core.",
    },
    {
      q: "Can I import Excel spreadsheets directly without converting to CSV?",
      a: "Yes. Patra's ingestion pipeline natively parses both .csv and Excel (.xlsx) files up to 50,000 rows and 5 MB. A non-committing preview displays valid syntax, detected duplicates, and suppressed addresses before committing any data to your database.",
    },
    {
      q: "How does Patra handle unsubscribe requests and deliverability compliance?",
      a: "Every email compiled by Patra automatically includes an HMAC-signed unsubscribe token. Clicking the link instantly adds the recipient address to your organization's suppression collection, which is filtered at query time on every subsequent campaign.",
    },
    {
      q: "Does Patra support multi-user teams today?",
      a: "The data models (Roles, Permissions, Memberships) and authorization middleware (requirePermission) are fully implemented in the database and server. However, the initial MVP web interface is scoped to the organization owner. Team invitation and member role management UI is planned for a future release.",
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="w-full border-b border-[rgba(7,85,181,0.25)] bg-[#F4F2E8] text-[#0755B5] py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="max-w-3xl space-y-4">
          <div className="font-pixel text-[12px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
            [12] TECHNICAL FAQS
          </div>
          <h2 className="display-section text-[#0755B5]">
            Frequently asked questions.
          </h2>
          <p className="text-[17px] sm:text-[18px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans">
            Transparent answers about Patra’s architecture, guarantees, and deployment.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-14 max-w-4xl border-2 border-[#0755B5] bg-[#ffffff] divide-y divide-[#0755B5]">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="transition-colors">
                <button
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-6 sm:p-7 flex items-start justify-between gap-6 cursor-pointer select-none hover:bg-[rgba(7,85,181,0.02)]"
                  aria-expanded={isOpen}
                >
                  <span className="font-yellix text-[19px] sm:text-[22px] font-bold text-[#0755B5] tracking-tight">
                    {faq.q}
                  </span>
                  <span className="font-mono text-[18px] font-bold text-[#0755B5] shrink-0 mt-1">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-7 sm:px-7 text-[15px] sm:text-[16px] leading-relaxed text-[rgba(7,85,181,0.85)] font-sans pt-1 border-t border-[rgba(7,85,181,0.15)] bg-[rgba(7,85,181,0.01)]">
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
