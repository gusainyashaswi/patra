"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, Logo } from "@/components/icons";
import { Button, Field, Input } from "@/components/ui";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!email.includes("@")) next.email = "Enter the email you signed up with";
    if (!password) next.password = "Enter your password";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const { token } = await api("/auth/login", { method: "POST", body: { email, password } });
      localStorage.setItem("patra-token", token);
      router.push("/dashboard");
    } catch (err) {
      setFormError(err.status === 401 ? "That email and password don't match." : err.message);
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="text-[17px] font-semibold tracking-tight">Patra</span>
        </div>

        <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center py-12 animate-fade-up">
          <h1 className="text-[32px] font-semibold tracking-[-0.025em]">Welcome back</h1>
          <p className="mt-1.5 text-[16px] text-muted">Log in to manage your transports, templates and campaigns.</p>

          {formError && (
            <div role="alert" className="mt-6 flex items-start gap-2 rounded-lg bg-danger-soft px-3.5 py-3 text-[14px] text-danger">
              <Icon.Alert size={15} className="mt-0.5 shrink-0" />
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-6">
            <Field label="Email" htmlFor="email" error={errors.email}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                invalid={!!errors.email}
                placeholder="you@company.com"
              />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password}>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  invalid={!!errors.password}
                  className="pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[14px] font-medium text-muted hover:text-fg cursor-pointer"
                  aria-pressed={show}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </Field>
            <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
              {loading ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[14px] text-subtle">
            Just exploring?{" "}
            <a href="/dashboard" className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
              Open the demo workspace
            </a>
          </p>
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
