"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmailPaper } from "@/components/EmailRender";
import { Icon } from "@/components/icons";
import { Button, Card, EmptyState, PageHeader, SearchInput, Segmented, StatusBadge, fmt } from "@/components/ui";
import { ensureStarterDrafts, readDrafts, subscribeDrafts } from "@/lib/template-drafts";
import { templateRequest, useTemplateWorkspace } from "@/lib/template-api";
import { templates } from "@/lib/mock";

export default function TemplatesPage() {
  const [q, setQ] = useState("");
  const [drafts, setDrafts] = useState([]);
  const { workspace, error: workspaceError } = useTemplateWorkspace();
  const [remote, setRemote] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selectedList, setSelectedList] = useState("");
  const [view, setView] = useState("all");
  useEffect(() => {
    const listId = new URLSearchParams(location.search).get("listId") ?? "";
    queueMicrotask(() => setSelectedList(listId));
  }, []);
  useEffect(() => {
    if (!workspace) return;
    let active = true;
    templateRequest(workspace, "/templates").then(
      (data) => { if (active) setRemote(data); },
      (error) => { if (active) setLoadError(error); },
    );
    return () => { active = false; };
  }, [workspace]);
  useEffect(() => {
    const refresh = () => {
      ensureStarterDrafts();
      setDrafts(readDrafts());
    };
    const unsubscribe = subscribeDrafts(refresh);
    queueMicrotask(refresh);
    return unsubscribe;
  }, []);
  const rows = [...(remote ?? []), ...drafts, ...(workspace === null ? templates : [])]
    .filter((template) => template.name.toLowerCase().includes(q.toLowerCase()))
    .filter((template) => view === "all" || (view === "published" ? template.status === "PUBLISHED" : template.status !== "PUBLISHED"));
  const blank = rows.find((template) => template.id === "local-starter-blank" || template.name === "Blank template");
  const orderedRows = blank ? [blank, ...rows.filter((template) => template.id !== blank.id)] : rows;

  return (
    <>
      <PageHeader
        title="Templates"
        description="Design once, publish a version, reuse it in any campaign. Editing never changes mail that's already queued."
      />

      {(workspaceError || loadError) && <p role="alert" className="mb-4 text-danger">{(workspaceError || loadError).message} <Link className="underline" href="/login">Sign in again</Link></p>}
      {(workspace === undefined && !workspaceError || workspace && !remote && !loadError) && <p role="status" className="mb-4 text-muted">Loading workspace templates…</p>}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          label="Template list"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "all", label: "All" },
            { value: "published", label: "Published" },
            { value: "drafts", label: "Drafts" },
          ]}
        />
        <SearchInput className="w-full sm:w-64" placeholder="Search templates" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {orderedRows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Icon.Layout size={18} />}
            title={view === "published" ? "No published templates yet" : "No templates found"}
            description={
              view === "published"
                ? "Open an existing draft and publish a version to make it selectable for campaigns."
                : q
                ? `No templates match "${q}". Check spelling or clear your search.`
                : "Create your first email template to get started."
            }
            action={
              view === "published" ? (
                <Button variant="secondary" onClick={() => setView("all")}>View all template drafts</Button>
              ) : q ? (
                <Button variant="secondary" onClick={() => setQ("")}>Clear search</Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {orderedRows.map((t) => (
            <Link
              key={t.id}
              href={`/templates/${t.id}${workspace ? `?org=${workspace.org.id}${selectedList ? `&listId=${encodeURIComponent(selectedList)}` : ""}` : ""}`}
              aria-label={t.id === blank?.id ? "Create from blank template" : undefined}
              className={t.id === blank?.id
                ? "group grid min-h-[352px] place-items-center border-2 border-dashed border-line-strong bg-surface text-muted transition-[border-color,transform,color] duration-200 hover:-translate-y-1 hover:border-fg hover:text-fg cursor-pointer"
                : "group overflow-hidden border-2 border-line bg-surface transition-[border-color,transform] duration-200 hover:-translate-y-1 hover:border-line-strong cursor-pointer"}
            >
              {t.id === blank?.id ? <>
                <Icon.Plus size={36} />
                <span className="sr-only">Blank template</span>
              </> : <>
                {/* Live thumbnail: the real renderer, scaled, not a screenshot */}
                <div className="relative h-56 overflow-hidden border-b border-line bg-surface-2" aria-hidden="true">
                  <div className="pointer-events-none absolute left-1/2 top-4 w-[600px] origin-top -translate-x-1/2 scale-[0.5]">
                    <EmailPaper template={t} />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface-2 to-transparent" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="truncate font-display text-[20px] font-bold tracking-[-0.02em]">{t.name}</h2>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="mt-1 truncate text-[14px] text-muted">{t.subject}</p>
                  <p className="mt-3 text-[13px] text-subtle">
                    {t.id.startsWith("local-") ? "Browser draft" : t.latestVersion ? `v${t.latestVersion}` : "Workspace draft"} · Edited {fmt.date(t.updatedAt)}
                  </p>
                </div>
              </>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
