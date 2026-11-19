"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { Icon } from "@/components/icons";
import { Button, Field, Input } from "@/components/ui";
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
      await api("/auth/login", { method: "POST", body: { email, password } });
      clearDemoSession();
      localStorage.removeItem("patra-token");
      const nextPath = searchParams.get("next");
      router.replace(nextPath?.startsWith("/") ? nextPath : "/dashboard");
    } catch (err) {
      setFormError(err.status === 401 ? "That email and password don't match." : err.message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
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
        New to Patra?{" "}
        <Link href="/signup" className="font-medium text-fg underline underline-offset-4">Create an account</Link>
      </p>
      <p className="mt-3 text-center text-[14px] text-subtle">
        Just exploring?{" "}
        <a href="/dashboard?demo=1" className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
          Open the demo workspace
        </a>
      </p>
    </AuthLayout>
  );
}
