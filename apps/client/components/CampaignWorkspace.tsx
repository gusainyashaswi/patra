"use client";

import { api } from "@/lib/api";
import { useCampaignStream } from "@/lib/campaign-stream";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace, workspaceRequest } from "@/lib/workspace-api";
import { Icon } from "@/components/icons";
import { Button, Card, Dialog, Field, Input, PageHeader, Select, StatusBadge, Table, Td, Th, cx, fmt } from "./ui";
import type { Campaign, CampaignEstimate, CampaignForm, CampaignOptions, PaginatedRecipients } from "@/types/client";
import type { Workspace } from "@/lib/workspace-api";

interface CampaignWorkspaceProps { id?: string; create?: boolean; }

export default function CampaignWorkspace({ id, create = false }: CampaignWorkspaceProps) {
  const { workspace, error } = useWorkspace();
  if (error) return <p role="alert" className="text-danger">{error.message}</p>;
  if (workspace === undefined) return <p role="status">Loading workspace…</p>;
  if (!workspace) return <Button href="/login">Sign in to manage campaigns</Button>;
  return <CampaignContent key={workspace.org.id + (id ?? "")} workspace={workspace} id={id} create={create} />;
}

interface CampaignContentProps { workspace: Workspace; id?: string; create: boolean; }

const STATUS_DESCRIPTIONS: Record<string, { label: string; desc: string; tone: string }> = {
  DRAFT: {
    label: "Draft",
    desc: "Draft configuration staged. Template, sender, and audience are linked. Review the estimate and queue when ready.",
    tone: "neutral",
  },
  QUEUED: {
    label: "Queued",
    desc: "Enqueued in background dispatch worker. Emails will be dispatched respecting provider rate limits.",
    tone: "info",
  },
  SENDING: {
    label: "Actively Sending",
    desc: "Background dispatch active. Real-time delivery webhooks and recipient statuses are streaming below.",
    tone: "accent",
  },
  PAUSED: {
    label: "Transmission Paused",
    desc: "Dispatcher temporarily halted. No additional emails will be sent until transmission is resumed.",
    tone: "warning",
  },
  COMPLETED: {
    label: "Completed",
    desc: "All recipient dispatches have concluded. Final deliverability metrics and bounce logs are archived below.",
    tone: "success",
  },
  CANCELLED: {
    label: "Cancelled",
    desc: "Campaign dispatch was aborted before completion.",
    tone: "neutral",
  },
};

function CampaignContent({ workspace, id, create }: CampaignContentProps) {
  const router = useRouter();
  const [data, setData] = useState<Campaign | Campaign[] | null>(null);
  const [options, setOptions] = useState<CampaignOptions | null>(null);
  const [recipients, setRecipients] = useState<PaginatedRecipients | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [confirmedSafety, setConfirmedSafety] = useState(false);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("active");
  const [wizardStep, setWizardStep] = useState(1);
  const [estimate, setEstimate] = useState<{ result: CampaignEstimate; form?: CampaignForm } | null>(null);
  const [form, setForm] = useState<CampaignForm>({ name: "", templateVersionId: "", senderIdentityId: "", listId: "" });
  const inFlight = useRef(false);
  const { revision, connected } = useCampaignStream(workspace, create ? null : id);
  const live = useRef(false);
  useEffect(() => { live.current = connected; }, [connected]);
  const query = new URLSearchParams({ page: String(page), limit: "25", ...(status ? { status } : {}) }).toString();
  const detailUrl = (campaignId: string) => `/campaigns/${campaignId}?org=${workspace.org.id}`;

  const loadOptions = useCallback(async () => {
    const result = await workspaceRequest<CampaignOptions>(workspace, "/campaigns/options");
    return {
      versions: Array.isArray(result.versions) ? result.versions : [],
      senders: Array.isArray(result.senders) ? result.senders : [],
      lists: Array.isArray(result.lists) ? result.lists : [],
    };
  }, [workspace]);

  useEffect(() => {
    let active = true;
    let timer: NodeJS.Timeout;
    async function load() {
      try {
        if (create) {
          const result = await loadOptions();
          if (active) {
            setOptions(result);
            const params = new URLSearchParams(location.search);
            const version = result.versions.find(item => item.id === params.get("templateVersionId"))
              ?? result.versions.find(item => item.templateId === params.get("templateId"));
            const list = result.lists.find(item => item.id === params.get("listId"));
            setForm(current => ({ ...current,
              templateVersionId: version?.id ?? current.templateVersionId,
              listId: list?.id ?? current.listId,
              senderIdentityId: result.senders.length === 1 ? result.senders[0].id : current.senderIdentityId,
            }));
          }
        } else {
          const [campaign, rows] = await Promise.all([
            workspaceRequest<Campaign | Campaign[]>(workspace, id ? `/campaigns/${id}` : "/campaigns"),
            id ? workspaceRequest<PaginatedRecipients>(workspace, `/campaigns/${id}/recipients?${query}`) : null,
          ]);
          if (active) { setData(campaign); setRecipients(rows); }
        }
        if (active) setError("");
      } catch (err: any) { if (active) setError(err.message); }
      finally { if (active && !create) timer = setTimeout(load, live.current ? 30000 : 4000); }
    }
    load();
    return () => { active = false; clearTimeout(timer); };
  }, [workspace, id, create, query, revision, loadOptions]);

  useEffect(() => {
    if (!create || !Object.values(form).every(value => value.trim())) return;
    let active = true;
    const timer = setTimeout(() => {
      workspaceRequest(workspace, "/campaigns/estimate", { method: "POST", body: form }).then(
        (result: any) => { if (active) { setEstimate({ result, form }); setError(""); } },
        (err: Error) => { if (active) { setEstimate(null); setError(err.message); } },
      );
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [workspace, create, form]);

  async function exportResults() {
    setBusy(true);
    try {
      const blob = await api(`/orgs/${workspace.org.id}/campaigns/${id}/recipients/export${status ? `?status=${status}` : ""}`, { token: workspace.token, responseType: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `campaign-${id}-recipients.csv`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function save(event?: React.FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    if (inFlight.current || !Object.values(form).every(value => value.trim())) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const draft = await workspaceRequest<Campaign>(workspace, "/campaigns", { method: "POST", body: form });
      router.push(detailUrl(draft.id));
    } catch (err: any) { setError(err.message); }
    finally { inFlight.current = false; setBusy(false); }
  }

  async function action(name: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await workspaceRequest(workspace, `/campaigns/${id}/${name}`, { method: "POST" });
      setConfirm(false);
      setData(await workspaceRequest<Campaign>(workspace, `/campaigns/${id}`));
    } catch (err: any) {
      setError(err.message);
      try { setData(await workspaceRequest<Campaign>(workspace, `/campaigns/${id}`)); } catch {}
    } finally { setBusy(false); inFlight.current = false; }
  }

  async function review() {
    setBusy(true);
    setError("");
    try {
      const result = await workspaceRequest<CampaignEstimate>(workspace, "/campaigns/estimate", { method: "POST", body: data as Record<string, unknown> });
      setEstimate({ result });
      setConfirmedSafety(false);
      setConfirm(true);
    } catch (err: any) { setError(err.message); }
    finally { setBusy(false); }
  }

  const currentEstimate = create ? estimate?.form === form ? estimate.result : null : estimate?.result;
  const campaignReady = Boolean(options?.versions.length && options.senders.length && options.lists.length);
  const formComplete = Object.values(form).every(value => value.trim());

  const selectedTemplate = options?.versions.find(v => v.id === form.templateVersionId);
  const selectedSender = options?.senders.find(s => s.id === form.senderIdentityId);
  const selectedList = options?.lists.find(l => l.id === form.listId);

  const campaignRows = Array.isArray(data) ? [...data].sort((left, right) => {
    if (sort === "sent") return right.counters.sentCount - left.counters.sentCount;
    if (sort === "recipients") return right.counters.totalRecipients - left.counters.totalRecipients;
    return (left.status === "SENDING" ? -1 : 0) - (right.status === "SENDING" ? -1 : 0);
  }) : [];

  return (
    <>
      <PageHeader
        title={create ? "New campaign" : id && data && !Array.isArray(data) ? data.name : "Campaigns"}
        back={id || create ? { href: "/campaigns", label: "Campaigns" } : undefined}
        description={
          create
            ? "Create and review a campaign draft. Staged drafts will not send any emails until explicitly verified and queued."
            : undefined
        }
        actions={!id && !create ? <Button href={`/campaigns/new?org=${workspace.org.id}`}><Icon.Plus size={15} /> New campaign</Button> : undefined}
      />

      {error && <p role="alert" className="mb-5 text-danger border border-danger/30 bg-danger-soft/20 p-4">{error}</p>}

      {create ? options ? (
        <div className="max-w-3xl space-y-6">
          {/* Missing Setup Safeguard Alert */}
          {(!options.versions.length || !options.senders.length || !options.lists.length) && (
            <div role="status" className="border-2 border-warning bg-warning-soft/25 p-5">
              <div className="flex items-center gap-2.5">
                <Icon.Alert size={18} className="text-warning shrink-0" />
                <h3 className="font-display text-[17px] font-bold">Prerequisites needed before creating a campaign</h3>
              </div>
              <p className="mt-1 text-[14px] text-muted">
                Patra requires an email template, a verified sender identity, and an audience contact list to stage campaigns.
              </p>
              <ul className="mt-3 divide-y divide-line/60 border-t border-line/60 text-[14px]">
                {!options.versions.length && (
                  <li className="flex items-center justify-between py-2.5">
                    <span>No published templates found</span>
                    <Link className="font-mono text-[12px] font-bold uppercase text-accent-ink hover:underline" href={`/templates?org=${workspace.org.id}`}>
                      Create template →
                    </Link>
                  </li>
                )}
                {!options.senders.length && (
                  <li className="flex items-center justify-between py-2.5">
                    <span>No verified sender identities configured</span>
                    <Link className="font-mono text-[12px] font-bold uppercase text-accent-ink hover:underline" href="/settings?tab=senders">
                      Add sender identity →
                    </Link>
                  </li>
                )}
                {!options.lists.length && (
                  <li className="flex items-center justify-between py-2.5">
                    <span>No contact audience lists uploaded</span>
                    <Link className="font-mono text-[12px] font-bold uppercase text-accent-ink hover:underline" href={`/contacts/import?org=${workspace.org.id}`}>
                      Import audience →
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* 4-Step Progressive Campaign Wizard */}
          <Card className="p-6 sm:p-8">
            {/* Wizard Navigation Tabs */}
            <div className="mb-8 border-b border-line pb-4">
              <nav aria-label="Campaign creation steps" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { step: 1, label: "Basics", done: Boolean(form.name.trim()) },
                  { step: 2, label: "Template", done: Boolean(form.templateVersionId) },
                  { step: 3, label: "Sender", done: Boolean(form.senderIdentityId) },
                  { step: 4, label: "Audience & Safety", done: Boolean(form.listId) },
                ].map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setWizardStep(s.step)}
                    className={cx(
                      "flex items-center gap-2 border-b-2 p-2 text-left font-mono text-[12px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
                      wizardStep === s.step
                        ? "border-accent text-accent-ink"
                        : s.done
                        ? "border-success text-fg"
                        : "border-transparent text-subtle hover:text-muted",
                    )}
                  >
                    <span
                      className={cx(
                        "grid h-5 w-5 place-items-center text-[10px]",
                        s.done ? "bg-success text-white" : wizardStep === s.step ? "bg-accent text-on-accent" : "bg-surface-3 text-subtle",
                      )}
                    >
                      {s.done ? <Icon.Check size={11} /> : s.step}
                    </span>
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <form onSubmit={save} className="space-y-6">
              {/* STEP 1: Campaign Basics */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-[20px] font-bold">1. Campaign identity</h2>
                    <p className="mt-1 text-[14px] text-muted">
                      Assign a clear, identifiable name for your workspace team and internal analytics.
                    </p>
                  </div>
                  <Field label="Campaign Name" htmlFor="campaign-name" hint="e.g. November Product Launch Announcement">
                    <Input
                      id="campaign-name"
                      required
                      maxLength={120}
                      placeholder="e.g. Fall Product Update · Cohort A"
                      value={form.name}
                      onChange={(e: any) => setForm({ ...form, name: e.target.value })}
                      autoFocus
                    />
                  </Field>
                  <div className="flex justify-end pt-3">
                    <Button
                      type="button"
                      disabled={!form.name.trim()}
                      onClick={() => setWizardStep(2)}
                    >
                      Continue to Template <Icon.ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: Template Selection */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-[20px] font-bold">2. Email template version</h2>
                    <p className="mt-1 text-[14px] text-muted">
                      Select a locked template version. Once chosen, the version is pinned to this campaign even if the draft is later edited.
                    </p>
                  </div>
                  <Field label="Published Template" htmlFor="templateVersionId">
                    <Select
                      id="templateVersionId"
                      required
                      disabled={!options.versions.length}
                      value={form.templateVersionId}
                      onChange={(e: any) => setForm({ ...form, templateVersionId: e.target.value })}
                    >
                      <option value="">Select a published template…</option>
                      {options.versions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.subject} (v{item.version})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  {selectedTemplate && (
                    <div className="border border-line bg-surface-2/40 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold uppercase text-subtle">Pinned Subject Line</span>
                        <span className="font-mono text-[11px] font-bold text-accent-ink uppercase">v{selectedTemplate.version}</span>
                      </div>
                      <p className="mt-1 font-semibold text-[15px]">{selectedTemplate.subject}</p>
                    </div>
                  )}
                  {!options.versions.length && (
                    <p className="text-[13px] text-muted">
                      No published templates found.{" "}
                      <Link className="underline font-semibold text-accent-ink" href={`/templates?org=${workspace.org.id}`}>
                        Design and publish a template first
                      </Link>
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-3">
                    <Button type="button" variant="secondary" onClick={() => setWizardStep(1)}>
                      <Icon.ChevronLeft size={14} /> Back
                    </Button>
                    <Button
                      type="button"
                      disabled={!form.templateVersionId}
                      onClick={() => setWizardStep(3)}
                    >
                      Continue to Sender <Icon.ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: Sender Identity */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-[20px] font-bold">3. Sender identity & transport</h2>
                    <p className="mt-1 text-[14px] text-muted">
                      The verified from-address recipients will see in their inboxes. Must belong to a verified domain.
                    </p>
                  </div>
                  <Field label="Sender Identity" htmlFor="senderIdentityId">
                    <Select
                      id="senderIdentityId"
                      required
                      disabled={!options.senders.length}
                      value={form.senderIdentityId}
                      onChange={(e: any) => setForm({ ...form, senderIdentityId: e.target.value })}
                    >
                      <option value="">Select a verified sender…</option>
                      {options.senders.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.displayName} &lt;{item.fromEmail}&gt;
                        </option>
                      ))}
                    </Select>
                  </Field>
                  {selectedSender && (
                    <div className="border border-line bg-surface-2/40 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold uppercase text-subtle">Inbox Sender Details</span>
                        <span className="font-mono text-[11px] font-semibold text-success uppercase">Verified Domain</span>
                      </div>
                      <p className="mt-1 font-semibold text-[15px]">
                        {selectedSender.displayName} <span className="font-mono text-muted text-[13px]">&lt;{selectedSender.fromEmail}&gt;</span>
                      </p>
                    </div>
                  )}
                  {!options.senders.length && (
                    <p className="text-[13px] text-muted">
                      No senders found.{" "}
                      <Link className="underline font-semibold text-accent-ink" href="/settings?tab=senders">
                        Add a sender identity in Settings
                      </Link>
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-3">
                    <Button type="button" variant="secondary" onClick={() => setWizardStep(2)}>
                      <Icon.ChevronLeft size={14} /> Back
                    </Button>
                    <Button
                      type="button"
                      disabled={!form.senderIdentityId}
                      onClick={() => setWizardStep(4)}
                    >
                      Continue to Audience <Icon.ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 4: Audience & Pre-Send Safeguard Review */}
              {wizardStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-[20px] font-bold">4. Audience & delivery estimate</h2>
                    <p className="mt-1 text-[14px] text-muted">
                      Choose which audience list will receive this campaign. Patra will instantly calculate eligibility and filter suppressions.
                    </p>
                  </div>
                  <Field label="Audience List" htmlFor="listId">
                    <Select
                      id="listId"
                      required
                      disabled={!options.lists.length}
                      value={form.listId}
                      onChange={(e: any) => setForm({ ...form, listId: e.target.value })}
                    >
                      <option value="">Select an audience list…</option>
                      {options.lists.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  {/* Real-Time Pre-Send Estimate Card */}
                  {currentEstimate && (
                    <div className="border-2 border-line bg-panel p-5">
                      <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
                          Pre-Send Safeguard Breakdown
                        </span>
                        <span className="font-mono text-[12px] font-semibold text-success">
                          {currentEstimate.eligible} Eligible Recipients
                        </span>
                      </div>
                      <Estimate value={currentEstimate} />
                      {currentEstimate.suppressed > 0 && (
                        <p className="mt-3 text-[12px] text-muted">
                          ℹ️ {currentEstimate.suppressed} addresses are automatically suppressed due to previous unsubscribes or hard bounces.
                        </p>
                      )}
                      {currentEstimate.missing > 0 && (
                        <p className="mt-1 text-[12px] text-warning">
                          ⚠️ {currentEstimate.missing} contacts are missing template variables and will be skipped to protect email quality.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-line">
                    <Button type="button" variant="secondary" onClick={() => setWizardStep(3)}>
                      <Icon.ChevronLeft size={14} /> Back
                    </Button>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          setError("");
                          setBusy(true);
                          loadOptions().then(setOptions, (err: Error) => setError(err.message)).finally(() => setBusy(false));
                        }}
                      >
                        Refresh options
                      </Button>
                      <Button
                        type="submit"
                        loading={busy}
                        disabled={!formComplete || !campaignReady}
                      >
                        Create campaign draft <Icon.Check size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Card>
        </div>
      ) : !error && <p role="status">Loading campaign options…</p> : data ? id ? (
        <>
          {/* Campaign Detail Top Bar & Status Explainer */}
          {(() => {
            const currentStatus = (data as Campaign).status;
            const statusInfo = STATUS_DESCRIPTIONS[currentStatus] || { label: currentStatus, desc: "", tone: "neutral" };
            return (
              <div className="mb-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={currentStatus} />
                    <span className="font-mono text-[12px] text-muted">
                      {connected ? "● Live stream connected" : "○ Refreshing every 4s"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentStatus === "DRAFT" && (
                      <Button loading={busy} onClick={review}>
                        <Icon.Send size={14} /> Review & send
                      </Button>
                    )}
                    {["QUEUED", "SENDING"].includes(currentStatus) && (
                      <Button variant="secondary" loading={busy} onClick={() => action("pause")}>
                        Pause sending
                      </Button>
                    )}
                    {currentStatus === "PAUSED" && (
                      <Button loading={busy} onClick={() => action("resume")}>
                        Resume sending
                      </Button>
                    )}
                    <Button variant="secondary" loading={busy} onClick={exportResults}>
                      <Icon.Download size={14} /> Export CSV
                    </Button>
                  </div>
                </div>
                {/* Status Guidance Banner */}
                <div className="border border-line bg-surface-2/40 p-4 text-[14px]">
                  <p className="font-semibold">{statusInfo.label} Status</p>
                  <p className="mt-0.5 text-muted">{statusInfo.desc}</p>
                </div>
              </div>
            );
          })()}

          {/* Metric KPI Counters */}
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
            {Object.entries((data as Campaign).counters).map(([key, value]) => (
              <Card key={key} className="p-4">
                <p className="label text-subtle">{key.replace(/Count$/, "").replace("totalRecipients", "Recipients")}</p>
                <p className="display mt-2 text-3xl font-semibold">{fmt.n(value as number)}</p>
              </Card>
            ))}
          </div>

          {/* Recipient Filter and Table */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:w-64">
              <Field label="Filter by Recipient Status" htmlFor="recipient-status">
                <Select id="recipient-status" value={status} onChange={(event: any) => { setStatus(event.target.value); setPage(0); }}>
                  {["", "QUEUED", "SENT", "DELIVERED", "FAILED", "SKIPPED", "BOUNCED", "OPENED", "CLICKED", "COMPLAINED"].map((value) => (
                    <option key={value} value={value}>{value || "All recipient statuses"}</option>
                  ))}
                </Select>
              </Field>
            </div>
            {recipients?.total != null && (
              <span className="font-mono text-[13px] text-muted">
                Showing {recipients.rows.length} of {fmt.n(recipients.total)} recipients
              </span>
            )}
          </div>

          <Table>
            <thead>
              <tr>
                <Th>Recipient Email</Th>
                <Th>Delivery Status</Th>
                <Th>Delivery Details / Error</Th>
              </tr>
            </thead>
            <tbody>
              {recipients?.rows.map((row) => (
                <tr key={row.id}>
                  <Td className="font-mono text-[14px]">{row.email}</Td>
                  <Td><StatusBadge status={row.status} /></Td>
                  <Td className={row.requiresReview ? "text-danger font-medium" : "text-muted"}>
                    {row.requiresReview ? `⚠️ Review required: ${row.error || "Delivery uncertain"}` : row.error || "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          {!recipients?.total && <p className="py-8 text-center text-muted">No recipients found for this status selection.</p>}

          <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
            <span className="font-mono text-[12px] text-subtle">Page {page + 1}</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <Icon.ChevronLeft size={14} /> Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={!recipients || (page + 1) * 25 >= recipients.total} onClick={() => setPage(page + 1)}>
                Next <Icon.ArrowRight size={14} />
              </Button>
            </div>
          </div>

          {/* Pre-Send Confirmation Dialog with Safety Safeguards */}
          <Dialog
            open={confirm}
            onClose={() => { if (!busy) setConfirm(false); }}
            title="Queue campaign for transmission?"
            description="Once queued, emails will be handed off to the BullMQ background delivery queue. Please verify your estimate before continuing."
            footer={
              <>
                <Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>
                  Keep draft
                </Button>
                <Button
                  disabled={!currentEstimate?.eligible || !confirmedSafety}
                  loading={busy}
                  onClick={() => action("send")}
                >
                  <Icon.Send size={14} /> Queue campaign ({currentEstimate?.eligible ?? 0} emails)
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              {currentEstimate && (
                <div className="border border-line bg-surface-2/40 p-4">
                  <Estimate value={currentEstimate} />
                </div>
              )}
              <div className="space-y-2 border-t border-line pt-3 text-[13px] text-muted">
                <p className="flex items-center gap-2 text-fg font-medium">
                  <Icon.CheckCircle size={15} className="text-success shrink-0" />
                  Pinned template version will be compiled for all eligible recipients.
                </p>
                <p className="flex items-center gap-2">
                  <Icon.CheckCircle size={15} className="text-success shrink-0" />
                  Suppressed and missing-variable contacts will be safely bypassed.
                </p>
              </div>

              {/* Explicit Safety Confirmation Checkbox */}
              <div className="border border-line-strong bg-panel p-3.5">
                <label className="flex items-start gap-2.5 cursor-pointer text-[14px]">
                  <input
                    type="checkbox"
                    checked={confirmedSafety}
                    onChange={(e) => setConfirmedSafety(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-accent cursor-pointer"
                  />
                  <span className="text-fg font-medium">
                    I confirm this campaign is ready to send and complies with anti-spam policies.
                  </span>
                </label>
              </div>
            </div>
          </Dialog>
        </>
      ) : data.length ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[13px] text-muted">{data.length} total campaigns</span>
            <Select aria-label="Sort campaigns" className="w-48" value={sort} onChange={(e: any) => setSort(e.target.value)}>
              <option value="active">Ongoing first</option>
              <option value="sent">Most sent</option>
              <option value="recipients">Most recipients</option>
            </Select>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Campaign</Th>
                <Th>Status</Th>
                <Th>Recipients</Th>
                <Th>Sent</Th>
                <Th align="right">View</Th>
              </tr>
            </thead>
            <tbody>
              {campaignRows.map((campaign) => (
                <tr key={campaign.id}>
                  <Td>
                    <Link href={detailUrl(campaign.id)} className="font-semibold underline hover:text-accent-ink">
                      {campaign.name}
                    </Link>
                  </Td>
                  <Td><StatusBadge status={campaign.status} /></Td>
                  <Td>{fmt.n(campaign.counters.totalRecipients)}</Td>
                  <Td>{fmt.n(campaign.counters.sentCount)}</Td>
                  <Td align="right">
                    <Link
                      href={detailUrl(campaign.id)}
                      className="inline-flex h-9 items-center border border-line-strong px-3 font-mono text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-fg hover:text-bg transition-colors"
                    >
                      View <span aria-hidden="true" className="ml-1">→</span>
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      ) : (
        <Card className="p-8 text-center">
          <Icon.Mail size={24} className="mx-auto mb-2 text-subtle" />
          <h3 className="font-display text-[20px] font-bold">No campaigns staged yet</h3>
          <p className="mt-1 text-[14px] text-muted">Create your first campaign from a published template and verified audience.</p>
          <div className="mt-5">
            <Button href={`/campaigns/new?org=${workspace.org.id}`}>
              <Icon.Plus size={14} /> Create your first campaign
            </Button>
          </div>
        </Card>
      ) : !error && <p role="status">Loading campaigns…</p>}
    </>
  );
}

function Estimate({ value }: { value: CampaignEstimate }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        [value.total, "Audience total", "text-fg"],
        [value.suppressed, "Suppressed", "text-danger"],
        [value.missing, "Missing fields", "text-warning"],
        [value.eligible, "Ready to send", "text-success font-bold"],
      ].map(([count, label, colorCls]) => (
        <div key={label} className="border border-line/60 bg-surface p-3">
          <dt className="font-mono text-[11px] font-bold uppercase text-subtle">{label}</dt>
          <dd className={cx("mt-1 text-2xl tabular", colorCls as string)}>{fmt.n(count as number)}</dd>
        </div>
      ))}
    </dl>
  );
}
