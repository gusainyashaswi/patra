import AppShell from "@/components/AppShell";
import AuthBoundary from "@/components/AuthBoundary";
import { Suspense } from "react";

export default function AppLayout({ children }) {
  return (
    <Suspense fallback={<div role="status" className="grid min-h-screen place-items-center text-muted">Checking your session…</div>}>
      <AuthBoundary><AppShell>{children}</AppShell></AuthBoundary>
    </Suspense>
  );
}
