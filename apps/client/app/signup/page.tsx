"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Icon } from "@/components/icons";
import { Button, Field, Input } from "@/components/ui";
import { api, clearDemoSession } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("name") ?? "").trim();
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");

    setError("");
    setLoading(true);
    try {
      await api("/auth/register", { method: "POST", body: { name, email, password } });
      clearDemoSession();
      localStorage.removeItem("patra-token");
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="border-l-[3px] border-line-strong pl-4 mb-2">
        <h1 className="display text-[36px] sm:text-[42px] font-bold tracking-tight text-fg">Create your account</h1>
        <p className="mt-1.5 text-[15px] text-muted">Set up your workspace for templates and campaigns.</p>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex items-start gap-2.5 border border-danger bg-danger-soft px-4 py-3 text-[14px] text-danger">
          <Icon.Alert size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5">
        <Field label="Full Name" htmlFor="name">
          <Input id="name" name="name" autoComplete="name" required placeholder="Aarav Sharma" className="focus:bg-white" />
        </Field>
        <Field label="Work Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" className="focus:bg-white" />
        </Field>
        <Field label="Password" htmlFor="password" hint="Use at least 6 characters.">
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required placeholder="••••••••••••" className="focus:bg-white" />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="group relative mt-2 flex h-12 w-full items-center justify-center gap-3 border-2 border-primary bg-primary px-6 font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-on-primary shadow-[4px_4px_0_0_var(--border-strong)] transition-all duration-150 hover:bg-primary-hover hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--border-strong)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Icon.Loader size={16} className="animate-spin text-on-primary" />
              <span>Creating account…</span>
            </>
          ) : (
            <>
              <span>Create account</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1.5" aria-hidden="true">
                →
              </span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-line pt-6 text-center text-[14px]">
        <p className="text-subtle">
          Already have an account?{" "}
          <Link href="/login" className="font-mono font-bold uppercase tracking-wider text-fg underline underline-offset-4 hover:opacity-80">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
