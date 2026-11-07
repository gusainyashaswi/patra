"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
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
  cx,
  fmt,
} from "@/components/ui";
import { byId, domains as seedDomains, senders as seedSenders, transports as seedTransports } from "@/lib/mock";

const providerMeta = {
  RESEND: { label: "Resend", hint: "Recommended. API key from resend.com → API Keys." },
  SES: { label: "Amazon SES", hint: "Access key with ses:SendEmail permission, plus region." },
  SMTP: { label: "SMTP", hint: "Any SMTP server. Use port 587 with STARTTLS where possible." },
};

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

function Transports({ toast }) {
  const [items, setItems] = useState(seedTransports);
  const [testing, setTesting] = useState(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("RESEND");
  const [form, setForm] = useState({ name: "", key: "", host: "", port: "587", user: "", pass: "", region: "ap-south-1" });
  const [err, setErr] = useState({});

  const test = (id) => {
    setTesting(id);
    setTimeout(() => {
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status: "CONNECTED", lastTestedAt: new Date().toISOString() } : x)));
      setTesting(null);
      toast("Connection works. This transport can now send.");
    }, 1200);
  };
  const save = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Give it a name you'll recognise";
    if (type === "RESEND" && !/^re_/.test(form.key)) e.key = "Resend keys start with re_";
    if (type === "SMTP" && !form.host) e.host = "Enter the SMTP host";
    if (type === "SES" && !form.key) e.key = "Enter the access key ID";
    setErr(e);
    if (Object.keys(e).length) return;
    setItems((xs) => [
      ...xs,
      {
        id: `tr_${xs.length + 1}`,
        type,
        name: form.name,
        status: "UNTESTED",
        isDefault: false,
        credentialMask: type === "SMTP" ? `${form.host}:${form.port}` : `${form.key.slice(0, 3)}••••••••${form.key.slice(-4)}`,
        ratePerSecond: type === "SMTP" ? 2 : 10,
        dailyLimit: 3000,
      },
    ]);
    setOpen(false);
    setForm({ name: "", key: "", host: "", port: "587", user: "", pass: "", region: "ap-south-1" });
    toast("Transport saved. Run a connection test before sending.");
  };

  return (
    <>
      <section>
        <div className="mb-2 flex items-end justify-between gap-6 border-b-2 border-line-strong pb-6">
          <div>
            <h2 className="display text-[28px]">Mail transports</h2>
            <p className="mt-2 max-w-xl text-[16px] text-muted">How Patra hands mail to a provider. Credentials are encrypted and never shown again.</p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}><Icon.Plus size={14} /> Add</Button>
        </div>
        <div className="divide-y divide-line">
          {items.map((t) => (
            <Row
              key={t.id}
              icon={<Icon.Server size={17} />}
              title={t.name}
              meta={`${providerMeta[t.type].label} · ${t.credentialMask} · ${t.ratePerSecond}/s, ${fmt.n(t.dailyLimit)}/day`}
              right={
                <>
                  <Button variant="secondary" size="sm" loading={testing === t.id} onClick={() => test(t.id)}>
                    {testing === t.id ? "Testing…" : "Test connection"}
                  </Button>
                  {!t.isDefault && t.status === "CONNECTED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setItems((xs) => xs.map((x) => ({ ...x, isDefault: x.id === t.id })));
                        toast(`${t.name} is now the default`);
                      }}
                    >
                      Make default
                    </Button>
                  )}
                </>
              }
            >
              <StatusBadge status={t.status} />
              {t.isDefault && <Badge>Default</Badge>}
            </Row>
          ))}
        </div>
      </section>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add a transport"
        description="You'll test the connection before it can send anything."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save transport</Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Provider">
            {Object.entries(providerMeta).map(([k, v]) => (
              <button
                key={k}
                role="radio"
                aria-checked={type === k}
                onClick={() => setType(k)}
                className={cx(
                  "rounded-lg border px-3 py-2.5 text-[14px] font-medium cursor-pointer transition-[border-color,box-shadow]",
                  type === k ? "border-accent shadow-[0_0_0_1px_var(--accent)]" : "border-line hover:border-line-strong",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="-mt-1 text-[14px] text-subtle">{providerMeta[type].hint}</p>
          <Field label="Name" htmlFor="tr-name" error={err.name}>
            <Input id="tr-name" placeholder="e.g. Resend — production" value={form.name} invalid={!!err.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          {type === "RESEND" && (
            <Field label="API key" htmlFor="tr-key" error={err.key}>
              <Input id="tr-key" type="password" autoComplete="off" placeholder="re_…" value={form.key} invalid={!!err.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
            </Field>
          )}
          {type === "SES" && (
            <>
              <Field label="Access key ID" htmlFor="tr-ak" error={err.key}>
                <Input id="tr-ak" autoComplete="off" value={form.key} invalid={!!err.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
              </Field>
              <Field label="Secret access key" htmlFor="tr-sk">
                <Input id="tr-sk" type="password" autoComplete="off" value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} />
              </Field>
              <Field label="Region" htmlFor="tr-rg">
                <Select id="tr-rg" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                  {["ap-south-1", "us-east-1", "eu-west-1"].map((r) => <option key={r}>{r}</option>)}
                </Select>
              </Field>
            </>
          )}
          {type === "SMTP" && (
            <>
              <div className="grid grid-cols-[1fr_96px] gap-3">
                <Field label="Host" htmlFor="tr-host" error={err.host}>
                  <Input id="tr-host" placeholder="smtp.example.com" value={form.host} invalid={!!err.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
                </Field>
                <Field label="Port" htmlFor="tr-port">
                  <Input id="tr-port" inputMode="numeric" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Username" htmlFor="tr-user">
                  <Input id="tr-user" autoComplete="off" value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} />
                </Field>
                <Field label="Password" htmlFor="tr-pass">
                  <Input id="tr-pass" type="password" autoComplete="off" value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} />
                </Field>
              </div>
            </>
          )}
          <p className="flex items-center gap-2 text-[14px] text-subtle">
            <Icon.Shield size={14} /> Encrypted before it’s stored. You won’t be able to view it again.
          </p>
        </div>
      </Dialog>
    </>
  );
}

function Domains() {
  return (
    <section>
      <div className="mb-2 border-b-2 border-line-strong pb-6">
        <h2 className="display text-[28px]">Sending domains</h2>
        <p className="mt-2 max-w-xl text-[16px] text-muted">Verify domains in your provider’s dashboard (SPF, DKIM, DMARC). In-app verification is coming.</p>
      </div>
      <div className="divide-y divide-line">
        {seedDomains.map((d) => (
          <Row
            key={d.id}
            icon={<Icon.Globe size={17} />}
            title={d.name}
            meta={`via ${byId(seedTransports, d.transportId).name}`}
            right={!d.verified && <Button variant="secondary" size="sm">Check again</Button>}
          >
            <StatusBadge status={d.verified ? "VERIFIED" : "UNVERIFIED"} />
          </Row>
        ))}
      </div>
    </section>
  );
}

function Senders({ toast }) {
  const [items, setItems] = useState(seedSenders);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ displayName: "", local: "", domainId: seedDomains.find((d) => d.verified).id, replyTo: "" });
  const [err, setErr] = useState({});
  const verified = seedDomains.filter((d) => d.verified);

  const save = () => {
    const e = {};
    if (!form.displayName.trim()) e.displayName = "Recipients see this name in their inbox";
    if (!/^[a-z0-9._+-]+$/i.test(form.local)) e.local = "Use letters, numbers, dots or dashes";
    if (form.replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.replyTo)) e.replyTo = "Enter a valid email";
    setErr(e);
    if (Object.keys(e).length) return;
    const d = byId(seedDomains, form.domainId);
    setItems((xs) => [...xs, { id: `sd_${xs.length + 1}`, displayName: form.displayName, fromEmail: `${form.local}@${d.name}`, replyTo: form.replyTo, domainId: d.id, isDefault: false }]);
    setOpen(false);
    toast("Sender added");
  };

  return (
    <>
      <section>
        <div className="mb-2 flex items-end justify-between gap-6 border-b-2 border-line-strong pb-6">
          <div>
            <h2 className="display text-[28px]">Sender identities</h2>
            <p className="mt-2 max-w-xl text-[16px] text-muted">The name and address recipients see. Only verified domains are allowed.</p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}><Icon.Plus size={14} /> Add</Button>
        </div>
        <div className="divide-y divide-line">
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
        onClose={() => setOpen(false)}
        title="Add a sender"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Add sender</Button>
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
                {seedDomains.map((d) => (
                  <option key={d.id} value={d.id} disabled={!d.verified}>{d.name}{d.verified ? "" : " (not verified)"}</option>
                ))}
              </Select>
            </div>
          </Field>
          <Field label="Reply-to" htmlFor="sd-reply" optional error={err.replyTo}>
            <Input id="sd-reply" type="email" placeholder={`team@${verified[0].name}`} value={form.replyTo} invalid={!!err.replyTo} onChange={(e) => setForm({ ...form, replyTo: e.target.value })} />
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
  // Deep-linkable tabs: /settings?tab=senders
  const tab = tabs.some((x) => x.value === params.get("tab")) ? params.get("tab") : "transports";
  const change = (t) => router.replace(`/settings?tab=${t}`, { scroll: false });

  return (
    <>
      <PageHeader title="Settings" description="Configure how mail leaves Patra and who it comes from." />
      <div className="mb-10">
        <Segmented label="Settings sections" value={tab} onChange={change} options={tabs} />
      </div>
      <div className="animate-fade-up" key={tab}>
        {tab === "transports" && <Transports toast={setToast} />}
        {tab === "domains" && <Domains />}
        {tab === "senders" && <Senders toast={setToast} />}
      </div>
      <Toast message={toast} onDone={() => setToast("")} />
    </>
  );
}
