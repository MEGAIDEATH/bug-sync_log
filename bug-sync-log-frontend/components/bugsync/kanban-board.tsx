"use client"

import { useState } from "react"
import type { Bug, Status } from "@/lib/bugsync-data"
import { STATUS_LABELS } from "@/lib/bugsync-data"
import { BugCard } from "./bug-card"
import { cn } from "@/lib/utils"
import { Timer } from "lucide-react"

const COLUMNS: Status[] = ["todo", "in-progress", "review", "done"]

const COLUMN_ACCENT: Record<Status, string> = {
  todo: "bg-muted-foreground",
  "in-progress": "bg-primary",
  review: "bg-chart-2",
  done: "bg-chart-4",
}

export function KanbanBoard({
  bugs,
  daysRemaining,
  locked,
  onMove,
  onOpen,
}: {
  bugs: Bug[]
  daysRemaining: number
  locked: boolean
  onMove: (id: string, status: Status) => void
  onOpen: (id: string) => void
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<Status | null>(null)

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Active Sprint Kanban</h1>
          <p className="text-sm text-muted-foreground">
            Drag cards across columns to update their lifecycle.
          </p>
        </div>
        {locked && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-chart-4/40 bg-chart-4/10 px-2.5 py-1 text-xs font-semibold text-chart-4">
            <Timer className="size-3.5" />
            {daysRemaining} Days Remaining
          </span>
        )}
      </header>

      {bugs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-5 text-center">
          <div className="rounded-xl border border-dashed border-border px-8 py-16">
            <p className="text-sm font-medium text-foreground">No active sprint yet.</p>
            <p className="text-sm text-muted-foreground">
              Commit bugs in Sprint Planning to populate this board.
            </p>
          </div>
        </div>
      ) : (
        <div className="scrollbar-thin flex-1 overflow-x-auto p-5">
          <div className="grid h-full min-w-[720px] grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const colBugs = bugs.filter((b) => b.status === col)
              return (
                <div
                  key={col}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setOverCol(col)
                  }}
                  onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
                  onDrop={() => {
                    if (draggingId) onMove(draggingId, col)
                    setDraggingId(null)
                    setOverCol(null)
                  }}
                  className={cn(
                    "flex min-h-0 flex-col rounded-xl border border-border bg-secondary/20 transition-colors",
                    overCol === col && "border-primary bg-primary/5",
                  )}
                >
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                    <span className={cn("size-2 rounded-full", COLUMN_ACCENT[col])} />
                    <h2 className="text-sm font-semibold text-foreground">{STATUS_LABELS[col]}</h2>
                    <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {colBugs.length}
                    </span>
                  </div>
                  <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-3">
                    {colBugs.map((bug) => (
                      <BugCard
                        key={bug.id}
                        bug={bug}
                        compact
                        onOpen={() => onOpen(bug.id)}
                        dragging={draggingId === bug.id}
                        dragHandlers={{
                          draggable: true,
                          onDragStart: () => setDraggingId(bug.id),
                          onDragEnd: () => {
                            setDraggingId(null)
                            setOverCol(null)
                          },
                        }}
                      />
                    ))}
                    {colBugs.length === 0 && (
                      <p className="py-8 text-center text-xs text-muted-foreground">
                        Drop here
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
