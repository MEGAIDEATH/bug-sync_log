"use client"

import { useEffect, useState } from "react"
import type { Bug } from "@/lib/bugsync-data"
import { BugCard } from "./bug-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Lock, Inbox, Target, ArrowRight, CheckCircle2, Timer } from "lucide-react"

export function SprintPlanning({
  triageBugs,
  sprintBugs,
  locked,
  daysRemaining,
  onMove,
  onStartSprint,
  onOpen,
}: {
  triageBugs: Bug[]
  sprintBugs: Bug[]
  locked: boolean
  daysRemaining: number
  onMove: (id: string, to: "triage" | "sprint") => void
  onStartSprint: () => void
  onOpen: (id: string) => void
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overSprint, setOverSprint] = useState(false)
  const [justLocked, setJustLocked] = useState(false)

  useEffect(() => {
    if (locked) {
      setJustLocked(true)
      const t = window.setTimeout(() => setJustLocked(false), 2200)
      return () => window.clearTimeout(t)
    }
  }, [locked])

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-5 py-4">
        <h1 className="text-xl font-bold text-foreground">Sprint Planning</h1>
        <p className="text-sm text-muted-foreground">
          Drag bugs from the pool into the commitment column, then lock the sprint.
        </p>
      </header>

      <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
        {/* Left: Triage Pool */}
        <section className="flex min-h-0 flex-col border-b border-border md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-4 py-3">
            <Inbox className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Triage Pool</h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {triageBugs.length}
            </span>
          </div>
          <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
            {triageBugs.map((bug) => (
              <BugCard
                key={bug.id}
                bug={bug}
                compact
                onOpen={() => onOpen(bug.id)}
                dragging={draggingId === bug.id}
                primaryAction={
                  locked ? undefined : { label: "Add →", onClick: () => onMove(bug.id, "sprint") }
                }
                dragHandlers={
                  locked
                    ? undefined
                    : {
                        draggable: true,
                        onDragStart: () => setDraggingId(bug.id),
                        onDragEnd: () => {
                          setDraggingId(null)
                          setOverSprint(false)
                        },
                      }
                }
              />
            ))}
            {triageBugs.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Pool is empty — everything is committed.
              </p>
            )}
          </div>
        </section>

        {/* Right: Sprint Commitment */}
        <section
          className={cn(
            "flex min-h-0 flex-col transition-colors",
            overSprint && !locked && "bg-primary/5",
          )}
          onDragOver={(e) => {
            if (locked) return
            e.preventDefault()
            setOverSprint(true)
          }}
          onDragLeave={() => setOverSprint(false)}
          onDrop={() => {
            if (locked || !draggingId) return
            onMove(draggingId, "sprint")
            setDraggingId(null)
            setOverSprint(false)
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Upcoming Sprint Commitment</h2>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                {sprintBugs.length}
              </span>
            </div>
            {locked ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-chart-4/40 bg-chart-4/10 px-2.5 py-1 text-xs font-semibold text-chart-4">
                <Timer className="size-3.5" />
                {daysRemaining} Days Remaining
              </span>
            ) : (
              <Button
                size="sm"
                onClick={onStartSprint}
                disabled={sprintBugs.length === 0}
                className="gap-1.5"
              >
                <Lock className="size-3.5" />
                Start Sprint
              </Button>
            )}
          </div>

          <div className="scrollbar-thin relative flex-1 overflow-y-auto p-4">
            {justLocked && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-chart-4/40 bg-chart-4/10 p-3 text-sm font-medium text-chart-4">
                <CheckCircle2 className="size-4" />
                Sprint locked! {sprintBugs.length} bugs committed.
              </div>
            )}

            {sprintBugs.length === 0 ? (
              <div
                className={cn(
                  "flex h-full min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors",
                  overSprint ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <ArrowRight className="mb-2 size-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Drop bugs here</p>
                <p className="text-sm text-muted-foreground">
                  Drag from the Triage Pool or use the &ldquo;Add&rdquo; button.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sprintBugs.map((bug) => (
                  <BugCard
                    key={bug.id}
                    bug={bug}
                    compact
                    onOpen={() => onOpen(bug.id)}
                    primaryAction={
                      locked ? undefined : { label: "Remove", onClick: () => onMove(bug.id, "triage") }
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
