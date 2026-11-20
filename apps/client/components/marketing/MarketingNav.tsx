"use client";

import Link from "next/link";
import { useState } from "react";

export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#designer", label: "Designer" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(7,85,181,0.2)] bg-[#F4F2E8] text-[#0755B5]">
      <div className="mx-auto flex h-[72px] max-w-[1440px] w-full items-center justify-between px-5 sm:px-10">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="font-yellix text-[26px] font-bold tracking-tight text-[#0755B5] select-none hover:opacity-90">
            PATRA
          </Link>
          <span className="hidden sm:inline-block font-pixel text-[11px] uppercase tracking-wider text-[rgba(7,85,181,0.65)] border border-[rgba(7,85,181,0.3)] px-2 py-0.5">
            v0.1 · Self-Hosted
          </span>
        </div>

        {/* Minimalist Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 font-mono text-[13px] tracking-wider uppercase">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[#0755B5] hover:opacity-75 transition-opacity"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action CTAs */}
        <div className="hidden sm:flex items-center gap-5 shrink-0">
          <Link
            href="/dashboard?demo=1"
            className="text-[13px] font-mono uppercase tracking-wider text-[rgba(7,85,181,0.8)] hover:text-[#0755B5] transition-colors"
          >
            Live Demo
          </Link>
          <Link
            href="/login"
            className="text-[13px] font-mono uppercase tracking-wider text-[#0755B5] hover:opacity-75 transition-opacity"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="mkt-btn mkt-btn-primary mkt-btn-sm text-[13px] font-mono tracking-wider"
          >
            Get started →
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#0755B5] cursor-pointer shrink-0"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgba(7,85,181,0.2)] bg-[#F4F2E8] px-5 py-6 space-y-4 animate-fade-up">
          <nav className="flex flex-col space-y-3 font-mono text-[14px] uppercase tracking-wider">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-[#0755B5] hover:opacity-75"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-[rgba(7,85,181,0.2)] flex flex-col gap-3 font-mono text-[13px]">
            <Link
              href="/dashboard?demo=1"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-[rgba(7,85,181,0.8)]"
            >
              Live Demo
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-[#0755B5]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="mkt-btn mkt-btn-primary text-center justify-center h-11"
            >
              Get started →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
