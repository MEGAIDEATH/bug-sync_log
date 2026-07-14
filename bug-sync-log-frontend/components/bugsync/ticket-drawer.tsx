"use client"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import type { Bug, Status } from "@/lib/bugsync-data"
import { ASSIGNEES, STATUS_LABELS, TEAM } from "@/lib/bugsync-data"
import { UrgencyBadge } from "./urgency-badge"
import { Avatar } from "./avatar"
import { Button } from "@/components/ui/button"
import { X, FileCode2, Globe, ListOrdered, Check, AlertTriangle } from "lucide-react"

const STATUS_OPTIONS: Status[] = ["todo", "in-progress", "review", "done"]

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border bg-secondary px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">{language}</span>
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-chart-2/60" />
          <span className="size-2.5 rounded-full bg-chart-4/60" />
        </span>
      </div>
      <pre className="scrollbar-thin overflow-x-auto p-3">
        <code className="font-mono text-xs leading-relaxed">
          {code.split("\n").map((line, i) => {
            const isComment = line.trim().startsWith("//") || line.includes("🐛") || line.trim().startsWith("/*")
            return (
              <div key={i} className="flex">
                <span className="mr-3 select-none text-muted-foreground/50">
                  {String(i + 1).padStart(2, " ")}
                </span>
                <span className={cn(isComment ? "text-chart-2" : "text-card-foreground")}>
                  {line || " "}
                </span>
              </div>
            )
          })}
        </code>
      </pre>
    </div>
  )
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: typeof ListOrdered
  children: React.ReactNode
}) {
  return (
    <section>
      <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </h4>
      {children}
    </section>
  )
}

export function TicketDrawer({
  bug,
  onClose,
  onUpdate,
}: {
  bug: Bug | null
  onClose: () => void
  onUpdate: (id: string, patch: Partial<Bug>) => void
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

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={bug ? `Ticket ${bug.id}` : "Ticket details"}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {bug && (
          <>
            <header className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <UrgencyBadge urgency={bug.urgency} />
                  <span className="font-mono text-xs text-muted-foreground">{bug.id}</span>
                </div>
                <h2 className="mt-2 text-pretty text-lg font-bold leading-snug text-card-foreground">
                  {bug.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Avatar initials={bug.creator.initials} name={bug.creator.name} size="sm" />
                    {bug.creator.name}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 font-medium text-secondary-foreground">
                    <Globe className="size-3.5" />
                    {bug.environment}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 font-mono text-secondary-foreground">
                    <FileCode2 className="size-3.5" />
                    {bug.filePath}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Close ticket"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="scrollbar-thin grid flex-1 grid-cols-1 gap-0 overflow-y-auto md:grid-cols-[1fr_220px]">
              <div className="flex flex-col gap-6 p-5">
                <Field label="Steps to Reproduce" icon={ListOrdered}>
                  <div className="whitespace-pre-line rounded-lg border border-border bg-secondary/40 p-3 text-sm leading-relaxed text-card-foreground">
                    {bug.stepsToReproduce}
                  </div>
                </Field>

                <Field label="Expected Behavior" icon={Check}>
                  <div className="rounded-lg border border-chart-4/30 bg-chart-4/5 p-3 text-sm leading-relaxed text-card-foreground">
                    {bug.expected}
                  </div>
                </Field>

                <Field label="Actual Behavior" icon={AlertTriangle}>
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm leading-relaxed text-card-foreground">
                    {bug.actual}
                  </div>
                  <div className="mt-3">
                    <CodeBlock code={bug.codeSnippet} language={bug.language} />
                  </div>
                </Field>
              </div>

              <aside className="flex flex-col gap-5 border-t border-border bg-secondary/20 p-5 md:border-l md:border-t-0">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Assignee
                  </span>
                  <select
                    value={bug.assignee ?? "Unassigned"}
                    onChange={(e) =>
                      onUpdate(bug.id, {
                        assignee: e.target.value === "Unassigned" ? null : e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                  >
                    {ASSIGNEES.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sprint Assignment
                  </span>
                  <select
                    value={bug.location}
                    onChange={(e) =>
                      onUpdate(bug.id, { location: e.target.value as Bug["location"] })
                    }
                    className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                  >
                    <option value="triage">Triage Pool</option>
                    <option value="sprint">Current Sprint</option>
                  </select>
                </label>

                <div>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onUpdate(bug.id, { status: s })}
                        className={cn(
                          "flex items-center justify-between rounded-md border px-2.5 py-2 text-sm transition-colors",
                          bug.status === s
                            ? "border-primary bg-primary/15 font-medium text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        {STATUS_LABELS[s]}
                        {bug.status === s && <Check className="size-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-auto rounded-lg border border-border bg-card p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Upvotes</p>
                  <p className="mt-0.5 text-2xl font-bold tabular-nums text-card-foreground">
                    +{bug.upvotes}
                  </p>
                  <div className="mt-2 flex -space-x-2">
                    {TEAM.slice(0, 4).map((u) => (
                      <Avatar
                        key={u.id}
                        initials={u.initials}
                        name={u.name}
                        size="sm"
                        className="ring-2 ring-card"
                      />
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
