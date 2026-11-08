"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import {
  Button,
  Dialog,
  EmptyState,
  PageHeader,
  Progress,
  SearchInput,
  SectionTitle,
  Stat,
  StatusBadge,
  Table,
  Td,
  Th,
  Toast,
  cx,
  fmt,
} from "@/components/ui";
import { byId, campaigns, lists, recipientsFor, senders, templates } from "@/lib/mock";

const legend = [
  { key: "delivered", label: "Delivered", color: "var(--success)" },
  { key: "sent", label: "Sent", color: "var(--info)" },
  { key: "bounced", label: "Bounced", color: "var(--danger)" },
  { key: "failed", label: "Failed", color: "color-mix(in oklab, var(--danger) 50%, var(--bg))" },
  { key: "skipped", label: "Skipped", color: "var(--warning)" },
  { key: "pending", label: "Pending", color: "var(--surface-3)" },
];

const statusFilters = ["ALL", "DELIVERED", "OPENED", "CLICKED", "SENT", "PENDING", "BOUNCED", "FAILED", "SKIPPED"];

export default function CampaignDetail() {
  const { id } = useParams();
  const campaign = byId(campaigns, id) ?? campaigns[0];
  const [status, setStatus] = useState(campaign.status);
  const [c, setC] = useState(campaign.counters);
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [toast, setToast] = useState("");
  const recipients = useMemo(() => recipientsFor(campaign), [campaign]);

  // Simulated SSE stream: moves pending → sent → delivered while sending.
  useEffect(() => {
    if (status !== "SENDING") return;
    const t = setInterval(() => {
      setC((p) => {
        if (p.pending <= 0) {
          setStatus("COMPLETED");
          return p;
        }
        const step = Math.min(p.pending, 6 + Math.floor(Math.random() * 6));
        const land = Math.min(p.sent, 5 + Math.floor(Math.random() * 6));
        return { ...p, pending: p.pending - step, sent: p.sent + step - land, delivered: p.delivered + land };
      });
    }, 1200);
    return () => clearInterval(t);
  }, [status]);

  const t = byId(templates, campaign.templateId);
  const s = byId(senders, campaign.senderId);
  const l = byId(lists, campaign.listId);
  const processed = c.total - c.pending;
  const live = status === "SENDING";

  const rows = recipients.filter(
    (r) =>
      (filter === "ALL" || r.status === filter) &&
      (r.email.includes(q.toLowerCase()) || r.name.toLowerCase().includes(q.toLowerCase())),
  );
  const countFor = (k) => (k === "ALL" ? recipients.length : recipients.filter((r) => r.status === k).length);

  return (
    <>
      <PageHeader
        back={{ href: "/campaigns", label: "Campaigns" }}
        title={campaign.name}
        kicker={`${t.name} v${campaign.templateVersion} · ${s.fromEmail} · ${l.name}`}
        actions={
          <>
            {(status === "SENDING" || status === "PAUSED") && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStatus(status === "SENDING" ? "PAUSED" : "SENDING");
                    setToast(status === "SENDING" ? "Paused. Queued emails will wait." : "Sending resumed.");
                  }}
                >
                  {status === "SENDING" ? <><Icon.Pause size={14} /> Pause</> : <><Icon.Play size={14} /> Resume</>}
                </Button>
                <Button variant="ghost" onClick={() => setCancelOpen(true)}>Cancel</Button>
              </>
            )}
            <Button variant="primary" onClick={() => setToast("Export started. Your CSV will download shortly.")}>
              <Icon.Download size={15} /> Export
            </Button>
          </>
        }
      />

      {/* Progress — one big number, one bar, one legend */}
      <section className="mb-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              {live && <span className="label text-subtle">Updating live</span>}
            </div>
            <div className="mt-5 flex items-baseline gap-4" aria-live="polite">
              <span className="display tabular text-[64px] sm:text-[88px]">{fmt.n(processed)}</span>
              <span className="display tabular text-[28px] text-subtle sm:text-[36px]">/ {fmt.n(c.total)}</span>
            </div>
            <div className="label mt-3 text-subtle">Recipients processed</div>
          </div>
          <div className="text-right">
            <div className="display tabular text-[40px] text-accent-ink sm:text-[48px]">{fmt.pct(processed, c.total)}</div>
            <div className="label mt-2 text-subtle">Complete</div>
          </div>
        </div>
        <div className="mt-10">
          <Progress label="Delivery breakdown" height="h-4" segments={legend.map((x) => ({ ...x, value: c[x.key] }))} />
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          {legend.map((x) => (
            <li key={x.key} className="flex items-center gap-2.5 text-[15px] text-muted">
              <span className="h-3 w-3" style={{ background: x.color }} aria-hidden="true" />
              {x.label}
              <span className="tabular font-mono font-semibold text-fg">{fmt.n(c[x.key])}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-20 grid grid-cols-2 gap-x-8 gap-y-12 border-t-2 border-line-strong pt-10 md:grid-cols-4">
        <Stat label="Delivery rate" value={fmt.pct(c.delivered, processed)} tone="success" />
        <Stat label="Open rate" value={fmt.pct(c.opened, c.delivered)} />
        <Stat label="Click rate" value={fmt.pct(c.clicked, c.delivered)} />
        <Stat label="Bounce rate" value={fmt.pct(c.bounced, processed)} tone={c.bounced / processed > 0.01 ? "danger" : undefined} />
      </section>

      <section>
        <SectionTitle
          title="Recipients"
          kicker="Filter by delivery status"
          action={
            <SearchInput className="hidden w-72 md:block" placeholder="Search recipients" label="Search recipients" value={q} onChange={(e) => setQ(e.target.value)} />
          }
        />
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {statusFilters.map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              aria-pressed={filter === k}
              className={cx(
                "inline-flex h-10 items-center gap-2 border-2 px-4 font-mono text-[12px] font-bold uppercase tracking-[0.1em] cursor-pointer transition-colors duration-150",
                filter === k ? "border-line-strong bg-fg text-bg" : "border-line text-muted hover:border-line-strong hover:text-fg",
              )}
            >
              {k === "ALL" ? "All" : k[0] + k.slice(1).toLowerCase()}
              <span className={cx("tabular", filter === k ? "text-accent" : "text-subtle")}>{countFor(k)}</span>
            </button>
          ))}
        </div>
        <SearchInput className="mb-6 md:hidden" placeholder="Search recipients" label="Search recipients" value={q} onChange={(e) => setQ(e.target.value)} />

        {rows.length === 0 ? (
          <EmptyState
            icon={<Icon.Users size={20} />}
            title="No recipients match"
            description="Try another status or clear the search."
            action={<Button variant="secondary" onClick={() => { setFilter("ALL"); setQ(""); }}>Reset filters</Button>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="pl-0">Recipient</Th>
                <Th>Status</Th>
                <Th className="hidden md:table-cell">Detail</Th>
                <Th align="right" className="hidden pr-0 sm:table-cell">Updated</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-surface-2/60">
                  <Td className="pl-0">
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-[14px] text-subtle">{r.email}</div>
                  </Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td className="hidden md:table-cell">
                    {r.error ? <span className="font-mono text-[13px] text-danger">{r.error}</span> : <span className="text-subtle">—</span>}
                  </Td>
                  <Td align="right" className="hidden pr-0 text-muted sm:table-cell">{fmt.date(r.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <p className="label mt-6 text-subtle">
          Showing {rows.length} of {fmt.n(c.total)}
        </p>
      </section>

      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this campaign?"
        description={`${fmt.n(c.pending)} queued emails won't be sent. Emails already sent stay sent. This can't be undone.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>Keep sending</Button>
            <Button
              variant="danger"
              onClick={() => {
                setStatus("CANCELLED");
                setCancelOpen(false);
                setToast("Campaign cancelled.");
              }}
            >
              Cancel campaign
            </Button>
          </>
        }
      />
      <Toast message={toast} onDone={() => setToast("")} />
    </>
  );
}
