"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Segmented, StatusBadge, cx, fmt } from "@/components/ui";
import { byId, campaigns, domains, lists, me, senders, setupSteps, templates, transports } from "@/lib/mock";

/*
  Single-screen overview. On desktop it is locked to the viewport (see AppShell `fit`):
  only what you need at a glance lives here; detail lives on Campaigns and Settings.
*/

const periods = {
  "24h": {
    label: "Last 24 hours",
    days: ["00", "04", "08", "12", "16", "20", "Now"],
    delivered: [12, 4, 30, 88, 140, 210, 230],
    bounced: [0, 0, 1, 1, 3, 4, 3],
    failed: [0, 0, 0, 1, 1, 2, 1],
    prev: { sent: 610, delivered: 590, bounced: 9, opened: 270 },
    opened: 318,
  },
  "7d": {
    label: "Last 7 days",
    days: ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"],
    delivered: [112, 322, 198, 84, 604, 170, 380],
    bounced: [3, 6, 4, 2, 9, 3, 7],
    failed: [1, 2, 1, 0, 3, 1, 1],
    prev: { sent: 1420, delivered: 1366, bounced: 21, opened: 702 },
    opened: 976,
  },
  "30d": {
    label: "Last 30 days",
    days: ["W1", "W2", "W3", "W4", "W5", "W6", "Now"],
    delivered: [420, 610, 380, 900, 1100, 760, 1870],
    bounced: [8, 9, 6, 15, 19, 12, 34],
    failed: [2, 3, 2, 4, 6, 4, 7],
    prev: { sent: 4100, delivered: 3980, bounced: 70, opened: 1900 },
    opened: 2900,
  },
};
const BOUNCE_LIMIT = 2;
const sum = (a) => a.reduce((x, y) => x + y, 0);

/* ---------- Pieces ---------- */

function Panel({ title, action, children, className }) {
  return (
    <section className={cx("flex min-h-0 flex-col border border-line bg-panel", className)}>
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-3.5">
        <h2 className="font-display text-[18px] font-bold tracking-[-0.02em]">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function PanelLink({ href, children }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-muted hover:text-accent-ink cursor-pointer transition-colors"
    >
      {children} <Icon.ArrowRight size={13} />
    </Link>
  );
}

function Delta({ now, prev, inverse = false }) {
  const d = ((now - prev) / prev) * 100;
  const good = inverse ? d <= 0 : d >= 0;
  return (
    <span className={cx("inline-flex items-center gap-0.5 font-mono text-[12px] font-semibold", good ? "text-success" : "text-danger")}>
      {d >= 0 ? <Icon.ArrowUp size={12} /> : <Icon.ArrowDown size={12} />}
      {Math.abs(d).toFixed(1)}%
    </span>
  );
}

function Kpi({ label, value, sub, delta, highlight, href }) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="label text-subtle">{label}</span>
        {delta}
      </div>
      <div className={cx("display tabular mt-2.5 text-[28px] xl:text-[36px]", highlight && "text-accent-ink")}>{value}</div>
      <div className="mt-1 truncate text-[14px] text-subtle">{sub}</div>
    </>
  );
  const cls = cx(
    "block min-w-0 border bg-panel px-5 py-4 transition-colors",
    highlight ? "border-accent" : "border-line",
    href && "hover:border-line-strong cursor-pointer",
  );
  return href ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

// Stacked bars that stretch to the available height (no fixed px heights).
function SendsChart({ p }) {
  const series = [
    { key: "delivered", label: "Delivered", color: "var(--tint-1)" },
    { key: "bounced", label: "Bounced", color: "var(--danger)" },
    { key: "failed", label: "Failed", color: "var(--tint-3)" },
  ];
  const totals = p.days.map((_, i) => p.delivered[i] + p.bounced[i] + p.failed[i]);
  const raw = Math.max(...totals, 1);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const max = [1, 2, 4, 5, 10].map((m) => m * mag).find((v) => v >= raw);
  const ticks = [max, max / 2, 0];

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-3">
      <ul className="flex shrink-0 flex-wrap gap-x-5 gap-y-1">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[14px] text-muted">
            <span className="h-2.5 w-2.5" style={{ background: s.color }} aria-hidden="true" />
            {s.label} <span className="tabular font-mono font-semibold text-fg">{fmt.n(sum(p[s.key]))}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex min-h-[88px] flex-1 gap-3">
        <div className="flex flex-col justify-between pb-6 text-right" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="tabular font-mono text-[12px] leading-none text-subtle">{fmt.n(t)}</span>
          ))}
        </div>
        <div className="flex flex-1 flex-col">
          <div className="relative flex flex-1 items-end gap-3 border-b border-line-strong" role="img" aria-label={`Emails sent: ${p.days.map((d, i) => `${d} ${totals[i]}`).join(", ")}`}>
            <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line" aria-hidden="true" />
            {p.days.map((d, i) => (
              <div key={d} className="group relative mx-auto flex h-full w-full max-w-[56px] flex-1 flex-col justify-end">
                <span className="tabular pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap border border-line bg-bg px-2 py-1 font-mono text-[12px] opacity-0 transition-opacity group-hover:opacity-100" style={{ bottom: `calc(${(totals[i] / max) * 100}% + 6px)` }}>
                  {fmt.n(totals[i])} · {p.bounced[i]} bounced
                </span>
                {[...series].reverse().map((s) => (
                  <span key={s.key} className="w-full" style={{ height: `${(p[s.key][i] / max) * 100}%`, background: s.color }} />
                ))}
              </div>
            ))}
          </div>
          <div className="flex h-6 items-end gap-3">
            {p.days.map((d, i) => (
              <span key={d} className={cx("label flex-1 text-center", i === p.days.length - 1 ? "text-fg" : "text-subtle")}>{d}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function Dashboard() {
  const [period, setPeriod] = useState("7d");
  const p = periods[period];
  const delivered = sum(p.delivered);
  const bounced = sum(p.bounced);
  const sent = delivered + bounced + sum(p.failed);
  const bounceRate = (bounced / sent) * 100;

  const live = campaigns.find((c) => c.status === "SENDING");
  const lc = live?.counters;
  const transport = transports.find((t) => t.isDefault);
  const etaMin = lc ? Math.ceil(lc.pending / (transport.ratePerSecond * 60)) : 0;
  const nextStep = setupSteps.find((s) => !s.done);
  const done = setupSteps.filter((s) => s.done).length;

  const alerts = [
    ...(live
      ? [{ tone: "danger", title: `Bounce rate ${fmt.pct(lc.bounced, lc.total - lc.pending)} on ${live.name}`, href: `/campaigns/${live.id}` }]
      : []),
    ...domains.filter((d) => !d.verified).map((d) => ({ tone: "warning", title: `${d.name} isn't verified`, href: "/settings?tab=domains" })),
    ...transports.filter((t) => t.status !== "CONNECTED").map((t) => ({ tone: "warning", title: `${t.name} needs a connection test`, href: "/settings?tab=transports" })),
  ];

  return (
    <div className="flex flex-col gap-5 lg:min-h-0 lg:flex-1 lg:gap-4 xl:gap-5">
      {/* Header */}
      <header className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="border-l-[3px] border-accent pl-4">
          <p className="label text-subtle">Thursday · 6 November · {me.name.split(" ")[0]}</p>
          <h1 className="display mt-1.5 text-[36px]">Overview</h1>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {nextStep && (
            <Link
              href={nextStep.href}
              className="group inline-flex items-center gap-3 border border-line bg-panel px-4 py-2 text-[14px] hover:border-accent cursor-pointer transition-colors"
            >
              <span className="label text-subtle">Setup {done}/{setupSteps.length}</span>
              <span className="font-semibold">{nextStep.label}</span>
              <Icon.ArrowRight size={14} className="text-accent-ink transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          <Segmented
            label="Period"
            size="sm"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "24h", label: "24h" },
              { value: "7d", label: "7 days" },
              { value: "30d", label: "30 days" },
            ]}
          />
        </div>
      </header>

      {/* KPIs */}
      <section aria-label={`Key numbers, ${p.label}`} className="grid shrink-0 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Sent" value={fmt.n(sent)} sub={p.label} delta={<Delta now={sent} prev={p.prev.sent} />} />
        <Kpi label="Delivered" value={fmt.pct(delivered, sent)} sub={`${fmt.n(delivered)} emails`} delta={<Delta now={delivered / sent} prev={p.prev.delivered / p.prev.sent} />} />
        <Kpi label="Opened" value={fmt.pct(p.opened, delivered)} sub={`${fmt.n(p.opened)} unique opens`} delta={<Delta now={p.opened / delivered} prev={p.prev.opened / p.prev.delivered} />} />
        <Kpi
          label="Bounce rate"
          value={`${bounceRate.toFixed(1)}%`}
          sub={`${fmt.n(bounced)} bounced · limit ${BOUNCE_LIMIT}%`}
          delta={<Delta now={bounced / sent} prev={p.prev.bounced / p.prev.sent} inverse />}
          href="/contacts"
        />
        <Kpi label="In queue" value={fmt.n(lc?.pending ?? 0)} sub={lc ? `≈ ${etaMin} min left at ${transport.ratePerSecond}/s` : "Nothing queued"} highlight={!!lc} href={live ? `/campaigns/${live.id}` : undefined} />
      </section>

      {/* Main area fills the remaining height */}
      <div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.7fr_1fr] lg:gap-4 xl:gap-5">
        <div className="flex min-w-0 flex-col gap-5 lg:min-h-0">
          {live && (
            <Link
              href={`/campaigns/${live.id}`}
              className="group block shrink-0 border border-line border-l-4 border-l-accent bg-panel px-5 py-4 transition-colors hover:border-line-strong hover:border-l-accent cursor-pointer"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={live.status} />
                    <span className="truncate font-display text-[20px] font-bold tracking-[-0.02em]">{live.name}</span>
                  </div>
                  <p className="mt-1 truncate text-[14px] text-subtle">
                    {byId(templates, live.templateId).name} v{live.templateVersion} · {byId(senders, live.senderId).fromEmail} · {byId(lists, live.listId).name}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-accent-ink">
                  Watch live <Icon.ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
              <div className="mt-4 flex h-2.5 overflow-hidden bg-tint-4" role="img" aria-label="Live campaign breakdown">
                {[
                  [lc.delivered, "var(--tint-1)"],
                  [lc.sent, "var(--tint-2)"],
                  [lc.bounced + lc.failed, "var(--danger)"],
                  [lc.skipped, "var(--tint-3)"],
                ].map(([v, c], i) => (
                  <span key={i} className="h-full transition-[width] duration-700" style={{ width: `${(v / lc.total) * 100}%`, background: c }} />
                ))}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
                {[
                  ["Processed", fmt.pct(lc.total - lc.pending, lc.total), null],
                  ["Delivered", fmt.n(lc.delivered), "var(--tint-1)"],
                  ["In flight", fmt.n(lc.sent), "var(--tint-2)"],
                  ["Bounced", fmt.n(lc.bounced + lc.failed), "var(--danger)"],
                  ["Queued", fmt.n(lc.pending), "var(--tint-4)"],
                ].map(([k, v, c]) => (
                  <div key={k} className="min-w-0">
                    <dt className="flex items-center gap-1.5 truncate text-[13px] text-subtle">
                      {c && <span className="h-2 w-2 shrink-0 border border-line" style={{ background: c }} aria-hidden="true" />}
                      {k}
                    </dt>
                    <dd className="tabular font-mono text-[16px] font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </Link>
          )}

          <Panel title="Emails sent" action={<span className="label text-subtle">{p.label}</span>} className="lg:flex-1">
            <SendsChart p={p} />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:min-h-0">
          <Panel title="Needs attention" action={<span className="label text-subtle">{alerts.length}</span>} className="shrink-0">
            <ul className="divide-y divide-line">
              {alerts.map((a) => (
                <li key={a.title}>
                  <Link href={a.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-tint-4/60 cursor-pointer">
                    <span className={cx("h-2 w-2 shrink-0", a.tone === "danger" ? "bg-danger" : "bg-warning")} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{a.title}</span>
                    <Icon.ChevronRight size={16} className="shrink-0 text-subtle group-hover:text-fg" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recent campaigns" action={<PanelLink href="/campaigns">All</PanelLink>} className="lg:flex-1">
            <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
              {campaigns.map((c) => {
                const k = c.counters;
                return (
                  <li key={c.id}>
                    <Link
                      href={c.status === "DRAFT" ? "/campaigns/new" : `/campaigns/${c.id}`}
                      className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-tint-4/60 cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold">{c.name}</div>
                        <div className="truncate text-[13px] text-subtle">
                          {k.total ? `${fmt.n(k.total)} recipients · ${fmt.pct(k.delivered, k.total)} delivered` : "Not sent yet"}
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
