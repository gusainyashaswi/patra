"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import {
  Badge,
  Button,
  Dialog,
  Field,
  Input,
  PageHeader,
  Segmented,
  Select,
  StatusBadge,
  Toast,
  fmt,
} from "@/components/ui";
import Link from "next/link";
import { api } from "@/lib/api";

const providerMeta = { RESEND: "Resend", SMTP: "SMTP", SES: "Amazon SES" };
const EMPTY_TRANSPORT = { name: "", key: "" };

function Row({ icon, title, meta, right, children }) {
  return (
    <div className="flex flex-col gap-4 px-7 py-6 sm:flex-row sm:items-center">
      <span className="grid h-12 w-12 shrink-0 place-items-center border-2 border-line-strong text-fg">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[18px] font-semibold">{title}</span>
          {children}
        </div>
        <div className="mt-1 truncate text-[15px] text-subtle">{meta}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">{right}</div>
    </div>
  );
}

function TransportForm({ create, toast }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_TRANSPORT);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const close = () => {
    if (saving) return;
    setOpen(false);
    setForm(EMPTY_TRANSPORT);
    setError("");
  };

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      await create({ name: form.name.trim(), type: "RESEND", apiKey: form.key.trim() });
      close();
      toast("Transport saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Icon.Plus size={14} /> Add</Button>
      <Dialog open={open} onClose={close} title="Add a Resend transport"
        footer={<><Button variant="secondary" disabled={saving} onClick={close}>Cancel</Button><Button type="submit" form="transport-form" loading={saving} disabled={saving}>Save transport</Button></>}>
        <form id="transport-form" onSubmit={save} className="flex flex-col gap-5">
          <Field label="Name" htmlFor="tr-name">
            <Input id="tr-name" required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="API key" htmlFor="tr-key" hint="Credentials are encrypted before storage.">
            <Input id="tr-key" type="password" autoComplete="off" required pattern="re_.+" value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} />
          </Field>
          {error && <p role="alert" className="text-danger">{error}</p>}
        </form>
      </Dialog>
    </>
  );
}

function Transports({ items, create, toast, runAction }) {
  const [busy, setBusy] = useState(null);
  const [feedback, setFeedback] = useState(null);

  async function act(id, action) {
    if (busy) return;
    setBusy({ id, action });
    setFeedback(null);
    try {
      const result = await runAction(id, action);
      if (action === "test") {
        setFeedback({ message: result.message, error: result.status === "FAILED" });
      } else {
        const conflicts = result.conflicts.length
          ? ` Already on another transport: ${result.conflicts.join(", ")}.`
          : "";
        setFeedback({ message: `Synced ${result.synced} domains.${conflicts}` });
      }
    } catch (error) {
      setFeedback({ message: error.message, error: true });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <div className="mb-2 flex items-end justify-between gap-6 border-b-2 border-line-strong pb-6">
        <div>
          <h2 className="display text-[28px]">Mail transports</h2>
          <p className="mt-2 text-muted">Check your Resend key and sync verified sending domains.</p>
        </div>
        <TransportForm create={create} toast={toast} />
      </div>
      {feedback && <p className="my-4" role={feedback.error ? "alert" : "status"}>{feedback.message}</p>}
      <div className="divide-y divide-line">
        {!items.length && <p className="py-6 text-muted">No transports yet.</p>}
        {items.map((t) => (
          <Row key={t.id ?? t._id} icon={<Icon.Server size={17} />} title={t.name}
            right={t.type === "RESEND" && (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" disabled={!!busy}
                  loading={busy?.id === (t.id ?? t._id) && busy.action === "test"}
                  onClick={() => act(t.id ?? t._id, "test")}>Test connection</Button>
                <Button variant="secondary" size="sm" disabled={!!busy}
                  loading={busy?.id === (t.id ?? t._id) && busy.action === "domains/sync"}
                  onClick={() => act(t.id ?? t._id, "domains/sync")}>Sync domains</Button>
              </div>
            )}
            meta={`${providerMeta[t.type] ?? t.type} · ${t.ratePerSecond}/s${t.dailyLimit ? `, ${fmt.n(t.dailyLimit)}/day` : ""}`}>
            <StatusBadge status={t.status} />
            {t.isDefault && <Badge>Default</Badge>}
          </Row>
        ))}
      </div>
    </section>
  );
}

function Domains({ items }) {
  return (
    <section>
      <div className="mb-2 border-b-2 border-line-strong pb-6">
        <h2 className="display text-[28px]">Sending domains</h2>
        <p className="mt-2 max-w-xl text-[16px] text-muted">Verify your domain in Resend, then sync domains from its transport in Settings.</p>
      </div>
      <div className="divide-y divide-line">
        {!items.length && <p className="py-6 text-muted">No sending domains are registered for this organization.</p>}
        {items.map((d) => (
          <Row
            key={d.id}
            icon={<Icon.Globe size={17} />}
            title={d.name}
          >
            <StatusBadge status={d.verified ? "VERIFIED" : "UNVERIFIED"} />
          </Row>
        ))}
      </div>
    </section>
  );
}

function Senders({ items, domains, create, toast }) {
  const verified = domains.filter((domain) => domain.verified);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ displayName: "", local: "", domainId: verified[0]?.id ?? "", replyTo: "" });
  const [err, setErr] = useState({});


  const save = async () => {
    if (saving) return;
    const e = {};
    if (!form.displayName.trim()) e.displayName = "Recipients see this name in their inbox";
    if (!/^[a-z0-9._+-]+$/i.test(form.local)) e.local = "Use letters, numbers, dots or dashes";
    if (form.replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.replyTo)) e.replyTo = "Enter a valid email";
    setErr(e);
    if (Object.keys(e).length) return;
    const domain = verified.find((item) => item.id === form.domainId);
    if (!domain) return;
    setSaving(true);
    try {
      await create({
        displayName: form.displayName.trim(),
        fromEmail: `${form.local}@${domain.name}`,
        domainId: domain.id,
        replyTo: form.replyTo.trim() || undefined,
      });
      setOpen(false);
      setForm({ displayName: "", local: "", domainId: verified[0].id, replyTo: "" });
      toast("Sender added.");
    } catch (error) {
      setErr({ request: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section>
        <div className="mb-2 flex items-end justify-between gap-6 border-b-2 border-line-strong pb-6">
          <div>
            <h2 className="display text-[28px]">Sender identities</h2>
            <p className="mt-2 max-w-xl text-[16px] text-muted">The name and address recipients see. Only verified domains are allowed.</p>
          </div>
          <Button size="sm" disabled={!verified.length} onClick={() => { setErr({}); setOpen(true); }}><Icon.Plus size={14} /> Add</Button>
        </div>
        <div className="divide-y divide-line">
          {!verified.length && <p className="py-6 text-muted">Register a verified domain before adding a sender.</p>}
          {verified.length > 0 && !items.length && <p className="py-6 text-muted">No sender identities yet.</p>}
          {items.map((s) => (
            <Row
              key={s.id}
              icon={<Icon.AtSign size={17} />}
              title={s.displayName}
              meta={`${s.fromEmail}${s.replyTo ? ` · replies to ${s.replyTo}` : ""}`}
            >
              {s.isDefault && <Badge>Default</Badge>}
            </Row>
          ))}
        </div>
      </section>

      <Dialog
        open={open}
        onClose={() => { if (!saving) setOpen(false); }}
        title="Add a sender"
        footer={
          <>
            <Button variant="secondary" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving} disabled={saving}>Add sender</Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <Field label="Display name" htmlFor="sd-name" error={err.displayName}>
            <Input id="sd-name" placeholder="e.g. Rishihood Fest" value={form.displayName} invalid={!!err.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          </Field>
          <Field label="From address" htmlFor="sd-local" error={err.local} hint="Unverified domains can't be chosen.">
            <div className="flex items-stretch gap-2">
              <Input id="sd-local" placeholder="hello" value={form.local} invalid={!!err.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
              <span className="grid place-items-center text-muted">@</span>
              <Select aria-label="Domain" value={form.domainId} onChange={(e) => setForm({ ...form, domainId: e.target.value })}>
                {verified.map((d) => (
                  <option key={d.id} value={d.id} disabled={!d.verified}>{d.name}{d.verified ? "" : " (not verified)"}</option>
                ))}
              </Select>
            </div>
          </Field>
          {err.request && <p role="alert" className="text-danger">{err.request}</p>}
          <Field label="Reply-to" htmlFor="sd-reply" optional error={err.replyTo}>
            <Input id="sd-reply" type="email" placeholder={`team@${verified[0]?.name ?? "example.com"}`} value={form.replyTo} invalid={!!err.replyTo} onChange={(e) => setForm({ ...form, replyTo: e.target.value })} />
          </Field>
        </div>
      </Dialog>
    </>
  );
}

const tabs = [
  { value: "transports", label: "Transports" },
  { value: "domains", label: "Domains" },
  { value: "senders", label: "Senders" },
];

export default function SettingsPage() {
  return (
    <Suspense>
      <Settings />
    </Suspense>
  );
}

function Settings() {
  const router = useRouter();
  const params = useSearchParams();
  const [toast, setToast] = useState("");
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [orgId, setOrgId] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data: organizations } = await api("/orgs");
        if (!active) return;
        setSession({ organizations });
        setOrgId(organizations[0]?.id ?? "");
      } catch (err) {
        if (active) setError(err);
      }
    }
    load();
    return () => { active = false; };
  }, [retry]);
  // Deep-linkable tabs: /settings?tab=senders
  const tab = tabs.some((x) => x.value === params.get("tab")) ? params.get("tab") : "transports";
  const change = (t) => router.replace(`/settings?tab=${t}`, { scroll: false });

  return (
    <>
      <PageHeader title="Settings" description="Configure how mail leaves Patra and who it comes from." />
      <div className="mb-10">
        <Segmented label="Settings sections" value={tab} onChange={change} options={tabs} />
      </div>
      {error ? <SettingsError error={error} retry={() => { setError(null); setRetry((n) => n + 1); }} />
        : !session ? <p role="status">Loading organizations…</p>
        : !orgId ? <p role="status">Your account has no organizations.</p>
        : <>
          {session.organizations.length > 1 && (
            <div className="mb-6">
              <Field label="Organization" htmlFor="settings-org">
                <Select id="settings-org" value={orgId} onChange={(event) => setOrgId(event.target.value)}>
                  {session.organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
                </Select>
              </Field>
            </div>
          )}
          <SettingsData key={`${orgId}-${tab}`} tab={tab} orgId={orgId} toast={setToast} />
        </>}
      <Toast message={toast} onDone={() => setToast("")} />
    </>
  );
}

function SettingsError({ error, retry }) {
  return (
    <div className="space-y-3">
      <p role="alert" className="text-danger">{error.message}</p>
      {error.status === 401
        ? <Link className="underline" href="/login">Sign in</Link>
        : <Button variant="secondary" onClick={retry}>Try again</Button>}
    </div>
  );
}

function SettingsData({ tab, orgId, toast }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const path = `/orgs/${orgId}`;
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [items, domains] = await Promise.all([
          api(`${path}/${tab}`),
          tab === "senders" ? api(`${path}/domains`) : null,
        ]);
        if (active) setResult({ items: items.data, domains: domains?.data ?? [] });
      } catch (err) {
        if (active) setError(err);
      }
    }
    load();
    return () => { active = false; };
  }, [tab, path, retry]);

  async function create(body) {
    const { data } = await api(`${path}/${tab}`, { method: "POST", body });
    setResult((current) => ({ ...current, items: [...current.items, data] }));
  }
  async function runTransportAction(id, action) {
    const { data } = await api(`${path}/transports/${id}/${action}`, { method: "POST" });
    if (action === "test") {
      setResult((current) => ({
        ...current,
        items: current.items.map((item) => (item.id ?? item._id) === id
          ? { ...item, status: data.status, lastTestedAt: data.lastTestedAt }
          : item),
      }));
    }
    return data;
  }

  if (error) return <SettingsError error={error} retry={() => { setError(null); setRetry((n) => n + 1); }} />;
  if (!result) return <p role="status">Loading {tab}…</p>;
  if (tab === "domains") return <Domains items={result.items} />;
  if (tab === "senders") return <Senders {...result} create={create} toast={toast} />;
  return <Transports items={result.items} create={create} toast={toast} runAction={runTransportAction} />;
}
