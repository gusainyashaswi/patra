"use client";

import Link from "next/link";
import { useState } from "react";
import { EmailPaper } from "@/components/EmailRender";
import { Icon } from "@/components/icons";
import { Button, Card, EmptyState, PageHeader, SearchInput, StatusBadge, fmt } from "@/components/ui";
import { templates } from "@/lib/mock";

export default function TemplatesPage() {
  const [q, setQ] = useState("");
  const rows = templates.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Templates"
        description="Design once, publish a version, reuse it in any campaign. Editing never changes mail that's already queued."
        actions={
          <Button href="/templates/tp_2">
            <Icon.Plus size={15} /> New template
          </Button>
        }
      />

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
              href={`/templates/${t.id}`}
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
                  v{t.latestVersion} · Edited {fmt.date(t.updatedAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
