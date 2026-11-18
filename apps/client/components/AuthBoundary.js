"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function AuthBoundary({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [validated, setValidated] = useState(false);
  const demoMode = searchParams.get("demo") === "1" || (typeof document !== "undefined" && document.cookie.includes("patra-demo=1"));

  useEffect(() => {
    if (demoMode) {
      const timer = setTimeout(() => setValidated(true), 0);
      return () => clearTimeout(timer);
    }
    let active = true;
    api("/auth/me")
      .then(() => {
        if (active) setValidated(true);
      })
      .catch(() => {
        if (!active) return;
        const next = `${pathname}${searchParams.size ? `?${searchParams}` : ""}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      });

    return () => {
      active = false;
    };
  }, [demoMode, pathname, router, searchParams]);

  if (!validated) {
    return <div role="status" aria-live="polite" className="grid min-h-screen place-items-center text-muted">Checking your session…</div>;
  }

  return children;
}
