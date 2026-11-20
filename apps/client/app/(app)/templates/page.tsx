"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmailPaper } from "@/components/EmailRender";
import { Icon } from "@/components/icons";
import { Card, EmptyState, PageHeader, SearchInput, StatusBadge, fmt } from "@/components/ui";
import { readDrafts, subscribeDrafts } from "@/lib/template-drafts";
import { templateRequest, useTemplateWorkspace } from "@/lib/template-api";
import { templates } from "@/lib/mock";

export default function TemplatesPage() {
  const [q, setQ] = useState("");
  const [drafts, setDrafts] = useState([]);
  const { workspace, error: workspaceError } = useTemplateWorkspace();
  const [remote, setRemote] = useState(null);
  const [loadError, setLoadError] = useState(null);
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
    const refresh = () => setDrafts(readDrafts());
    const unsubscribe = subscribeDrafts(refresh);
    queueMicrotask(refresh);
    return unsubscribe;
  }, []);
  const rows = [...(remote ?? []), ...drafts, ...(workspace === null ? templates : [])].filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Templates"
        description="Design once, publish a version, reuse it in any campaign. Editing never changes mail that's already queued."
      />

      {(workspaceError || loadError) && <p role="alert" className="mb-4 text-danger">{(workspaceError || loadError).message} <Link className="underline" href="/login">Sign in again</Link></p>}
      {(workspace === undefined && !workspaceError || workspace && !remote && !loadError) && <p role="status" className="mb-4 text-muted">Loading workspace templates…</p>}
      <div className="mb-10 flex justify-end">
        <SearchInput className="w-full sm:w-64" placeholder="Search templates" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={<Icon.Layout size={18} />} title="No templates found" description="Try a different name." />
        </Card>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((t) => (
            <Link
              key={t.id}
              href={`/templates/${t.id}${t.revision ? `?org=${workspace.org.id}` : ""}`}
              className="group overflow-hidden border-2 border-line bg-surface transition-[border-color,transform] duration-200 hover:-translate-y-1 hover:border-line-strong cursor-pointer"
            >
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
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
