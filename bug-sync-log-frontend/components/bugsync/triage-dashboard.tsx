"use client"

import type { Bug } from "@/lib/bugsync-data"
import { BugCard } from "./bug-card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Flame } from "lucide-react"

export function TriageDashboard({
  bugs,
  query,
  onQueryChange,
  onReportBug,
  onOpen,
  onUpvote,
  onQueue,
}: {
  bugs: Bug[]
  query: string
  onQueryChange: (q: string) => void
  onReportBug: () => void
  onOpen: (id: string) => void
  onUpvote: (id: string) => void
  onQueue: (id: string) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Bug Triage</h1>
          <p className="text-sm text-muted-foreground">
            Review, rally votes, and queue what matters most.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search bugs, files, IDs…"
              className="w-full rounded-md border border-input bg-card py-2 pl-8.5 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <Button onClick={onReportBug} className="gap-1.5">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Report Bug</span>
          </Button>
        </div>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-5">
        <div className="mb-4 flex items-center gap-2">
          <Flame className="size-4 text-chart-2" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Incoming Triage Pile
          </h2>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {bugs.length}
          </span>
        </div>

        {bugs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-sm font-medium text-foreground">The pile is clear.</p>
            <p className="text-sm text-muted-foreground">
              No unassigned bugs match your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {bugs.map((bug) => (
              <BugCard
                key={bug.id}
                bug={bug}
                onOpen={() => onOpen(bug.id)}
                onUpvote={() => onUpvote(bug.id)}
                onQueue={() => onQueue(bug.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
