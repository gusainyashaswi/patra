"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api, ApiClientError, inDemoMode } from "@/lib/api";

export default function AuthBoundary({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const demoMode = searchParams.get("demo") === "1" || inDemoMode();

  useEffect(() => {
    if (demoMode) {
      const timer = setTimeout(() => setValidated(true), 0);
      return () => clearTimeout(timer);
    }
    let active = true;
    api("/auth/me")
      .then(() => {
        if (active) {
          setError("");
          setValidated(true);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (!(error instanceof ApiClientError) || error.status !== 401) {
          setError(error instanceof Error ? error.message : "Could not check your session.");
          return;
        }
        const next = `${pathname}${searchParams.size ? `?${searchParams}` : ""}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      });

    return () => {
      active = false;
    };
  }, [attempt, demoMode, pathname, router, searchParams]);

  if (error && !demoMode) {
    return (
      <div className="grid min-h-screen place-content-center gap-4 px-6 text-center">
        <p role="alert" className="text-danger">{error}</p>
        <button type="button" className="font-medium underline" onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Try again</button>
      </div>
    );
  }

  if (!validated) {
    return <div role="status" aria-live="polite" className="grid min-h-screen place-items-center text-muted">Checking your session…</div>;
  }

  return children;
}
