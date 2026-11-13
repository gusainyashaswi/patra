"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Badge, Button, EmptyState, PageHeader, SearchInput, Segmented, Table, Td, Th, fmt } from "@/components/ui";
import { contacts, lists } from "@/lib/mock";

const PAGE = 12;

export default function ContactsPage() {
  const [q, setQ] = useState("");
  const [view, setView] = useState("all");
  const [page, setPage] = useState(0);

  const rows = useMemo(
    () =>
      contacts.filter((c) => {
        if (view === "suppressed" && !c.suppressed) return false;
        if (view === "active" && c.suppressed) return false;
        const s = q.toLowerCase();
        return !s || c.name.toLowerCase().includes(s) || c.email.includes(s) || c.college.toLowerCase().includes(s);
      }),
    [q, view],
  );
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);
  const suppressedCount = contacts.filter((c) => c.suppressed).length;

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Everyone you can send to. Unsubscribed and bounced addresses are suppressed from every campaign automatically."
        actions={
          <Button href="/contacts/import">
            <Icon.Upload size={15} /> Import contacts
          </Button>
        }
      />

      <div className="mb-16 grid grid-cols-1 gap-10 border-t-2 border-line-strong pt-10 sm:grid-cols-3">
        {lists.map((l) => (
          <div key={l.id}>
            <div className="display tabular text-[44px]">{fmt.n(l.count)}</div>
            <div className="label mt-2 text-subtle">{l.name}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            label="Contact view"
            size="sm"
            value={view}
            onChange={(v) => { setView(v); setPage(0); }}
            options={[
              { value: "all", label: "All", count: contacts.length },
              { value: "active", label: "Sendable", count: contacts.length - suppressedCount },
              { value: "suppressed", label: "Suppressed", count: suppressedCount },
            ]}
          />
          <SearchInput
            className="sm:w-72"
            placeholder="Search name, email or college"
            label="Search contacts"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
          />
        </div>

        {shown.length === 0 ? (
          <EmptyState
            icon={<Icon.Search size={18} />}
            title="No contacts match"
            description="Check the spelling or try another view."
            action={<Button variant="secondary" onClick={() => { setQ(""); setView("all"); }}>Clear filters</Button>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th className="hidden md:table-cell">College</Th>
                <Th className="hidden sm:table-cell">Lists</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-surface-2">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center bg-surface-3 font-mono text-[13px] font-semibold text-muted" aria-hidden="true">
                        {c.name.split(" ").map((p) => p[0]).join("")}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{c.name}</div>
                        <div className="truncate text-[14px] text-subtle">{c.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="hidden text-muted md:table-cell">{c.college}</Td>
                  <Td className="hidden sm:table-cell">
                    {c.lists.map((l) => <Badge key={l}>{l}</Badge>)}
                  </Td>
                  <Td>
                    {c.suppressed ? <Badge tone="danger" dot>{c.suppressed}</Badge> : <Badge tone="success" dot>Sendable</Badge>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <div className="flex items-center justify-between px-6 py-4 text-[14px] text-subtle">
          <span className="tabular">
            {rows.length ? `${page * PAGE + 1}–${Math.min(rows.length, (page + 1) * PAGE)} of ${rows.length}` : "0 results"}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <Icon.ChevronLeft size={15} />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
              <Icon.ChevronRight size={15} />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
