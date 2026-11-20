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

const sum = values => values.reduce((total, value) => total + value, 0);

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
      className="inline-flex items-center gap-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-muted hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 cursor-pointer transition-colors"
    >
      {children} <Icon.ArrowRight size={13} />
    </Link>
  );
}

function Kpi({ label, value, sub, delta, highlight, href, tip }) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="label text-subtle">{label}</span>
        {delta}
      </div>
      <div className={cx("display tabular mt-2 text-[30px] tracking-[-0.045em] xl:text-[38px]", highlight && "text-accent-ink")}>{value}</div>
      <div className="mt-1 truncate text-[14px] text-subtle" title={tip || sub}>{sub}</div>
    </>
  );
  const cls = cx(
    "block min-w-0 border bg-panel px-5 py-4 transition-[border-color,background-color] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
    highlight ? "border-accent bg-accent-soft/30" : "border-line",
    href && "hover:border-line-strong hover:bg-surface-2/40 cursor-pointer",
  );
  return href ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

// Onboarding Checklist: gives new workspaces clear, actionable progress from initial setup to first send
function OnboardingChecklist({ setup = [], orgId }: { setup?: Array<{ label?: string; href?: string; done?: boolean }>; orgId: string }) {
  const [open, setOpen] = useState(true);

  // Standard steps with fallback links if setup object doesn't have custom ones
  const steps = [
    {
      id: "transport",
      label: "Connect Resend mail transport",
      desc: "Add your provider API key so Patra can securely dispatch transactional and bulk emails.",
      href: `/settings?tab=transports&org=${orgId}`,
      cta: "Connect provider",
    },
    {
      id: "sender",
      label: "Configure verified sender identity",
      desc: "Specify the from-address and sender name your recipients will see in their inboxes.",
      href: `/settings?tab=senders&org=${orgId}`,
      cta: "Add sender",
    },
    {
      id: "contacts",
      label: "Import your first audience list",
      desc: "Upload a CSV or XLSX contact list. Bounces and unsubscribes are automatically managed.",
      href: `/contacts/import?org=${orgId}`,
      cta: "Import contacts",
    },
    {
      id: "template",
      label: "Create and publish an email template",
      desc: "Build a responsive template with personalizing variables, then publish a locked version.",
      href: `/templates?org=${orgId}`,
      cta: "Browse templates",
    },
    {
      id: "campaign",
      label: "Schedule or queue your first campaign",
      desc: "Select a published template, choose your audience, and review the pre-send safety estimate.",
      href: `/campaigns/new?org=${orgId}`,
      cta: "New campaign",
    },
  ];

  // Map backend setup state onto our curated steps
  const enrichedSteps = steps.map((step, idx) => {
    const matched = setup[idx];
    return {
      ...step,
      href: matched?.href || step.href,
      label: matched?.label || step.label,
      done: matched?.done ?? false,
    };
  });

  const completedCount = enrichedSteps.filter((s) => s.done).length;
  const totalCount = enrichedSteps.length;
  const isFullyComplete = completedCount === totalCount;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="border border-line bg-panel p-5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center border border-line-strong bg-surface-2 font-mono text-[12px] font-bold text-fg" aria-hidden="true">
            {completedCount}/{totalCount}
          </div>
          <div>
            <h3 className="font-display text-[17px] font-bold tracking-tight">
              {isFullyComplete ? "Workspace setup complete" : "Get started with Patra"}
            </h3>
            <p className="text-[13px] text-muted">
              {isFullyComplete
                ? "All transmission prerequisites, sender domains, and lists are ready for production sending."
                : `${completedCount} of ${totalCount} steps completed · Finish setup to begin sending live campaigns`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-2 w-28 bg-surface-3 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress">
              <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${percent}%` }} />
            </div>
            <span className="font-mono text-[12px] text-subtle">{percent}%</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-wider text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-accent cursor-pointer px-2 py-1 border border-line"
          >
            {open ? "Hide checklist" : "Show checklist"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {enrichedSteps.map((step, idx) => (
              <div
                key={step.id}
                className={cx(
                  "flex flex-col justify-between border p-3.5 transition-colors",
                  step.done ? "border-line bg-surface-2/30" : "border-line-strong bg-panel",
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-subtle">0{idx + 1}</span>
                    {step.done ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-success uppercase">
                        <Icon.Check size={13} /> Ready
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] font-semibold uppercase text-accent-ink">
                        Pending
                      </span>
                    )}
                  </div>
                  <h4 className={cx("mt-2 text-[14px] font-semibold leading-snug", step.done ? "text-muted" : "text-fg")}>
                    {step.label}
                  </h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-subtle">{step.desc}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-line/60">
                  <Link
                    href={step.href}
                    className={cx(
                      "inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-accent cursor-pointer transition-colors",
                      step.done
                        ? "text-subtle hover:text-fg"
                        : "text-accent-ink hover:underline",
                    )}
                  >
                    {step.done ? "Manage" : step.cta} <Icon.ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Stacked bars that stretch to the available height (no fixed px heights).
function SendsChart({ p }: { p?: { days?: string[]; delivered?: number[]; bounced?: number[]; failed?: number[] } }) {
  const series = [
    { key: "delivered" as const, label: "Delivered", color: "var(--tint-1)" },
    { key: "bounced" as const, label: "Bounced", color: "var(--danger)" },
    { key: "failed" as const, label: "Failed", color: "var(--tint-3)" },
  ];

  if (!p?.days?.length) {
    return (
      <div className="flex min-h-[160px] flex-1 items-center justify-center p-6 text-muted font-mono text-[13px]">
        No delivery activity recorded for this period.
      </div>
    );
  }

  const totals = p.days.map((_, i) => (p.delivered?.[i] ?? 0) + (p.bounced?.[i] ?? 0) + (p.failed?.[i] ?? 0));
  const raw = Math.max(...totals, 1);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const max = [1, 2, 4, 5, 10].map((m) => m * mag).find((v) => v >= raw) || raw || 1;
  const ticks = [max, max / 2, 0];

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-3">
      <ul className="flex shrink-0 flex-wrap gap-x-5 gap-y-1">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[14px] text-muted">
            <span className="h-2.5 w-2.5" style={{ background: s.color }} aria-hidden="true" />
            {s.label} <span className="tabular font-mono font-semibold text-fg">{fmt.n(sum(p[s.key] || []))}</span>
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
                  {fmt.n(totals[i])} · {p.bounced?.[i] ?? 0} bounced
                </span>
                {[...series].reverse().map((s) => (
                  <span key={s.key} className="w-full" style={{ height: `${(((p[s.key]?.[i] ?? 0) / max) * 100).toFixed(1)}%`, background: s.color }} />
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
  const hasSent = Boolean(data?.stats?.sent && data.stats.sent > 0);
  const deliveryRate = hasSent ? fmt.pct(data?.stats?.delivered ?? 0, data?.stats?.sent ?? 1) : "0%";
  const bounceRate = hasSent ? fmt.pct(data?.stats?.bounced ?? 0, data?.stats?.sent ?? 1) : "0%";
  const isSetupIncomplete = Boolean(data?.setup && data.setup.some((step: any) => !step.done));

  return (
    <div className="flex flex-col gap-5 lg:min-h-0 lg:flex-1 lg:gap-4">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-5 border-b border-line pb-6">
        <div>
          <p className="label text-accent-ink">Delivery telemetry & health</p>
          <h1 className="display mt-2 text-[40px] sm:text-[48px]">Overview</h1>
          <p className="mt-2 text-[15px] text-muted">{workspace.org.name} · real-time queue status & delivery analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/campaigns/new?org=${workspace.org.id}`}
            className="inline-flex h-9 items-center gap-1.5 bg-accent px-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-on-accent hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent cursor-pointer transition-colors"
          >
            <Icon.Plus size={13} /> New campaign
          </Link>
          <Segmented label="Period" size="sm" value={period} onChange={setPeriod} options={[{ value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }, { value: "90d", label: "90 days" }]} />
        </div>
      </header>
      {error && <p role="alert" className="text-danger">{error} {data && "Showing the last available results."}</p>}
      {!data ? <p role="status">{error ? "Overview unavailable." : "Loading overview…"}</p> : <>
        {/* Onboarding Checklist for setup clarity */}
        {(isSetupIncomplete || data.campaigns.length === 0) && (
          <OnboardingChecklist setup={data.setup} orgId={workspace.org.id} />
        )}

        <section aria-label="Email statistics" className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi
            label="Sent"
            value={fmt.n(data?.stats?.sent ?? 0)}
            sub={hasSent ? `Last ${period.slice(0, -1)} days` : "No emails dispatched yet"}
            href="/campaigns"
            tip="Total emails handed off to mail transport in this period"
          />
          <Kpi
            label="Delivery rate"
            value={deliveryRate}
            sub={hasSent ? `${fmt.n(data?.stats?.delivered ?? 0)} delivered` : "Awaiting first send"}
            highlight={(data?.stats?.delivered ?? 0) > 0}
            href="/campaigns"
            tip="Percentage of sent emails confirmed delivered by transport"
          />
          <Kpi
            label="Bounce rate"
            value={bounceRate}
            sub={hasSent ? `${fmt.n(data?.stats?.bounced ?? 0)} bounced` : "0 bounces recorded"}
            href="/campaigns"
            tip="Hard and soft bounces recorded across all recipients"
          />
          <Kpi
            label="In queue"
            value={fmt.n(data?.stats?.pending ?? 0)}
            sub={(data?.stats?.pending ?? 0) > 0 ? "Actively dispatching" : "Queue idle"}
            highlight={(data?.stats?.pending ?? 0) > 0}
            href="/campaigns"
            tip="Messages currently staged in the BullMQ worker queue"
          />
        </section>

        <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.5fr_1fr]">
          <Panel title="Delivery events" action={<span className="label text-subtle">{period.toUpperCase()} · UTC</span>} className="min-h-[250px] lg:min-h-0">
            <SendsChart p={data.series} />
          </Panel>
          <div className="flex min-w-0 flex-col gap-4 lg:min-h-0">
            <Panel title="System status & alerts" action={<PanelLink href="/settings">Settings</PanelLink>}>
              {!data.alerts.length ? (
                <div className="flex items-center gap-3 px-5 py-4 text-muted">
                  <Icon.CheckCircle size={18} className="text-success shrink-0" />
                  <p className="text-[14px]">All transmission channels nominal. No delivery warnings or domain alerts.</p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {data.alerts.slice(0, 3).map(alert => (
                    <li key={alert.title}>
                      <Link
                        className="group flex items-center justify-between gap-3 px-5 py-3.5 text-[14px] hover:bg-surface-2 transition-colors"
                        href={alert.href}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon.Alert size={15} className={cx("shrink-0", alert.tone === "danger" ? "text-danger" : "text-warning")} />
                          <span className="truncate font-medium text-fg group-hover:text-accent-ink">{alert.title}</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold uppercase text-muted group-hover:text-accent-ink shrink-0">
                          Resolve →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {data.alerts.length > 3 && (
                <div className="border-t border-line px-5 py-2">
                  <Link href="/settings" className="font-mono text-[11px] font-bold uppercase text-muted hover:text-fg">
                    {data.alerts.length - 3} more alerts · Review Settings
                  </Link>
                </div>
              )}
            </Panel>
            <Panel title="Recent campaigns" action={<PanelLink href="/campaigns">View all</PanelLink>} className="lg:flex-1">
              {!data.campaigns.length ? (
                <div className="flex flex-col items-center justify-center px-5 py-8 text-center text-muted">
                  <Icon.Mail size={22} className="mb-2 text-subtle" />
                  <p className="text-[14px]">No campaigns dispatched yet.</p>
                  <Link
                    href={`/campaigns/new?org=${workspace.org.id}`}
                    className="mt-3 inline-flex items-center gap-1 font-mono text-[12px] font-bold uppercase tracking-wider text-accent-ink hover:underline"
                  >
                    Launch your first campaign <Icon.ArrowRight size={12} />
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {data.campaigns.slice(0, 4).map(campaign => (
                    <li key={campaign.id}>
                      <Link
                        className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2 transition-colors"
                        href={`/campaigns/${campaign.id}?org=${workspace.org.id}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[15px]">{campaign.name}</p>
                          <p className="text-[13px] text-muted">
                            {fmt.n(campaign.counters?.totalRecipients ?? 0)} recipients · {fmt.n(campaign.counters?.sentCount ?? 0)} sent
                          </p>
                        </div>
                        <StatusBadge status={campaign.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </>}
    </div>
  );
}
