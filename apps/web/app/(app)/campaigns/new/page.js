"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Button, Card, Dialog, Field, Input, PageHeader, cx, fmt } from "@/components/ui";
import { byId, contacts, domains, lists, senders, templates } from "@/lib/mock";

// Open, numbered section — the reference's big "03 / 04 / 05" numerals.
function Step({ n, title, description, done, children }) {
  return (
    <section className="border-t-2 border-line-strong pt-8">
      <div className="flex gap-6 sm:gap-10">
        <span
          className={cx("display tabular w-14 shrink-0 text-[44px] transition-colors sm:w-20 sm:text-[56px]", done ? "text-accent" : "text-surface-3")}
          aria-hidden="true"
        >
          {String(n).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-3 font-display text-[24px] font-bold tracking-[-0.02em]">
            {title}
            {done && <Icon.Check size={20} className="text-success" />}
          </h2>
          {description && <p className="mt-1 text-[16px] text-muted">{description}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Choice({ name, checked, onChange, title, meta, right, disabled }) {
  return (
    <label
      className={cx(
        "flex items-center gap-4 border-2 px-5 py-4 transition-[border-color,background-color] duration-150",
        disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer",
        checked ? "border-line-strong bg-surface" : "border-line hover:border-subtle",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} disabled={disabled} className="sr-only" />
      <span className={cx("grid h-5 w-5 shrink-0 place-items-center border-2", checked ? "border-line-strong" : "border-line")} aria-hidden="true">
        {checked && <span className="h-2.5 w-2.5 bg-accent" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[17px] font-semibold">{title}</span>
        {meta && <span className="mt-0.5 block truncate text-[15px] text-subtle">{meta}</span>}
      </span>
      {right}
    </label>
  );
}

export default function NewCampaign() {
  const router = useRouter();
  const published = templates.filter((t) => t.status === "PUBLISHED");
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState(null);
  const [senderId, setSenderId] = useState(senders.find((s) => s.isDefault)?.id ?? null);
  const [listId, setListId] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  const t = templateId && byId(templates, templateId);
  const s = senderId && byId(senders, senderId);
  const l = listId && byId(lists, listId);

  // Estimate mirrors the PRD: audience minus suppressions, flag missing required variables.
  const estimate = useMemo(() => {
    if (!l) return null;
    const ratio = contacts.filter((c) => c.suppressed).length / contacts.length;
    const suppressed = Math.round(l.count * ratio);
    const missing = Math.round(l.count * 0.007);
    return { audience: l.count, suppressed, missing, final: l.count - suppressed - missing };
  }, [l]);

  const ready = name.trim() && t && s && l;

  return (
    <>
      <PageHeader
        back={{ href: "/campaigns", label: "Campaigns" }}
        title="New campaign"
        description="Pick what to send, who it's from, and who gets it. Nothing goes out until you confirm."
      />

      <div className="grid items-start gap-16 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-14">
          <div className="max-w-xl">
            <Field label="Campaign name" htmlFor="cname" hint="Only you see this. Recipients see the template's subject line.">
              <Input
                id="cname"
                autoFocus
                placeholder="e.g. Pass confirmations — wave 3"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          </div>

          <Step n={1} title="Template" description="Only published templates can be sent. The campaign pins the current version." done={!!t}>
            <div className="flex flex-col gap-3">
              {published.map((tp) => (
                <Choice
                  key={tp.id}
                  name="template"
                  checked={templateId === tp.id}
                  onChange={() => setTemplateId(tp.id)}
                  title={tp.name}
                  meta={tp.subject}
                  right={<span className="label text-subtle">v{tp.latestVersion}</span>}
                />
              ))}
              <Link href="/templates" className="label mt-2 inline-flex items-center gap-1.5 self-start text-muted hover:text-fg">
                <Icon.Plus size={13} /> Design a new template
              </Link>
            </div>
          </Step>

          <Step n={2} title="Sender" description="Senders must be on a domain verified with your transport." done={!!s}>
            <div className="flex flex-col gap-3">
              {senders.map((sd) => {
                const d = byId(domains, sd.domainId);
                return (
                  <Choice
                    key={sd.id}
                    name="sender"
                    checked={senderId === sd.id}
                    onChange={() => setSenderId(sd.id)}
                    disabled={!d.verified}
                    title={`${sd.displayName} <${sd.fromEmail}>`}
                    meta={sd.replyTo ? `Replies go to ${sd.replyTo}` : "Replies go to the From address"}
                    right={sd.isDefault && <span className="label text-subtle">Default</span>}
                  />
                );
              })}
            </div>
          </Step>

          <Step n={3} title="Audience" description="Suppressed addresses are always excluded." done={!!l}>
            <div className="grid gap-3 sm:grid-cols-3">
              {lists.map((ls) => (
                <Choice
                  key={ls.id}
                  name="list"
                  checked={listId === ls.id}
                  onChange={() => setListId(ls.id)}
                  title={ls.name}
                  meta={`${fmt.n(ls.count)} contacts`}
                />
              ))}
            </div>
          </Step>
        </div>

        {/* Sticky summary: an ink block, so the decision and its consequence stay in view */}
        <aside className="lg:sticky lg:top-28">
          <Card tone="ink" className="p-8">
            <div className="label text-[#8f8a7f]">Will be sent to</div>
            <div className="display tabular mt-3 text-[64px] text-[#f1eee5]">{estimate ? fmt.n(estimate.final) : "—"}</div>
            {estimate ? (
              <ul className="mt-4 flex flex-col gap-2 text-[15px] text-[#bdb8ac]">
                <li className="flex justify-between"><span>In audience</span><span className="tabular font-mono">{fmt.n(estimate.audience)}</span></li>
                <li className="flex justify-between"><span>Suppressed</span><span className="tabular font-mono">−{fmt.n(estimate.suppressed)}</span></li>
                <li className="flex justify-between text-[#f2b54a]">
                  <span className="inline-flex items-center gap-1.5"><Icon.Alert size={14} /> Missing name</span>
                  <span className="tabular font-mono">−{fmt.n(estimate.missing)}</span>
                </li>
              </ul>
            ) : (
              <p className="mt-4 text-[15px] text-[#8f8a7f]">Choose an audience to see the estimate.</p>
            )}

            <dl className="mt-8 flex flex-col gap-4 border-t border-[#2a2926] pt-6">
              {[
                ["Template", t ? `${t.name} · v${t.latestVersion}` : null],
                ["From", s ? s.fromEmail : null],
                ["Audience", l ? l.name : null],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label text-[#8f8a7f]">{k}</dt>
                  <dd className={cx("mt-1 truncate text-[16px]", v ? "text-[#f1eee5]" : "text-[#6f6a60]")}>{v ?? "Not chosen"}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-col gap-3">
              <Button variant="accent" size="lg" disabled={!ready} onClick={() => setConfirm(true)} className="w-full">
                <Icon.Send size={16} /> Review and send
              </Button>
              <button
                onClick={() => router.push("/campaigns")}
                className="h-11 font-mono text-[13px] font-bold uppercase tracking-[0.1em] text-[#bdb8ac] hover:text-[#f1eee5] cursor-pointer transition-colors"
              >
                Save as draft
              </button>
              {!ready && (
                <p className="text-center text-[14px] text-[#8f8a7f]">
                  {!name.trim() ? "Name the campaign" : !t ? "Choose a template" : !s ? "Choose a sender" : "Choose an audience"} to continue
                </p>
              )}
            </div>
          </Card>
        </aside>
      </div>

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Send to ${estimate ? fmt.n(estimate.final) : ""} people?`}
        description="Sending starts right away and can be paused, but sent emails can't be recalled."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button
              loading={sending}
              onClick={() => {
                setSending(true);
                setTimeout(() => router.push("/campaigns/cp_1"), 700);
              }}
            >
              Send now
            </Button>
          </>
        }
      >
        <div className="border-2 border-line p-5 text-[16px]">
          <div className="font-medium">{t?.subject}</div>
          <div className="text-subtle">From {s?.displayName} &lt;{s?.fromEmail}&gt;</div>
        </div>
        {estimate?.missing > 0 && (
          <p className="mt-3 flex items-start gap-2 text-[14px] text-warning">
            <Icon.Alert size={14} className="mt-0.5 shrink-0" />
            {fmt.n(estimate.missing)} contacts have no name and will be marked Skipped instead of getting a blank greeting.
          </p>
        )}
      </Dialog>
    </>
  );
}
