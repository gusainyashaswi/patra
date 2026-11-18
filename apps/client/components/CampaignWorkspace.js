"use client";

import { api } from "@/lib/api";
import { useCampaignStream } from "@/lib/campaign-stream";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace, workspaceRequest } from "@/lib/workspace-api";
import { Button, Card, Dialog, Field, Input, PageHeader, Select, StatusBadge, Table, Td, Th } from "./ui";

export default function CampaignWorkspace({ id, create = false }) {
  const { workspace, error } = useWorkspace();
  if (error) return <p role="alert" className="text-danger">{error.message}</p>;
  if (workspace === undefined) return <p role="status">Loading workspace…</p>;
  if (!workspace) return <Button href="/login">Sign in to manage campaigns</Button>;
  return <CampaignContent key={workspace.org.id + (id ?? "")} workspace={workspace} id={id} create={create} />;
}

function CampaignContent({ workspace, id, create }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [options, setOptions] = useState(null);
  const [recipients, setRecipients] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [estimate, setEstimate] = useState(null);
  const [form, setForm] = useState({ name: "", templateVersionId: "", senderIdentityId: "", listId: "" });
  const inFlight = useRef(false);
  const { revision, connected } = useCampaignStream(workspace, create ? null : id);
  const live = useRef(false);
  useEffect(() => { live.current = connected; }, [connected]);
  const query = new URLSearchParams({ page: String(page), limit: "25", ...(status ? { status } : {}) }).toString();
  const detailUrl = (campaignId) => `/campaigns/${campaignId}?org=${workspace.org.id}`;

  useEffect(() => {
    let active = true;
    let timer;
    async function load() {
      try {
        if (create) {
          const result = await workspaceRequest(workspace, "/campaigns/options");
          if (active) setOptions(result);
        } else {
          const [campaign, rows] = await Promise.all([
            workspaceRequest(workspace, id ? `/campaigns/${id}` : "/campaigns"),
            id ? workspaceRequest(workspace, `/campaigns/${id}/recipients?${query}`) : null,
          ]);
          if (active) { setData(campaign); setRecipients(rows); }
        }
        if (active) setError("");
      } catch (error) { if (active) setError(error.message); }
      finally { if (active && !create) timer = setTimeout(load, live.current ? 30000 : 4000); }
    }
    load();
    return () => { active = false; clearTimeout(timer); };
  }, [workspace, id, create, query, revision]);

  useEffect(() => {
    if (!create || !Object.values(form).every(value => value.trim())) return;
    let active = true;
    const timer = setTimeout(() => {
      workspaceRequest(workspace, "/campaigns/estimate", { method: "POST", body: form }).then(
        result => { if (active) setEstimate({ result, form }); },
        error => { if (active) { setEstimate(null); setError(error.message); } },
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
      link.href = url; link.download = "campaign-recipients.csv"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }

  async function save(event) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const draft = await workspaceRequest(workspace, "/campaigns", { method: "POST", body: form });
      router.push(detailUrl(draft.id));
    } catch (error) { setError(error.message); }
    finally { inFlight.current = false; setBusy(false); }
  }

  async function action(name) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await workspaceRequest(workspace, `/campaigns/${id}/${name}`, { method: "POST" });
      setConfirm(false);
      setData(await workspaceRequest(workspace, `/campaigns/${id}`));
    } catch (error) {
      setError(error.message);
      // A request may have committed before its response was lost.
      try { setData(await workspaceRequest(workspace, `/campaigns/${id}`)); } catch {}
    } finally { setBusy(false); inFlight.current = false; }
  }

  async function review() {
    setBusy(true);
    setError("");
    try {
      const result = await workspaceRequest(workspace, "/campaigns/estimate", { method: "POST", body: data });
      setEstimate({ result });
      setConfirm(true);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }

  const currentEstimate = create ? estimate?.form === form ? estimate.result : null : estimate?.result;
  return (
    <>
      <PageHeader title={create ? "New campaign" : id ? data?.name ?? "Campaign" : "Campaigns"}
        back={id || create ? { href: "/campaigns", label: "Campaigns" } : undefined}
        description={create ? "Choose a published version, verified sender, and saved audience." : undefined}
        actions={!id && !create ? <Button href={`/campaigns/new?org=${workspace.org.id}`}>New campaign</Button> : undefined} />
      {error && <p role="alert" className="mb-5 text-danger">{error}</p>}
      {create ? options ? (
        <Card className="max-w-2xl p-6">
          <form className="space-y-5" onSubmit={save}>
            <Field label="Campaign name" htmlFor="campaign-name">
              <Input id="campaign-name" required maxLength={120} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
            </Field>
            {[
              ["templateVersionId", "Published template version", options.versions, item => `${item.subject} · v${item.version}`],
              ["senderIdentityId", "Sender", options.senders, item => `${item.displayName} <${item.fromEmail}>`],
              ["listId", "Audience", options.lists, item => item.name],
            ].map(([key, label, items, display]) => (
              <Field key={key} label={label} htmlFor={key}>
                <Select id={key} required value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })}>
                  <option value="">Choose {label.toLowerCase()}</option>
                  {items.map(item => <option key={item.id} value={item.id}>{display(item)}</option>)}
                </Select>
                {!items.length && <p className="mt-2 text-sm text-muted">Add a {label.toLowerCase()} before creating a campaign.</p>}
              </Field>
            ))}
            {currentEstimate && <Estimate value={currentEstimate} />}
            <Button type="submit" loading={busy}>Save campaign draft</Button>
          </form>
        </Card>
      ) : !error && <p role="status">Loading campaign options…</p> : data ? id ? (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <StatusBadge status={data.status} />
            {data.status === "DRAFT" && <Button loading={busy} onClick={review}>Review send</Button>}
            {["QUEUED", "SENDING"].includes(data.status) && <Button loading={busy} onClick={() => action("pause")}>Pause</Button>}
            {data.status === "PAUSED" && <Button loading={busy} onClick={() => action("resume")}>Resume</Button>}
            <span className="text-sm text-muted">{connected ? "Live updates connected" : "Reconnecting · refreshing every 4 seconds"}</span>
          </div>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
            {Object.entries(data.counters).map(([key, value]) => <Card key={key} className="p-4"><p className="text-sm text-muted">{key.replace(/Count$/, "").replace("totalRecipients", "Recipients")}</p><p className="mt-2 text-3xl font-semibold">{value}</p></Card>)}
          </div>
          <Button variant="secondary" loading={busy} onClick={exportResults}>Export results</Button>
          <Field label="Recipient status" htmlFor="recipient-status">
            <Select id="recipient-status" value={status} onChange={event => { setStatus(event.target.value); setPage(0); }}>
              {["", "QUEUED", "SENT", "DELIVERED", "FAILED", "SKIPPED", "BOUNCED", "OPENED", "CLICKED", "COMPLAINED"].map(value => <option key={value} value={value}>{value || "All statuses"}</option>)}
            </Select>
          </Field>
          <Table><thead><tr><Th>Email</Th><Th>Status</Th><Th>Error</Th></tr></thead><tbody>
            {recipients?.rows.map(row => <tr key={row.id}><Td>{row.email}</Td><Td><StatusBadge status={row.status} /></Td><Td>{row.requiresReview ? `Review required: ${row.error || "Delivery uncertain"}` : row.error || "—"}</Td></tr>)}
          </tbody></Table>
          {!recipients?.total && <p className="py-5 text-muted">No recipients for this selection.</p>}
          <div className="mt-5 flex items-center gap-3">
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <span>Page {page + 1}</span>
            <Button variant="secondary" disabled={!recipients || (page + 1) * 25 >= recipients.total} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
          <Dialog open={confirm} onClose={() => { if (!busy) setConfirm(false); }} title="Send this campaign?"
            description="Queued emails will use the published template version pinned to this campaign."
            footer={<><Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>Keep draft</Button><Button disabled={!currentEstimate?.eligible} loading={busy} onClick={() => action("send")}>Queue campaign</Button></>}>
            {currentEstimate && <Estimate value={currentEstimate} />}
          </Dialog>
        </>
      ) : data.length ? (
        <Table><thead><tr><Th>Campaign</Th><Th>Status</Th><Th>Recipients</Th><Th>Sent</Th></tr></thead><tbody>
          {data.map(campaign => <tr key={campaign.id}><Td><Link href={detailUrl(campaign.id)} className="font-semibold underline">{campaign.name}</Link></Td><Td><StatusBadge status={campaign.status} /></Td><Td>{campaign.counters.totalRecipients}</Td><Td>{campaign.counters.sentCount}</Td></tr>)}
        </tbody></Table>
      ) : <p className="text-muted">Create your first campaign from a published template.</p> : !error && <p role="status">Loading campaigns…</p>}
    </>
  );
}

function Estimate({ value }) {
  return <dl className="grid grid-cols-2 gap-3 border-y border-line py-4">
    {[[value.total, "In audience"], [value.suppressed, "Suppressed"], [value.missing, "Missing required fields"], [value.eligible, "Eligible to send"]].map(([count, label]) => (
      <div key={label}><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 text-2xl font-semibold">{count}</dd></div>
    ))}
  </dl>;
}
