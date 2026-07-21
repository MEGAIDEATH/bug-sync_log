"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Bug } from "@/lib/bugsync-data"
import { StatusPill, CUSTOMER_IMPACT } from "./portal-meta"
import { ChevronUp, CalendarDays, CircleDot } from "lucide-react"

export function IssueRow({
  bug,
  voted,
  onVote,
  onOpen,
}: {
  bug: Bug
  voted: boolean
  onVote: () => void
  onOpen: () => void
}) {
  const [bump, setBump] = useState(false)
  const impact = CUSTOMER_IMPACT[bug.urgency]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen()
        }
      }}
      className="group flex items-stretch gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4 sm:p-4"
    >
      {/* Upvote */}
      <button
        type="button"
        aria-pressed={voted}
        aria-label={voted ? "Remove your vote" : "Upvote this issue"}
        onClick={(e) => {
          e.stopPropagation()
          onVote()
          setBump(true)
          window.setTimeout(() => setBump(false), 250)
        }}
        className={cn(
          "flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border py-2 transition-colors",
          voted
            ? "border-primary bg-primary/15 text-primary"
            : "border-border bg-secondary text-muted-foreground hover:border-primary/50 hover:text-primary",
        )}
      >
        <ChevronUp className={cn("size-5 transition-transform", bump && "-translate-y-0.5 scale-125")} />
        <span className="text-sm font-bold tabular-nums">{bug.upvotes}</span>
      </button>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <h3 className="text-pretty text-sm font-semibold leading-snug text-card-foreground group-hover:text-foreground">
          {bug.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className={cn("inline-flex items-center gap-1 font-medium", impact.className)}>
            <CircleDot className="size-3" />
            {impact.label}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3" />
            Reported {bug.reportedAt}
          </span>
        </div>
      </div>

      {/* Status */}
      <div className="flex shrink-0 items-center">
        <StatusPill status={bug.status} />
      </div>
    </div>
  )
}
