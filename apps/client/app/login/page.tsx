"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { Icon } from "@/components/icons";
import { Field, Input } from "@/components/ui";
import { api, clearDemoSession } from "@/lib/api";

export default function LoginPage() {
  return (
    <Suspense fallback={<div role="status" className="grid min-h-screen place-items-center text-muted">Loading sign in…</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!email.includes("@")) next.email = "Enter the email you signed up with";
    if (!password) next.password = "Enter your password";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await api("/auth/login", { method: "POST", body: { email, password } });
      clearDemoSession();
      localStorage.removeItem("patra-token");
      const nextPath = searchParams.get("next");
      router.replace(nextPath?.startsWith("/") ? nextPath : "/dashboard");
    } catch (err: unknown) {
      const status = typeof err === "object" && err !== null && "status" in err ? (err as { status: number }).status : undefined;
      const message = err instanceof Error ? err.message : "Authentication failed.";
      setFormError(status === 401 ? "That email and password do not match." : message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="border-l-[3px] border-line-strong pl-4 mb-2">
        <h1 className="display text-[36px] sm:text-[42px] font-bold tracking-tight text-fg">Welcome back</h1>
        <p className="mt-1.5 text-[15px] text-muted">Log in to orchestrate your mail infrastructure.</p>
      </div>

      {formError && (
        <div role="alert" className="mt-5 flex items-start gap-2.5 border border-danger bg-danger-soft px-4 py-3 text-[14px] text-danger">
          <Icon.Alert size={16} className="mt-0.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-5">
        <Field label="Work Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            invalid={!!errors.email}
            placeholder="you@company.com"
            className="focus:bg-white"
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              invalid={!!errors.password}
              placeholder="••••••••••••"
              className="pr-20 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 border border-line bg-surface-2 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-muted hover:text-fg hover:border-line-strong cursor-pointer transition-colors"
              aria-pressed={show}
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        {/* Special tactile high-precision login button */}
        <button
          type="submit"
          disabled={loading}
          className="group relative mt-2 flex h-12 w-full items-center justify-center gap-3 border-2 border-primary bg-primary px-6 font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-on-primary shadow-[4px_4px_0_0_var(--border-strong)] transition-all duration-150 hover:bg-primary-hover hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--border-strong)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Icon.Loader size={16} className="animate-spin text-on-primary" />
              <span>Authenticating…</span>
            </>
          ) : (
            <>
              <span>Log in to console</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1.5" aria-hidden="true">
                →
              </span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-line pt-6 text-center text-[14px]">
        <p className="text-subtle">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-mono font-bold uppercase tracking-wider text-fg underline underline-offset-4 hover:opacity-80">
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
