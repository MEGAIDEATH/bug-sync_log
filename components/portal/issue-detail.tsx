"use client"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import type { Bug, Status } from "@/lib/bugsync-data"
import { StatusPill, CUSTOMER_STATUS, CUSTOMER_IMPACT } from "./portal-meta"
import { X, ChevronUp, CalendarDays, MessageSquareText, Check } from "lucide-react"

const FLOW: Status[] = ["todo", "in-progress", "review", "done"]

export function IssueDetail({
  bug,
  voted,
  onVote,
  onClose,
}: {
  bug: Bug | null
  voted: boolean
  onVote: () => void
  onClose: () => void
}) {
  const open = Boolean(bug)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const currentIdx = bug ? FLOW.indexOf(bug.status) : -1

  return (
    <div
      className={cn("fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={bug ? bug.title : "Issue details"}
          className={cn(
            "relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl transition-all duration-300 sm:rounded-2xl",
            open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
          )}
        >
          {bug && (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-border p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusPill status={bug.status} />
                    <span className="font-mono text-xs text-muted-foreground">{bug.id}</span>
                  </div>
                  <h2 className="mt-2.5 text-pretty text-lg font-bold leading-snug text-card-foreground">
                    {bug.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 font-medium",
                      CUSTOMER_IMPACT[bug.urgency].className,
                    )}
                  >
                    {CUSTOMER_IMPACT[bug.urgency].label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Reported {bug.reportedAt}
                  </span>
                </div>

                {/* Progress */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Progress
                  </h3>
                  <ol className="flex flex-col gap-0">
                    {FLOW.map((s, i) => {
                      const reached = i <= currentIdx
                      const isCurrent = i === currentIdx
                      return (
                        <li key={s} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span
                              className={cn(
                                "flex size-6 items-center justify-center rounded-full border text-xs",
                                reached
                                  ? "border-transparent bg-primary text-primary-foreground"
                                  : "border-border bg-background text-muted-foreground",
                              )}
                            >
                              {reached ? <Check className="size-3.5" /> : i + 1}
                            </span>
                            {i < FLOW.length - 1 && (
                              <span
                                className={cn(
                                  "my-0.5 w-0.5 flex-1 rounded-full",
                                  i < currentIdx ? "bg-primary/50" : "bg-border",
                                )}
                              />
                            )}
                          </div>
                          <div className={cn("pb-4", isCurrent ? "opacity-100" : "opacity-70")}>
                            <p
                              className={cn(
                                "text-sm font-medium",
                                reached ? "text-foreground" : "text-muted-foreground",
                              )}
                            >
                              {CUSTOMER_STATUS[s].label}
                            </p>
                            {isCurrent && (
                              <p className="mt-0.5 text-xs text-primary">Current status</p>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>

                {/* What we know */}
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <MessageSquareText className="size-3.5" />
                    What we know
                  </h3>
                  <p className="whitespace-pre-line rounded-lg border border-border bg-secondary/40 p-3 text-sm leading-relaxed text-card-foreground">
                    {bug.actual}
                  </p>
                </div>
              </div>

              {/* Footer vote bar */}
              <div className="flex items-center justify-between gap-3 border-t border-border bg-background/40 p-4">
                <p className="text-sm text-muted-foreground">
                  Affected too? Add your vote to help us prioritize.
                </p>
                <button
                  type="button"
                  onClick={onVote}
                  aria-pressed={voted}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors",
                    voted
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-secondary text-foreground hover:border-primary/50 hover:text-primary",
                  )}
                >
                  <ChevronUp className="size-4" />
                  {voted ? "Voted" : "Upvote"}
                  <span className="tabular-nums">{bug.upvotes}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
