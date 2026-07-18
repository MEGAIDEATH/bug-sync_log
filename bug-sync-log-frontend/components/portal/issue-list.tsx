"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { Bug, Status } from "@/lib/bugsync-data"
import { IssueRow } from "./issue-row"
import { SearchX, TrendingUp } from "lucide-react"

type FilterId = "all" | "open" | "in-progress" | "review" | "done"

const FILTERS: { id: FilterId; label: string; match: (s: string) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "open", label: "Open", match: (s) => s !== "done" && s !== "fixed" && s !== "closed" },
  { id: "in-progress", label: "Being Fixed", match: (s) => s === "in-progress" },
  { id: "review", label: "In Review", match: (s) => s === "review" || s === "needs-review" },
  { id: "done", label: "Fixed", match: (s) => s === "done" || s === "fixed" || s === "closed" },
]

export function IssueList({
  bugs,
  query,
  votes,
  onVote,
  onOpen,
}: {
  bugs: Bug[]
  query: string
  votes: Set<string>
  onVote: (id: string) => void
  onOpen: (id: string) => void
}) {
  const [filter, setFilter] = useState<FilterId>("all")

  const filtered = useMemo(() => {
    const active = FILTERS.find((f) => f.id === filter)!
    const q = query.trim().toLowerCase()
    return bugs
      .filter((b) => active.match(b.status))
      .filter((b) => (q ? b.title.toLowerCase().includes(q) : true))
      .sort((a, b) => b.upvotes - a.upvotes)
  }, [bugs, filter, query])

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">
            {query ? "Search results" : "Most requested issues"}
          </h2>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === f.id
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <SearchX className="mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No matching issues</p>
          <p className="mt-1 max-w-xs text-pretty text-sm text-muted-foreground">
            Nothing here yet — you may be the first to report it. Head to “Report a Bug”.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((bug) => (
            <IssueRow
              key={bug.id}
              bug={bug}
              voted={votes.has(bug.id)}
              onVote={() => onVote(bug.id)}
              onOpen={() => onOpen(bug.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
