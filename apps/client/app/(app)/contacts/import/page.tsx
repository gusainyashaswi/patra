"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Badge, Button, Card, Field, Input, PageHeader, Segmented, Select, Table, Td, Th, fmt } from "@/components/ui";
import { api } from "@/lib/api";
import { useWorkspace, workspaceRequest } from "@/lib/workspace-api";

const sample = "email,name,college,ticket_id\nriya.sen@example.test,Riya Sen,DTU,RF-0501\nnot-an-email,Dev Malhotra,NSUT,RF-0503\nriya.sen@example.test,Riya Sen,DTU,RF-0506\nananya.rao@example.test,Ananya Rao,Jamia Millia,RF-0507";
const categories = { valid: "Ready", invalid: "Invalid", duplicate: "Duplicates", suppressed: "Suppressed" };

export default function ImportPage() {
  const { workspace, error: workspaceError } = useWorkspace();
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [review, setReview] = useState(null);
  const [result, setResult] = useState(null);
  const [lists, setLists] = useState([]);
  const [listId, setListId] = useState("");
  const [listName, setListName] = useState("");
  const [duplicateMode, setDuplicateMode] = useState("update");
  const [tab, setTab] = useState("valid");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const requestId = useRef(null);
  const committedOptions = useRef(null);

  useEffect(() => {
    if (!workspace) return;
    let active = true;
    workspaceRequest(workspace, "/lists").then(
      (data) => { if (active) setLists(data); },
      (error) => { if (active) setError(error.message); },
    );
    return () => { active = false; };
  }, [workspace]);

  function importPath(suffix, filename, options = {}) {
    return `/contacts/import${suffix}?${new URLSearchParams({ filename, ...options })}`;
  }

  function uploadBody(source) {
    return new Blob([source], { type: "application/octet-stream" });
  }

  async function preview(source) {
    if (!source || busy || !workspace) return;
    setError("");
    if (!/\.(csv|xlsx)$/i.test(source.name) || source.size > 5 * 1024 * 1024) {
      setError("Choose a CSV or XLSX file up to 5 MB.");
      return;
    }
    setBusy("preview");
    try {
      const data = await workspaceRequest(workspace, importPath("/preview", source.name), {
        method: "POST", body: uploadBody(source),
      });
      requestId.current = crypto.randomUUID();
      committedOptions.current = null;
      setFile(source);
      setListName(source.name.replace(/\.[^.]+$/, "").slice(0, 100));
      setReview(data);
      setTab(data.counts.valid ? "valid" : data.counts.invalid ? "invalid" : data.counts.suppressed ? "suppressed" : "duplicate");
    } catch (error) { setError(error.message); }
    finally { setBusy(""); }
  }

  async function commit(event) {
    event.preventDefault();
    if (!file || !review.counts.valid || busy || (!listId && !listName.trim())) return;
    setBusy("import");
    setError("");
    try {
      const target = listId ? { listId } : { listName: listName.trim() };
      const options = JSON.stringify({ ...target, duplicateMode });
      if (committedOptions.current && committedOptions.current !== options) requestId.current = crypto.randomUUID();
      committedOptions.current = options;
      const data = await workspaceRequest(workspace, importPath("", file.name, {
        ...target, requestId: requestId.current, duplicateMode,
      }), { method: "POST", body: uploadBody(file) });
      setResult(data);
    } catch (error) { setError(error.message); }
    finally { setBusy(""); }
  }

  async function downloadIssues() {
    if (busy) return;
    setBusy("download");
    setError("");
    try {
      const path = importPath("/rejected", file.name);
      const blob = await api(`/orgs/${workspace.org.id}${path}`, {
        method: "POST", body: uploadBody(file), responseType: "blob",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "skipped-contacts.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setError(error.message); }
    finally { setBusy(""); }
  }

  const issueCount = review ? review.counts.invalid + review.counts.duplicate + review.counts.suppressed : 0;

  return (
    <>
      <PageHeader back={{ href: "/contacts", label: "Contacts" }} title="Import contacts"
        description="Upload a CSV or Excel file, review the rows, and save them to an audience." />
      {(error || workspaceError) && <p className="mb-5 text-danger" role="alert">{error || workspaceError.message}</p>}
      {workspace === null || workspaceError?.status === 401 ? <Button href="/login">Sign in to import contacts</Button>
        : workspace === undefined ? workspaceError ? null : <p role="status">Loading your organization…</p>
        : result ? (
          <Card className="mx-auto max-w-xl p-7 text-center">
            <Icon.CheckCircle className="mx-auto mb-3 text-success" size={28} />
            <h2 className="display text-3xl">Audience saved</h2>
            <p className="mt-3 text-muted">{fmt.n(result.included)} contacts included in {result.list.name}. {fmt.n(result.skipped)} file rows skipped.</p>
            <p className="mt-2 text-sm text-muted">{fmt.n(result.added)} new · {fmt.n(result.updated)} existing updated</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button href={`/contacts?list=${result.list.id}&org=${workspace.org.id}`}>View audience</Button>
              <Button variant="secondary" href={`/templates?org=${workspace.org.id}&listId=${result.list.id}`}>Choose an email template</Button>
              <Button variant="secondary" href={`/campaigns/new?org=${workspace.org.id}&listId=${result.list.id}`}>Create campaign</Button>
              {issueCount > 0 && <Button variant="secondary" loading={busy === "download"} disabled={!!busy} onClick={downloadIssues}>Download skipped rows</Button>}
            </div>
          </Card>
        ) : !review ? (
          <Card className="p-5 sm:p-8">
            <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); preview(event.dataTransfer.files[0]); }}
              className={`rounded-xl border-2 border-dashed p-8 text-center sm:p-14 ${dragging ? "border-accent bg-accent-soft" : "border-line-strong"}`}>
              <Icon.Upload className="mx-auto mb-4 text-muted" size={23} />
              <h2 className="display text-2xl">Choose a contact file</h2>
              <p className="mx-auto mt-2 max-w-md text-muted">CSV or XLSX, up to 5 MB and 50,000 rows. Include headers and an email column. Excel imports the first sheet.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button loading={busy === "preview"} onClick={() => fileInput.current?.click()}>Choose file</Button>
                <Button variant="secondary" disabled={!!busy} onClick={() => preview(new File([sample], "sample-attendees.csv"))}>Try a sample file</Button>
              </div>
              <input ref={fileInput} type="file" accept=".csv,.xlsx" hidden onChange={(event) => { preview(event.target.files[0]); event.target.value = ""; }} />
            </div>
          </Card>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="min-w-0">
              <div className="space-y-3 border-b border-line p-5">
                <p className="break-all text-sm font-medium text-muted">{file.name}</p>
                <Segmented label="Review rows" size="sm" value={tab} onChange={setTab}
                  options={Object.entries(categories).map(([value, label]) => ({ value, label, count: review.counts[value] }))} />
              </div>
              {review[tab].length ? (
                <>
                  <Table>
                    <thead><tr><Th>Row</Th><Th>Email</Th><Th>Name</Th><Th>{tab === "valid" ? "Contact" : "Reason"}</Th></tr></thead>
                    <tbody>
                      {review[tab].map((row) => <tr key={row.line}>
                        <Td>{row.line}</Td><Td>{row.email || "—"}</Td><Td>{row.name || "—"}</Td>
                        <Td>{row.reason ?? (row.existing ? "Already in contacts" : "New")}</Td>
                      </tr>)}
                    </tbody>
                  </Table>
                  {review.counts[tab] > review[tab].length && <p className="p-5 text-sm text-muted">Showing the first {review[tab].length} rows in this group.</p>}
                </>
              ) : <p className="p-6 text-muted">No {categories[tab].toLowerCase()} rows.</p>}
              {issueCount > 0 && <div className="border-t border-line p-4"><Button size="sm" variant="secondary" loading={busy === "download"} disabled={!!busy} onClick={downloadIssues}><Icon.Download size={15} /> Download skipped rows</Button></div>}
            </Card>
            <Card className="p-6">
              <form onSubmit={commit} className="flex flex-col gap-4">
                <div>
                  <h2 className="display text-2xl">{fmt.n(review.counts.valid)} ready</h2>
                  <p className="mt-1 text-sm text-muted">{fmt.n(review.counts.existing)} already in contacts · {fmt.n(issueCount)} skipped</p>
                </div>
                <Field label="Audience" htmlFor="import-list">
                  <Select id="import-list" value={listId} onChange={(event) => setListId(event.target.value)}>
                    <option value="">Create a new list</option>
                    {lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
                  </Select>
                </Field>
                {!listId && <Field label="List name" htmlFor="import-name"><Input id="import-name" maxLength={100} required value={listName} onChange={(event) => setListName(event.target.value)} /></Field>}
                <Field label="Existing contacts" htmlFor="import-duplicates" hint="Both options add existing contacts to this list.">
                  <Select id="import-duplicates" value={duplicateMode} onChange={(event) => setDuplicateMode(event.target.value)}>
                    <option value="update">Update fields from file</option>
                    <option value="skip">Keep saved details</option>
                  </Select>
                </Field>
                {review.fields.length > 0 && <div><p className="mb-2 text-sm text-muted">Fields saved with contacts</p><div className="flex flex-wrap gap-2">{review.fields.map((field) => <Badge key={field}>{field}</Badge>)}</div></div>}
                <Button type="submit" loading={busy === "import"} disabled={!!busy || !review.counts.valid}>Import contacts</Button>
                <Button type="button" variant="ghost" disabled={!!busy} onClick={() => { setReview(null); setFile(null); setError(""); }}>Choose a different file</Button>
              </form>
            </Card>
          </div>
        )}
    </>
  );
}
