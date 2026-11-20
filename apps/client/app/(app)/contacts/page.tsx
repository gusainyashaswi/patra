"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Badge, Button, EmptyState, PageHeader, SearchInput, Segmented, Select, Table, Td, Th, fmt } from "@/components/ui";
import { contacts as demoContacts, lists as demoLists } from "@/lib/mock";
import { useWorkspace, workspaceRequest } from "@/lib/workspace-api";

const PAGE = 12;

export default function ContactsPage() {
  const { workspace, error } = useWorkspace();
  if (error) return <><PageHeader title="Contacts" /><p role="alert" className="mb-4 text-danger">{error.message}</p>{error.status === 401 && <Button href="/login">Sign in</Button>}</>;
  if (workspace === undefined) return <p role="status">Loading your organization…</p>;
  return <ContactDirectory workspace={workspace} />;
}

function ContactDirectory({ workspace }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState("all");
  const [page, setPage] = useState(0);
  const [listId, setListId] = useState(() => workspace ? new URLSearchParams(location.search).get("list") || "" : "");
  const [lists, setLists] = useState(workspace ? [] : demoLists);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const query = new URLSearchParams({ q, view, page: String(page), ...(listId ? { listId } : {}) }).toString();
  useEffect(() => {
    if (!workspace) return;
    let active = true;
    workspaceRequest(workspace, "/lists").then(
      (data) => { if (active) setLists(data); },
      (error) => { if (active) setListError(error.message); },
    );
    return () => { active = false; };
  }, [workspace]);

  useEffect(() => {
    if (!workspace) return;
    let active = true;
    const timer = setTimeout(() => {
      workspaceRequest(workspace, `/contacts?${query}`).then(
        (data) => { if (active) { setResult({ ...data, query }); setError(""); } },
        (error) => { if (active) setError(error.message); },
      );
    }, 200);
    return () => { clearTimeout(timer); active = false; };
  }, [workspace, query]);

  const rows = useMemo(
    () =>
      demoContacts.filter((c) => {
        if (view === "suppressed" && !c.suppressed) return false;
        if (view === "active" && c.suppressed) return false;
        const s = q.toLowerCase();
        return !s || c.name.toLowerCase().includes(s) || c.email.includes(s) || c.college.toLowerCase().includes(s);
      }),
    [q, view],
  );
  const suppressedCount = demoContacts.filter((c) => c.suppressed).length;
  const counts = workspace ? result?.counts ?? {} : {
    all: demoContacts.length, active: demoContacts.length - suppressedCount, suppressed: suppressedCount,
  };
  const total = workspace ? result?.total ?? 0 : rows.length;
  const pageSize = workspace ? result?.pageSize ?? PAGE : PAGE;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const shown = workspace ? result?.rows ?? [] : rows.slice(page * PAGE, page * PAGE + PAGE);
  const loading = workspace && result?.query !== query && !error;
  const suppressionLabels = { UNSUBSCRIBED: "Unsubscribed", HARD_BOUNCE: "Hard bounce", COMPLAINT: "Complaint", MANUAL: "Manually suppressed" };

  function selectList(id) {
    setError("");
    setListId(id);
    setPage(0);
    if (workspace) {
      const url = new URL(location.href);
      if (id) url.searchParams.set("list", id);
      else url.searchParams.delete("list");
      history.replaceState(null, "", url);
    }
  }

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Everyone you can send to. Unsubscribed and bounced addresses are suppressed from every campaign automatically."
        actions={
          <Button href={workspace ? `/contacts/import?org=${workspace.org.id}` : "/contacts/import"}>
            <Icon.Upload size={15} /> Import contacts
          </Button>
        }
      />

      {listError && <p role="alert" className="mb-4 text-danger">{listError}</p>}
      {workspace ? (
        <div className="mb-8 flex flex-wrap items-center gap-3 border-t-2 border-line-strong pt-6">
          <label htmlFor="contact-audience" className="font-semibold">Audience</label>
          <Select id="contact-audience" value={listId} onChange={(event) => selectList(event.target.value)}>
            <option value="">All contacts</option>
            {listId && !lists.some((list) => list.id === listId) && <option value={listId}>Selected audience</option>}
            {lists.map((list) => <option key={list.id} value={list.id}>{list.name} ({fmt.n(list.count)})</option>)}
          </Select>
        </div>
      ) : <div className="mb-16 grid grid-cols-1 gap-10 border-t-2 border-line-strong pt-10 sm:grid-cols-3">
        {lists.map((l) => (
          <div key={l.id}>
            <div className="display tabular text-[44px]">{fmt.n(l.count)}</div>
            <div className="label mt-2 text-subtle">{l.name}</div>
          </div>
        ))}
      </div>}

      <div>
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            label="Contact view"
            size="sm"
            value={view}
            onChange={(v) => { setError(""); setView(v); setPage(0); }}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "active", label: "Sendable", count: counts.active },
              { value: "suppressed", label: "Suppressed", count: counts.suppressed },
            ]}
          />
          <SearchInput
            className="sm:w-72"
            placeholder="Search name, email or college"
            label="Search contacts"
            maxLength={100}
            value={q}
            onChange={(e) => { setError(""); setQ(e.target.value); setPage(0); }}
          />
        </div>

        {error ? <p role="alert" className="text-danger">{error}</p>
          : loading ? <p role="status">Loading contacts…</p>
          : shown.length === 0 ? (
          <EmptyState
            icon={<Icon.Search size={18} />}
            title={workspace && !q && view === "all" ? "No contacts yet" : "No contacts match"}
            description={workspace && !q && view === "all" ? "Import a CSV or Excel file to add contacts." : "Check the spelling or try another view."}
            action={
              q || view !== "all" ? (
                <Button variant="secondary" onClick={() => { setQ(""); setView("all"); setPage(0); }}>Clear filters</Button>
              ) : (
                <Button href={workspace ? `/contacts/import?org=${workspace.org.id}` : "/contacts/import"}>
                  <Icon.Upload size={14} /> Import contacts
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th className="hidden md:table-cell">College</Th>
                {!workspace && <Th className="hidden sm:table-cell">Lists</Th>}
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-surface-2">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center bg-surface-3 font-mono text-[13px] font-semibold text-muted" aria-hidden="true">
                        {(c.name || c.email).split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{c.name || "Unnamed contact"}</div>
                        <div className="truncate text-[14px] text-subtle">{c.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="hidden text-muted md:table-cell">{c.college || "—"}</Td>
                  {!workspace && <Td className="hidden sm:table-cell">
                    {c.lists.map((l) => <Badge key={l}>{l}</Badge>)}
                  </Td>}
                  <Td>
                    {c.suppressed ? <Badge tone="danger" dot>{suppressionLabels[c.suppressed] ?? c.suppressed}</Badge> : <Badge tone="success" dot>Sendable</Badge>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {!loading && !error && <div className="flex items-center justify-between px-6 py-4 text-[14px] text-subtle">
          <span className="tabular">
            {total ? `${page * pageSize + 1}–${Math.min(total, (page + 1) * pageSize)} of ${total}` : "0 results"}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <Icon.ChevronLeft size={15} />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
              <Icon.ChevronRight size={15} />
            </Button>
          </div>
        </div>}
      </div>
    </>
  );
}
