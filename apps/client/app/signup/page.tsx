"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
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
      <h1 className="text-[32px] font-semibold tracking-[-0.025em]">Create your account</h1>
      <p className="mt-1.5 text-[16px] text-muted">Set up your workspace for templates and campaigns.</p>

      {error && (
        <div role="alert" className="mt-6 rounded-lg bg-danger-soft px-3.5 py-3 text-[14px] text-danger">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-6">
        <Field label="Name" htmlFor="name">
          <Input id="name" name="name" autoComplete="name" required />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password" hint="Use at least 6 characters.">
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required />
        </Field>
        <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[14px] text-subtle">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-fg underline underline-offset-4">Log in</Link>
      </p>
    </AuthLayout>
  );
}
