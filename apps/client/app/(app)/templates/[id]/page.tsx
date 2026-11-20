"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BlockView, EmailPaper, sampleData } from "@/components/EmailRender";
import { Icon } from "@/components/icons";
import {
  Badge,
  Button,
  Dialog,
  Field,
  Input,
  Kbd,
  Segmented,
  Select,
  StatusBadge,
  Textarea,
  Toast,
  cx,
} from "@/components/ui";
import { byId, me, senders, templates, variables } from "@/lib/mock";

import { api } from "@/lib/api";
import { draftContent, templateRequest, uploadTemplateImage, useTemplateWorkspace } from "@/lib/template-api";
import { readDrafts, saveDraft } from "@/lib/template-drafts";

const palette = [
  { type: "text", label: "Text", icon: Icon.Type, make: () => ({ text: "Write something clear and kind.", size: 15, weight: 400 }) },
  { type: "image", label: "Image", icon: Icon.Image, make: () => ({ src: "", alt: "Describe this image", height: 180 }) },
  { type: "button", label: "Button", icon: Icon.Button, make: () => ({ label: "Call to action", href: "https://example.com", color: "#1c1917" }) },
  { type: "divider", label: "Divider", icon: Icon.Divider, make: () => ({}) },
  { type: "spacer", label: "Spacer", icon: Icon.Spacer, make: () => ({ height: 24 }) },
];

const newId = () => crypto.randomUUID();
const usedVars = (t) =>
  [...new Set([t.subject, t.previewText, ...t.blocks.map((b) => b.text ?? b.label ?? b.alt ?? "")].join(" ").match(/\{\{\s*\w+\s*\}\}/g) ?? [])].map((v) =>
    v.replace(/[{}\s]/g, ""),
  );

function isPublicHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

/* ---------- Side panels ---------- */

function PanelSection({ title, children, action }) {
  return (
    <section className="border-b border-line px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-subtle">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function AlignPicker({ value, onChange }) {
  return (
    <Segmented
      label="Alignment"
      size="sm"
      value={value ?? "left"}
      onChange={onChange}
      options={[
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" },
      ]}
    />
  );
}

function ColorField({ label, value, onChange, id }) {
  return (
    <Field label={label} htmlFor={id}>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-surface p-1"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-[14px]" aria-label={`${label} hex`} />
      </div>
    </Field>
  );
}

function Properties({ block, page, onBlock, onPage, insertVar, textRef, upload, variableOptions = variables }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  if (!block) {
    return (
      <>
        <PanelSection title="Page">
          <div className="flex flex-col gap-4">
            <ColorField id="pg-bg" label="Background" value={page.bg} onChange={(v) => onPage({ bg: v })} />
            <ColorField id="pg-text" label="Text color" value={page.text} onChange={(v) => onPage({ text: v })} />
            <Field label="Body width" htmlFor="pg-w" hint="600px is safest across email clients.">
              <div className="flex items-center gap-3">
                <input
                  id="pg-w"
                  type="range"
                  min={480}
                  max={720}
                  step={20}
                  value={page.width}
                  onChange={(e) => onPage({ width: +e.target.value })}
                  className="flex-1 accent-[var(--accent)] cursor-pointer"
                />
                <span className="tabular w-12 text-right text-[14px] text-muted">{page.width}px</span>
              </div>
            </Field>
            <Field label="Default alignment">
              <AlignPicker value={page.align} onChange={(v) => onPage({ align: v })} />
            </Field>
          </div>
        </PanelSection>
        <div className="px-4 py-4 text-[14px] text-subtle">
          <p className="flex items-start gap-2">
            <Icon.Info size={14} className="mt-0.5 shrink-0" />
            Select a block on the canvas to edit it. Publishing generates a plain-text version.
          </p>
        </div>
      </>
    );
  }

  const set = (patch) => onBlock(block.id, patch);
  return (
    <PanelSection title={`${block.type[0].toUpperCase()}${block.type.slice(1)} block`}>
      <div className="flex flex-col gap-4">
        {block.type === "text" && (
          <>
            <Field label="Text" htmlFor="bk-text" hint="Type {{ or use the variable list to personalise.">
              <Textarea id="bk-text" ref={textRef} value={block.text} onChange={(e) => set({ text: e.target.value })} rows={5} />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {variableOptions.map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVar(v.key)}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-line px-2 font-mono text-[13px] text-muted hover:border-accent hover:text-accent-ink cursor-pointer transition-colors"
                >
                  <Icon.Plus size={11} />
                  {v.key}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Size" htmlFor="bk-size">
                <Select id="bk-size" value={block.size} onChange={(e) => set({ size: +e.target.value })}>
                  {[...new Set([13, 15, 16, 17, 20, 22, 28, 30, block.size])].sort((a, b) => a - b).map((s) => (
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </Select>
              </Field>
              <Field label="Weight" htmlFor="bk-weight">
                <Select id="bk-weight" value={block.weight} onChange={(e) => set({ weight: +e.target.value })}>
                  <option value={400}>Regular</option>
                  <option value={500}>Medium</option>
                  <option value={600}>Semibold</option>
                  <option value={700}>Bold</option>
                </Select>
              </Field>
            </div>
            <Field label="Alignment"><AlignPicker value={block.align} onChange={(v) => set({ align: v })} /></Field>
          </>
        )}
        {block.type === "button" && (
          <>
            <Field label="Label" htmlFor="bk-label"><Input id="bk-label" value={block.label} onChange={(e) => set({ label: e.target.value })} /></Field>
            <Field label="Link" htmlFor="bk-href" error={!isPublicHttpUrl(block.href) ? "Enter a full HTTP or HTTPS URL, like https://example.com" : null}>
              <Input id="bk-href" type="url" value={block.href} onChange={(e) => set({ href: e.target.value })} invalid={!isPublicHttpUrl(block.href)} />
            </Field>
            <ColorField id="bk-color" label="Button color" value={block.color ?? "#1c1917"} onChange={(v) => set({ color: v })} />
            <Field label="Alignment"><AlignPicker value={block.align} onChange={(v) => set({ align: v })} /></Field>
          </>
        )}
        {block.type === "image" && (
          <>
            {upload ? (
              <Field label="Upload image" htmlFor="bk-image" hint="PNG or JPEG, up to 2 MB" error={uploadError}>
                <Input id="bk-image" type="file" accept="image/png,image/jpeg" disabled={uploading}
                  onChange={async (event) => {
                    const input = event.currentTarget;
                    const file = input.files?.[0];
                    if (!file) return;
                    setUploadError("");
                    setUploading(true);
                    try { set({ src: await upload(file) }); }
                    catch (error) { setUploadError(error.message); }
                    finally { setUploading(false); input.value = ""; }
                  }} />
                {uploading && <p role="status">Uploading image…</p>}
              </Field>
            ) : <p className="text-sm text-muted">Save to a workspace to upload images.</p>}
            <Field label="Image URL" htmlFor="bk-src" hint="Use a public HTTP or HTTPS image URL, or upload an image above."
              error={!isPublicHttpUrl(block.src) ? "Add a public HTTP or HTTPS image URL before publishing." : null}>
              <Input id="bk-src" type="url" placeholder="https://example.com/image.png" value={block.src} onChange={(e) => set({ src: e.target.value })} invalid={!isPublicHttpUrl(block.src)} />
            </Field>
            <Field label="Alt text" htmlFor="bk-alt" hint="Shown when images are blocked, and read by screen readers.">
              <Input id="bk-alt" value={block.alt} onChange={(e) => set({ alt: e.target.value })} />
            </Field>
            <Field label="Height" htmlFor="bk-h">
              <div className="flex items-center gap-3">
                <input id="bk-h" type="range" min={80} max={320} step={10} value={block.height} onChange={(e) => set({ height: +e.target.value })} className="flex-1 accent-[var(--accent)] cursor-pointer" />
                <span className="tabular w-12 text-right text-[14px] text-muted">{block.height}px</span>
              </div>
            </Field>
          </>
        )}
        {block.type === "spacer" && (
          <Field label="Height" htmlFor="bk-sh">
            <div className="flex items-center gap-3">
              <input id="bk-sh" type="range" min={8} max={80} step={4} value={block.height} onChange={(e) => set({ height: +e.target.value })} className="flex-1 accent-[var(--accent)] cursor-pointer" />
              <span className="tabular w-12 text-right text-[14px] text-muted">{block.height}px</span>
            </div>
          </Field>
        )}
        {block.type === "divider" && <p className="text-[14px] text-subtle">Dividers have no settings.</p>}
      </div>
    </PanelSection>
  );
}

/* ---------- Designer ---------- */

export default function Designer() {
  const { id } = useParams();
  return <DesignerRoute key={id} id={id} />;
}

function DesignerRoute({ id }) {
  if (/^[a-f0-9]{24}$/i.test(id)) return <WorkspaceEditor id={id} />;
  return <BrowserEditor id={id} />;
}

function WorkspaceEditor({ id }) {
  const { workspace, error } = useTemplateWorkspace();
  const [draft, setDraft] = useState(null);
  const [failure, setFailure] = useState(null);
  useEffect(() => {
    if (!workspace) return;
    let active = true;
    templateRequest(workspace, `/templates/${id}`).then(
      (data) => { if (active) setDraft(data); },
      (error) => { if (active) setFailure(error); },
    );
    return () => { active = false; };
  }, [workspace, id]);
  if (error || failure || workspace === null) return (
    <div className="p-6">
      <p role="alert">{(error || failure)?.message ?? "Sign in to open this workspace draft."}</p>
      <Link href={workspace ? "/templates" : "/login"} className="underline">{workspace ? "Back to templates" : "Sign in"}</Link>
    </div>
  );
  return draft ? <TemplateEditor source={draft} workspace={workspace} /> : <p className="p-6" role="status">Loading draft…</p>;
}

function BrowserEditor({ id }) {
  const [local, setLocal] = useState(undefined);
  useEffect(() => {
    if (!id.startsWith("local-")) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setLocal(readDrafts().find((draft) => draft.id === id) ?? null);
    });
    return () => { active = false; };
  }, [id]);

  const isLocal = id.startsWith("local-");
  if (isLocal && local === undefined) return <p className="p-6" role="status">Loading draft…</p>;
  const source = isLocal ? local : byId(templates, id);
  if (!source) return <div className="p-6"><p>Template not found.</p><Link className="underline" href="/templates">Back to templates</Link></div>;
  return <TemplateEditor source={source} isLocal={isLocal} />;
}

function TemplateEditor({ source, isLocal, workspace }) {
  const router = useRouter();
  const [version, setVersion] = useState(source.latestVersion);
  const [actionError, setActionError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [compiled, setCompiled] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [testOptions, setTestOptions] = useState(null);
  const [senderId, setSenderId] = useState("");
  const [testMode, setTestMode] = useState("verified");
  const [testTransportId, setTestTransportId] = useState("");
  const [audienceFields, setAudienceFields] = useState([]);
  const [fieldError, setFieldError] = useState("");
  const [campaignAudience, setCampaignAudience] = useState("");
  const testRequest = useRef(null);
  const saved = useRef({ snapshot: source, revision: source.revision });
  const pendingSave = useRef(Promise.resolve());
  const [tpl, setTpl] = useState(() => structuredClone(source));
  const initialDraft = useRef(tpl);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("edit");
  const [device, setDevice] = useState("desktop");
  const [saveState, setSaveState] = useState("saved");
  const [publishOpen, setPublishOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [dirtySincePublish, setDirtySincePublish] = useState(source.status === "DRAFT");
  const textRef = useRef(null);

  useEffect(() => {
    if (!workspace) return;
    queueMicrotask(() => setCampaignAudience(new URLSearchParams(location.search).get("listId") ?? ""));
    let active = true;
    templateRequest(workspace, "/contacts/fields").then(
      fields => { if (active) { setAudienceFields(fields); setFieldError(""); } },
      error => { if (active) setFieldError(error.message); },
    );
    return () => { active = false; };
  }, [workspace]);

  const saveWorkspaceDraft = useCallback((snapshot) => {
    const task = pendingSave.current.then(async () => {
      if (snapshot === saved.current.snapshot || (saved.current.snapshot === source && snapshot === initialDraft.current)) return saved.current.revision;
      const data = await templateRequest(workspace, `/templates/${source.id}/draft`, {
        method: "PUT", body: { draft: draftContent(snapshot), revision: saved.current.revision },
      });
      saved.current = { snapshot, revision: data.revision };
      return data.revision;
    });
    pendingSave.current = task.catch(() => {});
    return task;
  }, [workspace, source]);

  // Save starter drafts in this browser. Existing demo templates keep their simulated behavior.
  const update = useCallback((fn) => {
    setTpl((t) => fn(structuredClone(t)));
    setSaveState("saving");
    setDirtySincePublish(true);
  }, []);
  useEffect(() => {
    if (workspace || saveState !== "saving") return;
    if (isLocal) {
      let status = "saved";
      try {
        saveDraft(tpl);
      } catch {
        status = "error";
      }
      const task = setTimeout(() => setSaveState(status), 0);
      return () => clearTimeout(task);
    }
    const t = setTimeout(() => setSaveState("saved"), 700);
    return () => clearTimeout(t);
  }, [tpl, saveState, isLocal, workspace]);
  useEffect(() => {
    if (!workspace || !dirtySincePublish || tpl === initialDraft.current) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        await saveWorkspaceDraft(tpl);
        if (active) { setSaveState("saved"); setSaveError(""); }
      } catch (error) {
        if (active) { setSaveState("error"); setSaveError(error.message); }
      }
    }, 450);
    return () => { active = false; clearTimeout(timer); };
  }, [tpl, workspace, dirtySincePublish, saveWorkspaceDraft]);

  useEffect(() => {
    if (!workspace || saveState === "saved") return;
    const guard = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [workspace, saveState]);

  useEffect(() => {
    if (!workspace || mode !== "preview") return;
    let active = true;
    templateRequest(workspace, `/templates/${source.id}/preview`, { method: "POST", body: draftContent(tpl) }).then(
      (data) => { if (active) { setCompiled({ data, snapshot: tpl }); setPreviewError(""); } },
      (error) => { if (active) setPreviewError(error.message); },
    );
    return () => { active = false; };
  }, [workspace, mode, source.id, tpl]);

  const block = tpl.blocks.find((b) => b.id === selected) ?? null;
  const preview = mode === "preview";

  const addBlock = (p) => {
    const nb = { id: newId(), type: p.type, ...p.make() };
    update((t) => {
      const i = t.blocks.findIndex((b) => b.id === selected);
      t.blocks.splice(i >= 0 ? i + 1 : t.blocks.length, 0, nb);
      return t;
    });
    setSelected(nb.id);
    setMode("edit");
  };
  const move = (bid, dir) =>
    update((t) => {
      const i = t.blocks.findIndex((b) => b.id === bid);
      const j = i + dir;
      if (j < 0 || j >= t.blocks.length) return t;
      [t.blocks[i], t.blocks[j]] = [t.blocks[j], t.blocks[i]];
      return t;
    });
  const remove = (bid) => {
    update((t) => ({ ...t, blocks: t.blocks.filter((b) => b.id !== bid) }));
    setSelected(null);
    setToast("Block removed");
  };
  const duplicate = (bid) => {
    const nid = newId();
    update((t) => {
      const i = t.blocks.findIndex((b) => b.id === bid);
      t.blocks.splice(i + 1, 0, { ...t.blocks[i], id: nid });
      return t;
    });
    setSelected(nid);
  };
  const insertVar = (key) => {
    const el = textRef.current;
    if (!block || block.type !== "text") return;
    const pos = el?.selectionStart ?? block.text.length;
    const text = block.text.slice(0, pos) + `{{${key}}}` + block.text.slice(pos);
    update((t) => {
      t.blocks.find((b) => b.id === block.id).text = text;
      return t;
    });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(pos + key.length + 4, pos + key.length + 4);
    });
  };

  // Keyboard: Esc deselects, Delete removes, ⌘S confirms save, ⌘↑/↓ reorders.
  useEffect(() => {
    const onKey = (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (workspace) {
          setSaveState("saving");
          saveWorkspaceDraft(tpl).then(
            () => { setSaveState("saved"); setSaveError(""); },
            (error) => { setSaveState("error"); setSaveError(error.message); },
          );
        } else if (isLocal) {
          setSaveState("saving");
        } else {
          setSaveState("saved");
          setToast("Draft saved");
        }
        return;
      }
      if (typing || !selected) return;
      if (e.key === "Escape") setSelected(null);
      if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); remove(selected); }
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowUp") { e.preventDefault(); move(selected, -1); }
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowDown") { e.preventDefault(); move(selected, 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, isLocal, workspace, saveWorkspaceDraft, tpl]);

  const vars = usedVars(tpl);
  const variableOptions = [...variables, ...audienceFields.filter(key => !variables.some(v => v.key === key)).map(key => ({ key, required: true }))];
  const invalidMediaBlocks = tpl.blocks.filter((item) =>
    (item.type === "button" && !isPublicHttpUrl(item.href)) ||
    (item.type === "image" && !isPublicHttpUrl(item.src)),
  );
  const sender = senders.find((s) => s.isDefault);

  async function leaveEditor() {
    try {
      await saveWorkspaceDraft(tpl);
      router.push("/templates");
    } catch (error) {
      setSaveState("error");
      setSaveError(error.message);
    }
  }

  async function openTest() {
    setActionError("");
    setTestOpen(true);
    if (!workspace) return;
    setTestOptions(null);
    setSenderId("");
    try {
      const [{ data: user }, senders, transports] = await Promise.all([
        api("/auth/me"),
        templateRequest(workspace, "/senders"),
        templateRequest(workspace, "/transports"),
      ]);
      const resendTransports = transports.filter((transport) => transport.type === "RESEND");
      setTestOptions({ recipient: user.email, senders, transports: resendTransports });
      setSenderId(senders.find((sender) => sender.isDefault)?.id ?? senders[0]?.id ?? "");
      setTestMode(senders.length ? "verified" : "sandbox");
      setTestTransportId(resendTransports[0]?.id ?? resendTransports[0]?._id ?? "");
    } catch (error) { setActionError(error.message); }
  }

  async function runAction(action) {
    if (action === "publish" && invalidMediaBlocks.length) {
      setActionError(`Add a valid URL for ${invalidMediaBlocks.length === 1 ? "the incomplete button or image" : "each incomplete button and image"} before publishing.`);
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      const revision = await saveWorkspaceDraft(tpl);
      setSaveState("saved");
      setSaveError("");
      let body = { revision };
      if (action === "test-send") {
        const key = `${revision}/${testMode}/${testMode === "sandbox" ? testTransportId : senderId}`;
        if (testRequest.current?.key !== key) testRequest.current = { key, id: crypto.randomUUID() };
        body = { revision, requestId: testRequest.current.id, ...(testMode === "sandbox"
          ? { mode: "sandbox", transportId: testTransportId }
          : { senderId }) };
      }
      const result = await templateRequest(workspace, `/templates/${source.id}/${action}`, { method: "POST", body });
      if (action === "publish") {
        setVersion(result.version);
        setDirtySincePublish(false);
        setPublishOpen(false);
        setToast(`Version ${result.version} published`);
      } else {
        testRequest.current = null;
        setTestOpen(false);
        setToast(`Resend accepted the test for ${result.recipient}`);
      }
    } catch (error) { setActionError(error.message); }
    finally { setBusy(false); }
  }

  async function copyToWorkspace() {
    setBusy(true);
    try {
      const { data: orgs } = await api("/orgs");
      if (!orgs.length) throw new Error("Your account has no organization.");
      const org = orgs[0];
      const draft = await templateRequest({ org }, "/templates", { method: "POST", body: draftContent(tpl) });
      router.push(`/templates/${draft.id}?org=${org.id}`);
    } catch (error) { setSaveError(error.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-3">
        <Button variant="ghost" size="icon-sm" href={workspace ? undefined : "/templates"} onClick={workspace ? leaveEditor : undefined} aria-label="Back to templates">
          <Icon.ChevronLeft size={17} />
        </Button>
        <div className="flex min-w-0 items-center gap-2.5">
          <input
            value={tpl.name}
            onChange={(e) => update((t) => ({ ...t, name: e.target.value }))}
            aria-label="Template name"
            className="min-w-0 max-w-[260px] truncate rounded-md bg-transparent px-1.5 py-1 text-[16px] font-semibold hover:bg-surface-2 focus:bg-surface-2 focus:outline-none"
          />
          <StatusBadge status={dirtySincePublish ? "DRAFT" : "PUBLISHED"} />
          <span className="hidden items-center gap-1.5 text-[14px] text-subtle md:flex" aria-live="polite">
            {saveState === "saving" ? (
              <><Icon.Loader size={12} /> Saving…</>
            ) : saveState === "error" ? (
              <>Couldn’t save draft</>
            ) : (
              <><Icon.Check size={13} /> {isLocal ? "Saved on this browser" : "Draft saved"}</>
            )}
          </span>
        </div>

        <div className="mx-auto">
          <Segmented
            label="Mode"
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: "edit", label: "Edit" },
              { value: "preview", label: "Preview", icon: <Icon.Eye size={13} /> },
            ]}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <Segmented
              label="Device"
              size="sm"
              value={device}
              onChange={setDevice}
              options={[
                { value: "desktop", label: <span className="sr-only">Desktop</span>, icon: <Icon.Monitor size={14} /> },
                { value: "mobile", label: <span className="sr-only">Mobile</span>, icon: <Icon.Phone size={14} /> },
              ]}
            />
          </div>
          {isLocal && <Button size="sm" loading={busy} onClick={copyToWorkspace}>Save to workspace</Button>}
          {!isLocal && <><Button variant="secondary" size="sm" aria-label="Send test email" onClick={openTest}>
            <Icon.Mail size={14} /> <span className="hidden sm:inline">Send test</span>
          </Button>
          <Button size="sm" onClick={() => { setActionError(""); setPublishOpen(true); }} disabled={!dirtySincePublish}>
            {dirtySincePublish ? "Publish" : version ? `Published v${version}` : "Published"}
          </Button>
          {workspace && version > 0 && !dirtySincePublish && <Button size="sm" variant="secondary" href={`/campaigns/new?org=${workspace.org.id}&templateId=${source.id}${campaignAudience ? `&listId=${encodeURIComponent(campaignAudience)}` : ""}`}>Create campaign</Button>}</>}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left: blocks + variables */}
        <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-line bg-surface lg:block" aria-label="Blocks">
          <PanelSection title="Add block">
            <div className="grid grid-cols-2 gap-2">
              {palette.map((p) => (
                <button
                  key={p.type}
                  onClick={() => addBlock(p)}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-line py-3 text-[14px] font-medium text-muted transition-[border-color,color,background-color] duration-150 hover:border-line-strong hover:bg-surface-2 hover:text-fg cursor-pointer"
                >
                  <p.icon size={18} />
                  {p.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-subtle">New blocks go below the selected one.</p>
          </PanelSection>
          <PanelSection title="Variables" action={<Icon.Braces size={14} className="text-subtle" />}>
            <ul className="flex flex-col gap-1.5">
              {variableOptions.map((v) => (
                <li key={v.key} className="flex items-center justify-between text-[14px]">
                  <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[13px]">{`{{${v.key}}}`}</code>
                  {vars.includes(v.key) ? <Badge tone="warning">Required</Badge> : <span className="text-subtle">Available</span>}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] leading-relaxed text-subtle">
              Use a CSV column as a merge field, for example {"{{department}}"}. Every field used in the email is required; recipients missing a value are skipped.
            </p>
            {fieldError && <p role="alert" className="mt-2 text-sm text-danger">Could not load audience fields: {fieldError}</p>}
          </PanelSection>
          <div className="px-4 py-4 text-[13px] text-subtle">
            <div className="mb-2 font-medium text-muted">Shortcuts</div>
            <ul className="flex flex-col gap-1.5">
              <li className="flex justify-between">Save <span><Kbd>⌘</Kbd> <Kbd>S</Kbd></span></li>
              <li className="flex justify-between">Move block <span><Kbd>⌘</Kbd> <Kbd>↑</Kbd><Kbd>↓</Kbd></span></li>
              <li className="flex justify-between">Delete block <Kbd>⌫</Kbd></li>
              <li className="flex justify-between">Deselect <Kbd>Esc</Kbd></li>
            </ul>
          </div>
        </aside>

        {/* Center: envelope + canvas */}
        <main className="min-w-0 flex-1 overflow-y-auto" onClick={() => setSelected(null)}>
          <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-4 py-6">
            <div className="flex flex-wrap gap-2 lg:hidden">
              {!preview && palette.map((item) => (
                <Button key={item.type} variant="secondary" size="sm" onClick={(event) => { event.stopPropagation(); addBlock(item); }}>
                  <item.icon size={14} /> {item.label}
                </Button>
              ))}
            </div>
            {(saveError || saveState === "error") && <p role="alert" className="text-danger">{saveError || "Couldn’t save this draft in your browser."}</p>}
            <div className="rounded-xl border border-line bg-surface" onClick={(e) => e.stopPropagation()}>
              {[
                ["From", isLocal || workspace ? <span key="f" className="text-subtle">Choose a sender when sending</span> : <span key="f" className="text-[15px]">{sender.displayName} <span className="text-subtle">&lt;{sender.fromEmail}&gt;</span></span>],
                ["Subject", <input key="s" aria-label="Subject" value={tpl.subject} onChange={(e) => update((t) => ({ ...t, subject: e.target.value }))} className="w-full bg-transparent text-[15px] font-medium focus:outline-none" />],
                ["Preview", <input key="p" aria-label="Preview text" value={tpl.previewText} placeholder="Shown after the subject in most inboxes" onChange={(e) => update((t) => ({ ...t, previewText: e.target.value }))} className="w-full bg-transparent text-[15px] text-muted placeholder:text-subtle focus:outline-none" />],
              ].map(([k, v], i) => (
                <div key={k} className={cx("flex items-center gap-4 px-4 py-2.5 focus-within:bg-surface-2/60", i && "border-t border-line")}>
                  <span className="w-16 shrink-0 text-[14px] text-subtle">{k}</span>
                  <div className="min-w-0 flex-1">{v}</div>
                </div>
              ))}
            </div>

            {workspace && preview ? (
              previewError ? <p role="alert" className="text-danger">{previewError}</p> :
              compiled?.snapshot === tpl ? (
                <div className="mx-auto w-full" style={{ maxWidth: device === "mobile" ? 390 : 760 }}>
                  <p className="mb-3 font-semibold">{compiled.data.subject}</p>
                  <iframe title="Rendered email preview" sandbox="" srcDoc={compiled.data.html} className="h-[60dvh] w-full rounded-xl border border-line bg-white" />
                  <details className="mt-4 rounded-lg border border-line p-3">
                    <summary className="cursor-pointer font-medium">Plain-text version</summary>
                    <pre className="mt-3 whitespace-pre-wrap break-words text-sm">{compiled.data.text}</pre>
                  </details>
                </div>
              ) : <p role="status">Rendering preview…</p>
            ) : <>
            <div
              className="overflow-hidden rounded-xl border border-line transition-[max-width] duration-300 mx-auto w-full"
              style={{ maxWidth: device === "mobile" ? 390 : "100%" }}
            >
              <EmailPaper template={tpl} width={device === "mobile" ? 390 : tpl.page.width}>
                {tpl.blocks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[#d6d3d1] py-12 text-center text-[14px] text-[#78716c]">
                    Add your first block from the left panel.
                  </div>
                )}
                {tpl.blocks.map((b, i) => {
                  const isSel = selected === b.id && !preview;
                  return (
                    <div
                      key={b.id}
                      role={preview ? undefined : "button"}
                      tabIndex={preview ? undefined : 0}
                      aria-label={preview ? undefined : `${b.type} block${isSel ? ", selected" : ""}`}
                      aria-pressed={preview ? undefined : isSel}
                      onClick={(e) => {
                        if (preview) return;
                        e.stopPropagation();
                        setSelected(b.id);
                      }}
                      onKeyDown={(e) => {
                        if (!preview && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setSelected(b.id);
                        }
                      }}
                      className={cx(
                        "group relative -mx-3 rounded-md px-3 py-1.5",
                        !preview && "cursor-pointer outline outline-1 outline-transparent transition-[outline-color] duration-100 hover:outline-[#d6d3d1]",
                        isSel && "outline-2 !outline-[#0755B5] ring-2 ring-[#0755B5]",
                      )}
                    >
                      <BlockView block={b} page={tpl.page} preview={preview} />
                      {isSel && (
                        <div
                          className="absolute -top-3.5 right-2 z-10 flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5 text-fg animate-pop-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {[
                            ["Move up", Icon.ArrowUp, () => move(b.id, -1), i === 0],
                            ["Move down", Icon.ArrowDown, () => move(b.id, 1), i === tpl.blocks.length - 1],
                            ["Duplicate", Icon.Copy, () => duplicate(b.id)],
                            ["Delete", Icon.Trash, () => remove(b.id)],
                          ].map(([label, I, fn, disabled]) => (
                            <button
                              key={label}
                              onClick={fn}
                              disabled={disabled}
                              aria-label={label}
                              title={label}
                              className={cx(
                                "grid h-7 w-7 place-items-center rounded-md cursor-pointer transition-colors disabled:cursor-default disabled:opacity-35",
                                label === "Delete" ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-surface-2",
                              )}
                            >
                              <I size={14} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </EmailPaper>
            </div>
            {preview && (
              <p className="text-center text-[14px] text-subtle">
                Previewing with sample data for {sampleData.name}. Variables are HTML-escaped when sent.
              </p>
            )}
            </>}

          </div>
        </main>

        {/* Right: properties */}
        <aside className={cx(
          "shrink-0 overflow-y-auto border-t border-line bg-surface lg:max-h-none lg:w-[300px] lg:border-l lg:border-t-0",
          block && !preview ? "max-h-[36dvh]" : "hidden lg:block",
        )} aria-label="Properties">
          <Properties
            key={block?.id ?? "page"}
            block={block}
            upload={workspace ? (file) => uploadTemplateImage(workspace, file) : null}
            page={tpl.page}
            textRef={textRef}
            insertVar={insertVar}
            variableOptions={variableOptions}
            onBlock={(bid, patch) =>
              update((t) => {
                const target = t.blocks.find((b) => b.id === bid);
                if (target) Object.assign(target, patch);
                return t;
              })
            }
            onPage={(patch) => update((t) => ({ ...t, page: { ...t.page, ...patch } }))}
          />
        </aside>
      </div>

      <Dialog
        open={publishOpen}
        onClose={() => { if (!busy) setPublishOpen(false); }}
        title={`Publish version ${version + 1}?`}
        description="Publishing creates a locked version that campaigns can use. Campaigns already queued keep the version they pinned."
        footer={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setPublishOpen(false)}>Keep editing</Button>
            <Button
              loading={busy}
              disabled={invalidMediaBlocks.length > 0}
              onClick={() => {
                if (workspace) { runAction("publish"); return; }
                setBusy(true);
                setTimeout(() => {
                  setBusy(false);
                  setPublishOpen(false);
                  setDirtySincePublish(false);
                  setToast(`Version ${source.latestVersion + 1} published`);
                }, 600);
              }}
            >
              Publish
            </Button>
          </>
        }
      >
        <ul className="flex flex-col gap-2.5 text-[14px]">
          <li className="flex items-center gap-2"><Icon.CheckCircle size={16} className="text-success" /> Subject and {tpl.blocks.length} blocks</li>
          <li className="flex items-center gap-2"><Icon.CheckCircle size={16} className="text-success" /> Plain-text version generated</li>
          {invalidMediaBlocks.length > 0 && <li role="alert" className="flex items-start gap-2 text-danger"><Icon.Alert size={16} className="mt-0.5 shrink-0" /> {invalidMediaBlocks.length} {invalidMediaBlocks.length === 1 ? "button or image needs" : "buttons or images need"} a valid public HTTP or HTTPS URL. Select the block to fix it, or remove it.</li>}
          {actionError && <li role="alert" className="text-danger">{actionError}</li>}
          <li className="flex items-start gap-2">
            <><Icon.CheckCircle size={16} className="mt-0.5 text-success" /> Required fields: {vars.length ? vars.map((v) => `{{${v}}}`).join(", ") : "none"}. Missing values are skipped at send time.</>
          </li>
        </ul>
      </Dialog>

      <Dialog
        open={testOpen}
        onClose={() => { if (!busy) setTestOpen(false); }}
        title="Send a test email"
        description="Test sends use sample data and only go to your own address."
        footer={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setTestOpen(false)}>Cancel</Button>
            <Button
              loading={busy}
              disabled={workspace && (!testOptions || !(testMode === "sandbox" ? testTransportId : senderId))}
              onClick={() => {
                if (workspace) { runAction("test-send"); return; }
                setBusy(true);
                setTimeout(() => {
                  setBusy(false);
                  setTestOpen(false);
                  setToast(`Test sent to ${me.email}`);
                }, 700);
              }}
            >
              <Icon.Send size={14} /> Send test
            </Button>
          </>
        }
      >
        {actionError && <p role="alert" className="mb-3 text-danger">{actionError}</p>}
        {workspace ? (testOptions ? (
          <div className="space-y-4">
            <Field label="Send to" htmlFor="test-recipient"><Input id="test-recipient" value={testOptions.recipient} readOnly /></Field>
            <Field label="Sending mode" htmlFor="test-mode">
              <Select id="test-mode" value={testMode} onChange={(event) => setTestMode(event.target.value)}>
                <option value="verified">Verified sender</option>
                <option value="sandbox">Resend sandbox · own inbox only</option>
              </Select>
            </Field>
            {testMode === "sandbox" ? <>
              <p className="text-sm text-muted">Sends from onboarding@resend.dev to your signed-in email only. Use the same email as your Resend account. This tests the template; it does not send a campaign or verify a domain.</p>
              {testOptions.transports.length ? <Field label="Resend transport" htmlFor="test-transport">
                <Select id="test-transport" value={testTransportId} onChange={(event) => setTestTransportId(event.target.value)}>
                  {testOptions.transports.map((transport) => <option key={transport.id ?? transport._id} value={transport.id ?? transport._id}>{transport.name}</option>)}
                </Select>
              </Field> : <Link href="/settings" className="underline">Add a Resend API key in Settings</Link>}
            </> : testOptions.senders.length ? (
              <Field label="Sender identity" htmlFor="test-sender">
                <Select id="test-sender" value={senderId} onChange={(event) => setSenderId(event.target.value)}>
                  {testOptions.senders.map((sender) => <option key={sender.id} value={sender.id}>{sender.displayName} · {sender.fromEmail}</option>)}
                </Select>
              </Field>
            ) : <Link href="/settings?tab=senders" className="underline">Add a sender in Settings</Link>}
          </div>
        ) : !actionError && <p role="status">Loading senders…</p>) : (
          <Field label="Send to"><Input value={me.email} disabled /></Field>
        )}
      </Dialog>

      <Toast message={toast} onDone={() => setToast("")} />
    </div>
  );
}
