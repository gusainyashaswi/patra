"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, Logo } from "./icons";
import { cx } from "./ui";
import { api, inDemoMode } from "@/lib/api";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/contacts", label: "Contacts" },
  { href: "/templates", label: "Templates" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/settings", label: "Settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  // The designer needs the full viewport; it renders its own chrome.
  const bare = /^\/templates\/[^/]+$/.test(pathname);
  // The overview is a single-screen dashboard on desktop: lock it to the viewport.
  const fit = pathname === "/dashboard";
  useEffect(() => {
    let active = true;
    api("/auth/me").then(({ data }) => {
      if (active) {
        setUser(data);
        setDemoMode(inDemoMode());
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Account";
  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // The local session should still end if the API is unreachable or already expired.
    } finally {
      localStorage.removeItem("patra-token");
      router.replace("/login");
      router.refresh();
    }
  }

  if (bare) return <>{children}</>;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-nav text-on-nav">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-6 px-5 sm:px-10 xl:gap-10">
          <Link href="/dashboard" aria-label="Patra home" className="flex items-center gap-3 shrink-0 cursor-pointer">
            <Logo size={28} />
            <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border border-line text-on-nav/70 hidden sm:inline-block">v0.1</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-6 lg:flex xl:gap-8">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={cx(
                  "relative py-2 font-mono text-[13px] font-bold uppercase tracking-[0.14em] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
                  isActive(n.href) ? "text-on-nav" : "text-on-nav/60 hover:text-on-nav",
                )}
              >
                {n.label}
                {isActive(n.href) && <span className="absolute inset-x-0 -bottom-[18px] h-[3px] bg-accent" aria-hidden="true" />}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              aria-label={`Log out ${user?.name || "account"}`}
              title="Log out"
              className="hidden h-10 items-center gap-2.5 whitespace-nowrap px-3 font-mono xl:inline-flex text-[12px] font-bold uppercase tracking-[0.12em] text-on-nav/75 hover:bg-fg/10 hover:text-on-nav cursor-pointer transition-colors"
            >
              {loggingOut ? "Logging out…" : firstName} <Icon.LogOut size={15} />
            </button>
            <Link
              href="/campaigns/new"
              className="hidden h-11 items-center gap-2 whitespace-nowrap bg-accent px-5 font-mono text-[13px] font-bold uppercase tracking-[0.1em] text-on-accent hover:bg-accent-hover sm:inline-flex cursor-pointer transition-colors border border-accent"
            >
              <Icon.Plus size={15} /> New campaign
            </Link>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="grid h-11 w-11 place-items-center hover:bg-fg/10 lg:hidden cursor-pointer text-on-nav"
            >
              {open ? <Icon.X size={20} /> : <Icon.Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <nav aria-label="Mobile" className="border-t border-line bg-nav px-5 pb-6 pt-2 lg:hidden animate-fade-up">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={cx(
                  "flex h-14 items-center justify-between border-b border-line font-mono text-[15px] font-bold uppercase tracking-[0.12em] cursor-pointer",
                  isActive(n.href) ? "text-accent" : "text-on-nav/75",
                )}
              >
                {n.label} <Icon.ArrowRight size={16} />
              </Link>
            ))}
            <Link
              href="/campaigns/new"
              onClick={() => setOpen(false)}
              className="mt-5 flex h-13 items-center justify-center gap-2 bg-accent font-mono text-[14px] font-bold uppercase tracking-[0.1em] text-on-accent cursor-pointer border border-accent"
            >
              <Icon.Plus size={16} /> New campaign
            </Link>
          </nav>
        )}
      </header>

      {demoMode && (
        <div role="status" className="border-b border-warning/30 bg-warning/10 px-5 py-2 text-center text-[13px] text-warning sm:px-10">
          <span className="font-semibold">Demo mode:</span> Dashboard, campaign, and template sample data is illustrative and does not represent live delivery activity.
        </div>
      )}

      <main id="main" className="min-w-0">
        <div
          key={pathname}
          className={cx(
            "mx-auto w-full px-5 sm:px-10 animate-fade-in",
            fit ? "max-w-[1440px] py-8 lg:flex lg:h-[calc(100dvh-72px)] lg:flex-col lg:py-5 xl:py-6" : "max-w-[1280px] py-12 sm:py-16",
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
