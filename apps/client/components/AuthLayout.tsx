import type { ReactNode } from "react";
import { Logo } from "@/components/icons";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="text-[17px] font-semibold tracking-tight">Patra</span>
        </div>

        <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center py-12 animate-fade-up">
          {children}
        </div>
        <p className="text-[13px] text-subtle">Self-hosted mail platform · v0.1</p>
      </div>

      {/* Brand panel: a calm, product-true illustration instead of stock art */}
      <div className="relative hidden overflow-hidden border-l border-line bg-surface-2 lg:block">
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: "radial-gradient(var(--border-strong) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse at 60% 40%, black 30%, transparent 75%)",
          }}
          aria-hidden="true"
        />
        <div className="relative flex h-full flex-col justify-center px-14">
          <div className="max-w-[440px]">
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-pop">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-semibold">Pass confirmations — wave 2</div>
                  <div className="text-[13px] text-subtle">1,248 recipients · Resend</div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[13px] font-medium text-accent-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" /> Sending
                </span>
              </div>
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-surface-3">
                <div className="bg-success" style={{ width: "46%" }} />
                <div className="bg-info" style={{ width: "19%" }} />
                <div className="bg-danger" style={{ width: "2%" }} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-[13px]">
                {[
                  ["Delivered", "571", "text-success"],
                  ["In flight", "236", "text-info"],
                  ["Bounced", "14", "text-danger"],
                ].map(([l, v, c]) => (
                  <div key={l}>
                    <div className="text-subtle">{l}</div>
                    <div className={`tabular text-[20px] font-semibold ${c}`}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <h2 className="mt-10 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-balance">
              The layer above your mail provider.
            </h2>
            <p className="mt-2 text-[16px] text-muted text-pretty">
              Bring Resend, SES or SMTP. Patra handles templates, audiences, queued delivery and per-recipient tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
