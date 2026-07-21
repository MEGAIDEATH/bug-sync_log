"use client"

import { cn } from "@/lib/utils"
import type { Bug, Status } from "@/lib/bugsync-data"
import { StatusPill, CUSTOMER_STATUS } from "./portal-meta"
import { Button } from "@/components/ui/button"
import { Inbox, PenLine, ChevronRight } from "lucide-react"

const FLOW: Status[] = ["todo", "in-progress", "review", "done"]

function Timeline({ status }: { status: Status }) {
  const currentIdx = FLOW.indexOf(status)
  return (
    <div className="flex items-center gap-1.5">
      {FLOW.map((s, i) => {
        const reached = i <= currentIdx
        return (
          <div key={s} className="flex flex-1 items-center gap-1.5">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full transition-colors",
                reached ? CUSTOMER_STATUS[s].dot : "bg-border",
              )}
            />
            {i < FLOW.length - 1 && (
              <span
                className={cn("h-0.5 flex-1 rounded-full", i < currentIdx ? "bg-primary/50" : "bg-border")}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function MyReports({
  bugs,
  onOpen,
  onReport,
}: {
  bugs: Bug[]
  onOpen: (id: string) => void
  onReport: () => void
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">My reports</h2>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          Track the issues you&apos;ve submitted and watch them move toward a fix.
        </p>
      </div>

      {bugs.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Inbox className="size-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">No reports yet</p>
          <p className="mt-1 max-w-xs text-pretty text-sm text-muted-foreground">
            When you report a bug, it&apos;ll show up here so you can follow its progress.
          </p>
          <Button onClick={onReport} className="mt-5 gap-1.5">
            <PenLine className="size-4" />
            Report your first bug
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bugs.map((bug) => (
            <button
              key={bug.id}
              type="button"
              onClick={() => onOpen(bug.id)}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">{bug.id}</p>
                  <h3 className="mt-0.5 text-pretty text-sm font-semibold leading-snug text-card-foreground">
                    {bug.title}
                  </h3>
                </div>
                <StatusPill status={bug.status} />
              </div>
              <Timeline status={bug.status} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Submitted {bug.reportedAt} · {bug.upvotes} vote{bug.upvotes === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-0.5 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  View details
                  <ChevronRight className="size-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
