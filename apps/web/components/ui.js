"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useId, useRef } from "react";
import { Icon } from "./icons";

export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Button ----------
   Mono, uppercase, square — the reference's "GITHUB / NPM PKG" buttons. */

const buttonVariants = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  accent: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border-2 border-line-strong text-fg hover:bg-fg hover:text-bg",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90",
};
const buttonSizes = {
  sm: "h-9 px-3.5 text-[12px] gap-2",
  md: "h-11 px-5 text-[13px] gap-2.5",
  lg: "h-13 px-7 text-[14px] gap-3",
  icon: "h-11 w-11 justify-center",
  "icon-sm": "h-9 w-9 justify-center",
};

export function Button({ variant = "primary", size = "md", href, loading = false, className, children, disabled, ...rest }) {
  const isIcon = size.startsWith("icon");
  const cls = cx(
    "inline-flex items-center justify-center whitespace-nowrap cursor-pointer select-none",
    !isIcon && "font-mono font-bold uppercase tracking-[0.1em]",
    "transition-[background-color,color,border-color,transform] duration-150 active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-40",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Icon.Loader size={15} />}
      {children}
    </button>
  );
}

/* ---------- Surfaces ---------- */

// tone: "plain" (hairline), "ruled" (hard ink border), "ink" (solid black block), "accent" (solid orange)
export function Card({ tone = "plain", className, children, ...rest }) {
  const tones = {
    plain: "border border-line bg-surface",
    ruled: "border-2 border-line-strong bg-surface",
    ink: "bg-[#0e0e0e] text-[#f1eee5] [--fg-muted:#bdb8ac] [--fg-subtle:#8f8a7f] [--border:#2a2926]",
    accent: "bg-accent text-on-accent",
  };
  return (
    <div className={cx(tones[tone], className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cx("flex items-start justify-between gap-6 px-7 pt-7 pb-4", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-[20px] font-bold tracking-[-0.02em]">{title}</h2>
        {description && <p className="mt-1 text-[15px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// Section heading inside a page: big grotesk title + mono kicker, ink rule on the left.
export function SectionTitle({ title, kicker, action, className }) {
  return (
    <div className={cx("mb-6 flex items-end justify-between gap-6", className)}>
      <div className="border-l-[3px] border-line-strong pl-4">
        <h2 className="display text-[28px] sm:text-[32px]">{title}</h2>
        {kicker && <p className="label mt-2 text-subtle">{kicker}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions, back, kicker }) {
  return (
    <div className="mb-12 flex flex-col gap-6 sm:mb-14 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="label mb-5 inline-flex items-center gap-1.5 text-subtle hover:text-fg cursor-pointer transition-colors"
          >
            <Icon.ChevronLeft size={14} /> {back.label}
          </Link>
        )}
        <div className="border-l-[3px] border-line-strong pl-5">
          <h1 className="display text-[36px] text-balance sm:text-[48px]">{title}</h1>
          {kicker && <p className="label mt-3 text-subtle">{kicker}</p>}
        </div>
        {description && <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

/* ---------- Status ---------- */

const tones = {
  neutral: "bg-surface-2 text-muted",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  accent: "bg-accent text-on-accent",
};

export function Badge({ tone = "neutral", dot = false, pulse = false, className, children }) {
  return (
    <span
      className={cx(
        "inline-flex h-7 items-center gap-2 whitespace-nowrap px-2.5 font-mono text-[12px] font-semibold uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cx("h-1.5 w-1.5 bg-current", pulse && "animate-pulse-dot")} aria-hidden="true" />}
      {children}
    </span>
  );
}

export const STATUS = {
  DRAFT: { tone: "neutral", label: "Draft" },
  QUEUED: { tone: "info", label: "Queued" },
  SENDING: { tone: "accent", label: "Sending", pulse: true },
  PAUSED: { tone: "warning", label: "Paused" },
  COMPLETED: { tone: "success", label: "Completed" },
  CANCELLED: { tone: "neutral", label: "Cancelled" },
  PUBLISHED: { tone: "success", label: "Published" },
  PENDING: { tone: "neutral", label: "Pending" },
  SENT: { tone: "info", label: "Sent" },
  DELIVERED: { tone: "success", label: "Delivered" },
  OPENED: { tone: "success", label: "Opened" },
  CLICKED: { tone: "success", label: "Clicked" },
  BOUNCED: { tone: "danger", label: "Bounced" },
  FAILED: { tone: "danger", label: "Failed" },
  COMPLAINED: { tone: "danger", label: "Complained" },
  SKIPPED: { tone: "warning", label: "Skipped" },
  VERIFIED: { tone: "success", label: "Verified" },
  UNVERIFIED: { tone: "warning", label: "Not verified" },
  CONNECTED: { tone: "success", label: "Connected" },
  UNTESTED: { tone: "warning", label: "Needs test" },
  ERROR: { tone: "danger", label: "Failing" },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] ?? { tone: "neutral", label: status };
  return (
    <Badge tone={s.tone} dot pulse={s.pulse}>
      {s.label}
    </Badge>
  );
}

/* ---------- Forms ---------- */

export function Field({ label, hint, error, children, optional, htmlFor }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={htmlFor} className="label flex items-baseline justify-between text-muted">
          {label}
          {optional && <span className="font-sans text-[13px] font-normal normal-case tracking-normal text-subtle">Optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="flex items-center gap-1.5 text-[14px] text-danger">
          <Icon.Alert size={14} /> {error}
        </p>
      ) : (
        hint && <p className="text-[14px] text-subtle">{hint}</p>
      )}
    </div>
  );
}

const inputBase =
  "w-full border-2 border-line bg-surface px-4 text-[16px] text-fg placeholder:text-subtle " +
  "transition-[border-color,background-color] duration-150 hover:border-subtle " +
  "focus:outline-none focus:border-line-strong focus:bg-bg " +
  "aria-[invalid=true]:border-danger disabled:opacity-60";

export function Input({ className, invalid, ...rest }) {
  return <input className={cx(inputBase, "h-12", className)} aria-invalid={invalid || undefined} {...rest} />;
}

export function Textarea({ className, ...rest }) {
  return <textarea className={cx(inputBase, "min-h-28 py-3 leading-relaxed", className)} {...rest} />;
}

export function Select({ className, children, ...rest }) {
  return (
    <div className="relative">
      <select className={cx(inputBase, "h-12 appearance-none pr-10 cursor-pointer", className)} {...rest}>
        {children}
      </select>
      <Icon.ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-subtle" />
    </div>
  );
}

export function SearchInput({ className, label = "Search", ...rest }) {
  return (
    <div className={cx("relative", className)}>
      <Icon.Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
      <input type="search" aria-label={label} className={cx(inputBase, "h-11 pl-11 text-[15px]")} {...rest} />
    </div>
  );
}

/* ---------- Segmented / tabs ----------
   Underline tabs: open, no boxes. */

export function Segmented({ options, value, onChange, label, size = "md" }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap gap-x-6 gap-y-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              "relative inline-flex items-center gap-2 font-mono font-bold uppercase tracking-[0.1em] cursor-pointer transition-colors duration-150",
              "border-b-2 pb-1.5",
              size === "sm" ? "h-9 text-[12px]" : "h-10 text-[13px]",
              active ? "border-accent text-fg" : "border-transparent text-subtle hover:text-fg",
            )}
          >
            {o.icon}
            {o.label}
            {o.count != null && <span className={cx("tabular", active ? "text-accent-ink" : "text-subtle")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Data display ---------- */

// Big numeral + mono caption — the reference's "12MB / BINARY SIZE".
export function Stat({ label, value, sub, tone }) {
  const color = { success: "text-success", danger: "text-danger", warning: "text-warning", accent: "text-accent-ink" }[tone];
  return (
    <div className="flex flex-col gap-2">
      <span className={cx("display tabular text-[40px] sm:text-[48px]", color)}>{value}</span>
      <span className="label text-subtle">{label}</span>
      {sub && <span className="text-[14px] text-subtle">{sub}</span>}
    </div>
  );
}

export function Progress({ value, max = 100, segments, label, height = "h-3" }) {
  if (segments) {
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    return (
      <div className={cx("flex w-full overflow-hidden bg-surface-3", height)} role="img" aria-label={label}>
        {segments.map((s) => (
          <div key={s.key} className="h-full transition-[width] duration-700 ease-out" style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
        ))}
      </div>
    );
  }
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div
      className={cx("w-full overflow-hidden bg-surface-3", height)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-full bg-accent transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-5 grid h-14 w-14 place-items-center border-2 border-line-strong text-fg">{icon}</div>
      <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">{title}</h3>
      {description && <p className="mt-2 max-w-md text-[16px] text-muted text-pretty">{description}</p>}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

export function Table({ children, className }) {
  return (
    <div className={cx("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left text-[15px]">{children}</table>
    </div>
  );
}
export function Th({ children, className, align }) {
  return (
    <th scope="col" className={cx("label h-12 border-b-2 border-line-strong px-6 text-subtle", align === "right" && "text-right", className)}>
      {children}
    </th>
  );
}
export function Td({ children, className, align }) {
  return (
    <td className={cx("h-[72px] border-b border-line px-6 align-middle", align === "right" && "text-right tabular", className)}>
      {children}
    </td>
  );
}

export function Kbd({ children }) {
  return (
    <kbd className="inline-grid h-6 min-w-6 place-items-center border border-line-strong px-1.5 font-mono text-[12px] text-muted">
      {children}
    </kbd>
  );
}

/* ---------- Dialog ---------- */

export function Dialog({ open, onClose, title, description, children, footer, size = "md" }) {
  const ref = useRef(null);
  const titleId = useId();
  const onCloseLatest = useEffectEvent(() => onClose());

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const el = ref.current;
    const focusables = () =>
      el?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [];
    focusables()[0]?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onCloseLatest();
      if (e.key === "Tab") {
        const f = [...focusables()];
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-[#0e0e0e]/55 animate-fade-up" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          "relative w-full border-2 border-line-strong bg-bg shadow-pop animate-pop-in",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        <div className="flex items-start justify-between gap-4 px-8 pt-8">
          <div>
            <h2 id={titleId} className="display text-[28px]">
              {title}
            </h2>
            {description && <p className="mt-3 text-[16px] leading-relaxed text-muted">{description}</p>}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <Icon.X size={18} />
          </Button>
        </div>
        {children ? <div className="px-8 py-7">{children}</div> : <div className="h-7" />}
        {footer && <div className="flex justify-end gap-3 border-t-2 border-line-strong px-8 py-5">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Toast ---------- */

export function Toast({ message, tone = "success", onDone }) {
  const finish = useEffectEvent(() => onDone());
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(finish, 3200);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-8 left-1/2 z-[60] -translate-x-1/2">
      {message && (
        <div className="pointer-events-auto flex items-center gap-3 bg-[#0e0e0e] px-5 py-4 text-[15px] text-[#f1eee5] shadow-[6px_6px_0_0_var(--accent)] animate-pop-in">
          {tone === "success" ? <Icon.CheckCircle size={18} className="text-[#f05a35]" /> : <Icon.Info size={18} className="text-[#f05a35]" />}
          {message}
        </div>
      )}
    </div>
  );
}

export const fmt = {
  n: (v) => new Intl.NumberFormat("en-US").format(v),
  pct: (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : "—"),
  date: (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
};
