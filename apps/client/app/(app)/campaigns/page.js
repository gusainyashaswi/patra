"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Button, EmptyState, PageHeader, SearchInput, Segmented, StatusBadge, Table, Td, Th, fmt } from "@/components/ui";
import { byId, campaigns, lists, templates } from "@/lib/mock";

const filters = [
  { value: "all", label: "All" },
  { value: "active", label: "Active", match: ["SENDING", "QUEUED", "PAUSED"] },
  { value: "DRAFT", label: "Drafts", match: ["DRAFT"] },
  { value: "COMPLETED", label: "Completed", match: ["COMPLETED"] },
];

export default function CampaignsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const f = filters.find((x) => x.value === filter);
    return campaigns.filter(
      (c) => (!f.match || f.match.includes(c.status)) && c.name.toLowerCase().includes(q.toLowerCase()),
    );
  }, [filter, q]);

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Send a published template to an audience and track every recipient."
        actions={
          <Button href="/campaigns/new">
            <Icon.Plus size={15} /> New campaign
          </Button>
        }
      />

      <div>
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            label="Filter campaigns"
            size="sm"
            value={filter}
            onChange={setFilter}
            options={filters.map((f) => ({
              ...f,
              count: f.match ? campaigns.filter((c) => f.match.includes(c.status)).length : campaigns.length,
            }))}
          />
          <SearchInput
            className="sm:w-64"
            placeholder="Search campaigns"
            label="Search campaigns"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Icon.Send size={18} />}
            title={q ? "No campaigns match your search" : "No campaigns here yet"}
            description={q ? "Try a different name or clear the filter." : "Create a campaign from a published template."}
            action={
              q ? (
                <Button variant="secondary" onClick={() => setQ("")}>Clear search</Button>
              ) : (
                <Button href="/campaigns/new"><Icon.Plus size={15} /> New campaign</Button>
              )
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Campaign</Th>
                <Th>Status</Th>
                <Th className="hidden md:table-cell">Audience</Th>
                <Th align="right">Recipients</Th>
                <Th align="right" className="hidden sm:table-cell">Delivered</Th>
                <Th align="right" className="hidden lg:table-cell">Opened</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const t = byId(templates, c.templateId);
                const href = c.status === "DRAFT" ? `/campaigns/new?draft=${c.id}` : `/campaigns/${c.id}`;
                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(href)}
                    className="cursor-pointer transition-colors hover:bg-surface-2"
                  >
                    <Td>
                      <a href={href} onClick={(e) => e.stopPropagation()} className="font-medium hover:underline underline-offset-4">
                        {c.name}
                      </a>
                      <div className="text-[14px] text-subtle">
                        {t.name}
                        {c.templateVersion ? ` · v${c.templateVersion}` : ""} · {fmt.date(c.createdAt)}
                      </div>
                    </Td>
                    <Td><StatusBadge status={c.status} /></Td>
                    <Td className="hidden text-muted md:table-cell">{byId(lists, c.listId).name}</Td>
                    <Td align="right">{c.counters.total ? fmt.n(c.counters.total) : "—"}</Td>
                    <Td align="right" className="hidden sm:table-cell">
                      {c.counters.total ? fmt.pct(c.counters.delivered, c.counters.total) : "—"}
                    </Td>
                    <Td align="right" className="hidden lg:table-cell">
                      {c.counters.total ? fmt.pct(c.counters.opened, c.counters.total) : "—"}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>
    </>
  );
}
