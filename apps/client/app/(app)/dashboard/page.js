"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Segmented, StatusBadge, cx, fmt } from "@/components/ui";
import { useWorkspace, workspaceRequest } from "@/lib/workspace-api";

/*
  Single-screen overview. On desktop it is locked to the viewport (see AppShell `fit`):
  only what you need at a glance lives here; detail lives on Campaigns and Settings.
*/

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
  const { workspace, error } = useWorkspace();
  if (error) return <p role="alert">{error.message}</p>;
  if (workspace === undefined) return <p role="status">Loading workspace…</p>;
  if (!workspace) return <Link href="/login">Sign in to view your overview</Link>;
  return <Overview workspace={workspace} />;
}

function Overview({ workspace }) {
  const [period, setPeriod] = useState("30d");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let timer;
    async function load() {
      try {
        const next = await workspaceRequest(workspace, `/overview?period=${period}`);
        if (active) { setResult(next); setError(""); }
      } catch (error) { if (active) setError(error.message); }
      finally { if (active) timer = setTimeout(load, 15000); }
    }
    load();
    return () => { active = false; clearTimeout(timer); };
  }, [workspace, period]);
  const data = result?.period === period ? result : null;
  const nextStep = data?.setup.find(step => !step.done);
  return (
    <div className="flex flex-col gap-5 lg:min-h-0 lg:flex-1 lg:gap-4">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-4">
        <div className="border-l-[3px] border-accent pl-4">
          <p className="label text-subtle">{workspace.org.name} · UTC reporting</p>
          <h1 className="display mt-1.5 text-[36px]">Overview</h1>
        </div>
        <Segmented label="Period" size="sm" value={period} onChange={setPeriod} options={[{ value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }, { value: "90d", label: "90 days" }]} />
      </header>
      {error && <p role="alert" className="text-danger">{error} {data && "Showing the last available results."}</p>}
      {!data ? <p role="status">{error ? "Overview unavailable." : "Loading overview…"}</p> : <>
        <section aria-label="Email statistics" className="grid shrink-0 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {["sent", "delivered", "bounced", "failed", "pending"].map(key => <Kpi key={key} label={key === "pending" ? "In queue" : key} value={fmt.n(data.stats[key])} sub={`Last ${period.slice(0, -1)} days`} href="/campaigns" />)}
        </section>
        {nextStep && <Link href={nextStep.href} className="border border-line bg-panel px-5 py-3 text-[15px]">Setup {data.setup.filter(step => step.done).length}/{data.setup.length} · {nextStep.label} →</Link>}
        <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.5fr_1fr]">
          <Panel title="Delivery events" action={<span className="label text-subtle">UTC</span>} className="min-h-[220px] lg:min-h-0">
            <SendsChart p={data.series} />
          </Panel>
          <div className="flex min-w-0 flex-col gap-4 lg:min-h-0">
            <Panel title="Needs attention" action={<PanelLink href="/settings">Settings</PanelLink>}>
              {!data.alerts.length ? <p className="px-5 py-3 text-muted">No alerts for this period.</p> : <ul className="divide-y divide-line">{data.alerts.slice(0, 2).map(alert => <li key={alert.title}><Link className="block truncate px-5 py-3 text-[15px]" href={alert.href}>{alert.title}</Link></li>)}</ul>}
              {data.alerts.length > 2 && <p className="px-5 pb-2 text-sm text-muted">{data.alerts.length - 2} more · review Settings and Campaigns</p>}
            </Panel>
            <Panel title="Recent campaigns" action={<PanelLink href="/campaigns">All</PanelLink>} className="lg:flex-1">
              {!data.campaigns.length ? <div className="px-5 py-5 text-muted">No campaigns yet. <Link href="/campaigns/new" className="underline">Create your first campaign</Link></div> : <ul className="divide-y divide-line">{data.campaigns.slice(0, 4).map(campaign => <li key={campaign.id}><Link className="flex items-center gap-3 px-5 py-3" href={`/campaigns/${campaign.id}`}><div className="min-w-0 flex-1"><p className="truncate font-semibold">{campaign.name}</p><p className="text-sm text-muted">{fmt.n(campaign.counters.totalRecipients)} recipients · {fmt.n(campaign.counters.sentCount)} sent</p></div><StatusBadge status={campaign.status} /></Link></li>)}</ul>}
            </Panel>
          </div>
        </div>
      </>}
    </div>
  );
}
