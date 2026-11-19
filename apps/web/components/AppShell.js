"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Icon, Logo } from "./icons";
import { cx } from "./ui";
import { me } from "@/lib/mock";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/templates", label: "Templates" },
  { href: "/contacts", label: "Contacts" },
  { href: "/settings", label: "Settings" },
];

// The theme lives on <html data-theme>, set before paint by the root layout script.
const themeListeners = new Set();
const themeStore = {
  subscribe: (fn) => (themeListeners.add(fn), () => themeListeners.delete(fn)),
  get: () => document.documentElement.dataset.theme || "light",
  set: (t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem("patra-theme", t);
    themeListeners.forEach((fn) => fn());
  },
};

function ThemeToggle() {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get, () => null);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      onClick={() => themeStore.set(next)}
      aria-label={`Switch to ${next} theme`}
      className="grid h-10 w-10 place-items-center text-on-nav/70 hover:bg-white/10 hover:text-on-nav cursor-pointer transition-colors"
    >
      {theme === "dark" ? <Icon.Sun size={18} /> : <Icon.Moon size={18} />}
    </button>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");
  // The designer needs the full viewport; it renders its own chrome.
  const bare = /^\/templates\/[^/]+$/.test(pathname);
  // The overview is a single-screen dashboard on desktop: lock it to the viewport.
  const fit = pathname === "/dashboard";
  if (bare) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 bg-nav text-on-nav">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-6 px-5 sm:px-10 xl:gap-10">
          <Link href="/dashboard" aria-label="Patra home" className="shrink-0 cursor-pointer">
            <Logo size={28} />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-6 lg:flex xl:gap-8">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={cx(
                  "relative py-2 font-mono text-[13px] font-bold uppercase tracking-[0.14em] cursor-pointer transition-colors",
                  isActive(n.href) ? "text-on-nav" : "text-on-nav/55 hover:text-on-nav",
                )}
              >
                {n.label}
                {isActive(n.href) && <span className="absolute inset-x-0 -bottom-[18px] h-[3px] bg-accent" aria-hidden="true" />}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              aria-label={`Log out ${me.name}`}
              title="Log out"
              className="hidden h-10 items-center gap-2.5 whitespace-nowrap px-3 font-mono xl:inline-flex text-[12px] font-bold uppercase tracking-[0.12em] text-on-nav/70 hover:bg-white/10 hover:text-on-nav cursor-pointer transition-colors"
            >
              {me.name.split(" ")[0]} <Icon.LogOut size={15} />
            </Link>
            <Link
              href="/campaigns/new"
              className="hidden h-11 items-center gap-2 whitespace-nowrap bg-accent px-5 font-mono text-[13px] font-bold uppercase tracking-[0.1em] text-on-accent hover:bg-accent-hover sm:inline-flex cursor-pointer transition-colors"
            >
              <Icon.Plus size={15} /> New campaign
            </Link>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="grid h-11 w-11 place-items-center hover:bg-white/10 lg:hidden cursor-pointer"
            >
              {open ? <Icon.X size={20} /> : <Icon.Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <nav aria-label="Mobile" className="border-t border-white/10 px-5 pb-6 pt-2 lg:hidden animate-fade-up">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={cx(
                  "flex h-14 items-center justify-between border-b border-white/10 font-mono text-[15px] font-bold uppercase tracking-[0.12em] cursor-pointer",
                  isActive(n.href) ? "text-accent" : "text-on-nav/80",
                )}
              >
                {n.label} <Icon.ArrowRight size={16} />
              </Link>
            ))}
            <Link
              href="/campaigns/new"
              onClick={() => setOpen(false)}
              className="mt-5 flex h-13 items-center justify-center gap-2 bg-accent font-mono text-[14px] font-bold uppercase tracking-[0.1em] text-on-accent cursor-pointer"
            >
              <Icon.Plus size={16} /> New campaign
            </Link>
          </nav>
        )}
      </header>

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
