"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Badge, Button, Card, Field, PageHeader, Segmented, Select, Table, Td, Th, Toast, cx, fmt } from "@/components/ui";
import { contacts, lists } from "@/lib/mock";

const SAMPLE = `email,name,college,ticket_id
riya.sen@example.test,Riya Sen,DTU,RF-0501
kabir.iyer0@example.test,Kabir Iyer,IIT Delhi,RF-0502
not-an-email,Dev Malhotra,NSUT,RF-0503
meera.kapoor@example.test,,Ashoka University,RF-0504
aarav.sharma0@example.test,Aarav Sharma,Rishihood University,RF-0505
riya.sen@example.test,Riya Sen,DTU,RF-0506
ananya.rao@example.test,Ananya Rao,Jamia Millia,RF-0507
sam@,Sam K,DTU,RF-0508`;

// Small, quote-aware CSV parser — enough for the preview step.
function parseCSV(text) {
  const rows = [];
  for (const line of text.trim().split(/\r?\n/)) {
    const out = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = !inQ;
      else if (ch === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    rows.push(out.map((s) => s.trim()));
  }
  return rows;
}

function analyse(text) {
  const [header, ...body] = parseCSV(text);
  const cols = header.map((h) => h.toLowerCase());
  const ei = cols.indexOf("email");
  if (ei < 0) return { error: "We couldn't find an “email” column. Add one to the first row and try again." };
  const existing = new Set(contacts.map((c) => c.email));
  const seen = new Set();
  const result = { cols, valid: [], invalid: [], duplicate: [] };
  body.forEach((r, i) => {
    const rec = Object.fromEntries(cols.map((c, j) => [c, r[j] ?? ""]));
    const row = { line: i + 2, ...rec };
    const email = rec.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) result.invalid.push({ ...row, reason: "Not a valid email address" });
    else if (seen.has(email)) result.duplicate.push({ ...row, reason: "Appears earlier in this file" });
    else if (existing.has(email)) result.duplicate.push({ ...row, reason: "Already a contact" });
    else {
      seen.add(email);
      result.valid.push({ ...row, warn: !rec.name ? "No name — will be skipped by templates that require it" : null });
    }
  });
  return result;
}

const steps = ["Upload", "Review", "Import"];

export default function ImportPage() {
  const router = useRouter();
  const input = useRef(null);
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [tab, setTab] = useState("valid");
  const [listId, setListId] = useState(lists[0].id);
  const [dupMode, setDupMode] = useState("update");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = (name, text) => {
    setFileName(name);
    const r = analyse(text);
    if (r.error) { setError(r.error); return; }
    setError("");
    setData(r);
    setTab(r.invalid.length ? "invalid" : "valid");
    setStep(1);
  };
  const onFile = (f) => {
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) {
      setError(/\.xlsx$/i.test(f.name) ? "Excel files are parsed on the server — that arrives with the contacts API. Export as CSV for now." : "Upload a .csv or .xlsx file.");
      return;
    }
    f.text().then((t) => load(f.name, t));
  };

  const current = data?.[tab] ?? [];
  const extraCols = data ? data.cols.filter((c) => c !== "email" && c !== "name") : [];

  return (
    <>
      <PageHeader
        back={{ href: "/contacts", label: "Contacts" }}
        title="Import contacts"
        description="Upload a CSV. You'll see exactly what will be imported before anything is saved."
      />

      {/* Stepper */}
      <ol className="mb-10 flex items-center gap-2" aria-label="Import progress">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              aria-current={i === step ? "step" : undefined}
              className={cx(
                "inline-flex h-7 items-center gap-2 rounded-full pl-1 pr-3 text-[14px] font-medium",
                i === step ? "bg-primary text-on-primary" : i < step ? "bg-success-soft text-success" : "bg-surface-2 text-subtle",
              )}
            >
              <span className={cx("grid h-5 w-5 place-items-center rounded-full text-[12px]", i === step ? "bg-on-primary/15" : "")}>
                {i < step ? <Icon.Check size={12} /> : i + 1}
              </span>
              {s}
            </span>
            {i < steps.length - 1 && <span className="h-px w-6 bg-line-strong" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card className="p-5 sm:p-8 animate-fade-up">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
            className={cx(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors duration-150",
              drag ? "border-accent bg-accent-soft/50" : "border-line-strong",
            )}
          >
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-surface-2 text-muted"><Icon.Upload size={20} /></span>
            <h2 className="text-[17px] font-semibold">Drop your file here</h2>
            <p className="mt-1 text-[14px] text-muted">CSV or Excel, up to 10 MB. The first row must be column names, including “email”.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button onClick={() => input.current?.click()}>Choose file</Button>
              <Button variant="secondary" onClick={() => load("sample-attendees.csv", SAMPLE)}>Try a sample file</Button>
            </div>
            <input ref={input} type="file" accept=".csv,.xlsx" className="sr-only" onChange={(e) => onFile(e.target.files[0])} aria-label="Choose a CSV file" />
            {error && (
              <p role="alert" className="mt-5 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-[14px] text-danger">
                <Icon.Alert size={14} /> {error}
              </p>
            )}
          </div>
          <div className="mt-6 grid gap-4 text-[14px] text-muted sm:grid-cols-3">
            {[
              ["Nothing is saved yet", "Review comes first. Cancel any time."],
              ["Extra columns become variables", "e.g. a “college” column becomes {{college}}."],
              ["Suppressions still apply", "Re-importing an unsubscribed address won't re-subscribe it."],
            ].map(([t, d]) => (
              <div key={t} className="flex gap-2.5">
                <Icon.CheckCircle size={15} className="mt-0.5 shrink-0 text-success" />
                <div><div className="font-medium text-fg">{t}</div>{d}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {step === 1 && data && (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_320px] animate-fade-up">
          <Card>
            <div className="flex flex-col gap-3 border-b border-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <Segmented
                label="Rows"
                size="sm"
                value={tab}
                onChange={setTab}
                options={[
                  { value: "valid", label: "Ready", count: data.valid.length },
                  { value: "invalid", label: "Invalid", count: data.invalid.length },
                  { value: "duplicate", label: "Duplicates", count: data.duplicate.length },
                ]}
              />
              <span className="flex items-center gap-1.5 text-[14px] text-subtle"><Icon.File size={13} /> {fileName}</span>
            </div>
            {current.length === 0 ? (
              <div className="px-5 py-12 text-center text-[14px] text-muted">
                <Icon.CheckCircle size={20} className="mx-auto mb-2 text-success" />
                Nothing here — {tab === "invalid" ? "every row has a valid email." : "no duplicates found."}
              </div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th className="w-14">Row</Th>
                    <Th>Email</Th>
                    <Th className="hidden sm:table-cell">Name</Th>
                    <Th>{tab === "valid" ? "Fields" : "Reason"}</Th>
                  </tr>
                </thead>
                <tbody>
                  {current.map((r) => (
                    <tr key={r.line}>
                      <Td className="tabular text-subtle">{r.line}</Td>
                      <Td className={cx("font-mono text-[14px]", tab === "invalid" && "text-danger")}>{r.email || "—"}</Td>
                      <Td className="hidden sm:table-cell">{r.name || <span className="text-subtle">—</span>}</Td>
                      <Td>
                        {tab === "valid" ? (
                          r.warn ? (
                            <span className="inline-flex items-center gap-1 text-[14px] text-warning"><Icon.Alert size={13} /> No name</span>
                          ) : (
                            <span className="text-[14px] text-subtle">{extraCols.map((c) => r[c]).filter(Boolean).join(" · ")}</span>
                          )
                        ) : (
                          <span className="text-[14px] text-muted">{r.reason}</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <aside className="lg:sticky lg:top-8">
            <Card className="overflow-hidden">
              <div className="border-b border-line px-7 py-6">
                <div className="text-[14px] text-subtle">Will be imported</div>
                <div className="tabular text-[36px] font-semibold leading-tight tracking-tight">{fmt.n(data.valid.length)}</div>
                <div className="mt-1 text-[14px] text-muted">
                  {data.invalid.length} invalid · {data.duplicate.length} duplicates skipped
                </div>
              </div>
              <div className="flex flex-col gap-4 px-7 py-6">
                <Field label="Add to list" htmlFor="imp-list">
                  <Select id="imp-list" value={listId} onChange={(e) => setListId(e.target.value)}>
                    {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </Select>
                </Field>
                <Field label="If a contact already exists">
                  <Segmented
                    label="Duplicate handling"
                    size="sm"
                    value={dupMode}
                    onChange={setDupMode}
                    options={[{ value: "update", label: "Update fields" }, { value: "skip", label: "Skip" }]}
                  />
                </Field>
                {extraCols.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[14px] font-medium">New variables</div>
                    <div className="flex flex-wrap gap-1.5">
                      {extraCols.map((c) => <Badge key={c} tone="accent"><span className="font-mono">{`{{${c}}}`}</span></Badge>)}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 border-t border-line bg-surface-2/50 px-7 py-6">
                <Button
                  size="lg"
                  className="w-full"
                  loading={busy}
                  disabled={!data.valid.length}
                  onClick={() => {
                    setBusy(true);
                    setTimeout(() => { setBusy(false); setStep(2); }, 800);
                  }}
                >
                  Import {fmt.n(data.valid.length)} contacts
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => { setStep(0); setData(null); }}>
                  Choose a different file
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      )}

      {step === 2 && data && (
        <Card className="mx-auto max-w-lg p-8 text-center animate-fade-up">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-success-soft text-success"><Icon.Check size={22} /></span>
          <h2 className="text-[20px] font-semibold">{fmt.n(data.valid.length)} contacts imported</h2>
          <p className="mt-1 text-[15px] text-muted">
            Added to {lists.find((l) => l.id === listId).name}. {data.invalid.length + data.duplicate.length} rows were skipped.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button href="/campaigns/new"><Icon.Send size={14} /> Start a campaign</Button>
            <Button variant="secondary" onClick={() => setToast("Skipped rows downloaded as CSV")}>
              <Icon.Download size={14} /> Download skipped rows
            </Button>
            <Button variant="ghost" onClick={() => router.push("/contacts")}>View contacts</Button>
          </div>
        </Card>
      )}
      <Toast message={toast} onDone={() => setToast("")} />
    </>
  );
}
