import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/icons";
import { MailTransmissionSystem } from "@/components/auth/MailTransmissionSystem";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.15fr]">
      {/* Left panel: Swiss editorial authentication column */}
      <div className="flex flex-col justify-between bg-bg text-fg px-6 py-8 sm:px-12 sm:py-10">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Patra home" className="flex items-center gap-2.5 cursor-pointer select-none">
            <Logo size={32} />
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-widest px-2.5 py-1 border border-line text-subtle bg-surface">
            v0.1
          </span>
        </div>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10 animate-fade-up">
          {children}
        </div>

        <div className="border-t border-line pt-4 flex items-center justify-between text-[12px] font-mono text-subtle uppercase tracking-wider">
          <span>Self-hosted mail platform</span>
          <Link href="/" className="hover:text-fg underline underline-offset-4">← Back to home</Link>
        </div>
      </div>

      {/* Right panel: The Mail Transmission System (Live Interactive Experience) */}
      <div className="relative hidden overflow-hidden border-l-2 border-line-strong bg-[#0755B5] lg:block">
        <MailTransmissionSystem />
      </div>
    </div>
  );
}
