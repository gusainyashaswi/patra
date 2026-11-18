"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function AuthBoundary({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [validated, setValidated] = useState(false);

  useEffect(() => {
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
  }, [pathname, router, searchParams]);

  if (!validated) {
    return <div role="status" aria-live="polite" className="grid min-h-screen place-items-center text-muted">Checking your session…</div>;
  }

  return children;
}
