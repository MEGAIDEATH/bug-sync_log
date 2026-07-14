"use client"

import { cn } from "@/lib/utils"
import type { Bug, Urgency } from "@/lib/bugsync-data"
import { URGENCY_LABELS } from "@/lib/bugsync-data"
import { UpvoteButton } from "./upvote-button"
import { Avatar } from "./avatar"
import { Button } from "@/components/ui/button"
import { ArrowRight, CalendarDays, FileCode2, Server } from "lucide-react"

// Each priority paints the whole tile like a colored button.
const TILE: Record<
  Urgency,
  { surface: string; idChip: string; priorityChip: string; meta: string }
> = {
  blocker: {
    surface:
      "border-destructive/50 bg-destructive/12 hover:bg-destructive/20 hover:border-destructive",
    idChip: "bg-destructive text-destructive-foreground",
    priorityChip: "bg-destructive/25 text-destructive border border-destructive/50",
    meta: "text-destructive/80",
  },
  critical: {
    surface:
      "border-chart-2/50 bg-chart-2/12 hover:bg-chart-2/20 hover:border-chart-2",
    idChip: "bg-chart-2 text-background",
    priorityChip: "bg-chart-2/25 text-chart-2 border border-chart-2/50",
    meta: "text-chart-2/80",
  },
  minor: {
    surface: "border-border bg-secondary hover:bg-accent hover:border-muted-foreground/40",
    idChip: "bg-muted-foreground/80 text-background",
    priorityChip: "bg-muted text-muted-foreground border border-border",
    meta: "text-muted-foreground",
  },
}

export function BugCard({
  bug,
  onOpen,
  onUpvote,
  onQueue,
  primaryAction,
  compact = false,
  dragHandlers,
  dragging = false,
}: {
  bug: Bug
  onOpen?: () => void
  onUpvote?: () => void
  onQueue?: () => void
  primaryAction?: { label: string; onClick: () => void }
  compact?: boolean
  dragHandlers?: {
    draggable?: boolean
    onDragStart?: (e: React.DragEvent) => void
    onDragEnd?: (e: React.DragEvent) => void
  }
  dragging?: boolean
}) {
  const t = TILE[bug.urgency]

  return (
    <article
      {...dragHandlers}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen?.()
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden rounded-lg border text-left shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        t.surface,
        bug.urgency === "blocker" && "animate-blocker-flash",
        dragHandlers?.draggable && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-50 ring-2 ring-primary",
      )}
    >
      {/* Header row: ID + priority + date */}
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 font-mono text-xs font-bold tracking-tight",
              t.idChip,
            )}
          >
            {bug.id}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              t.priorityChip,
            )}
          >
            {URGENCY_LABELS[bug.urgency]}
          </span>
        </div>
        <UpvoteButton count={bug.upvotes} onUpvote={onUpvote} />
      </div>

      {/* Title */}
      <h3 className="text-pretty px-3 pt-2 text-sm font-semibold leading-snug text-card-foreground">
        {bug.title}
      </h3>

      {/* Detail strip: date, file, environment */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pb-2.5 pt-2 text-[11px] font-medium",
          t.meta,
        )}
      >
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3" />
          {bug.reportedAt}
        </span>
        <span className="inline-flex items-center gap-1">
          <Server className="size-3" />
          {bug.environment}
        </span>
        <span className="inline-flex items-center gap-1 font-mono">
          <FileCode2 className="size-3" />
          {bug.filePath}
        </span>
      </div>

      {/* Footer: creator + action */}
      <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-background/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <Avatar initials={bug.creator.initials} name={bug.creator.name} size="sm" />
          <span className="text-xs text-muted-foreground">{bug.creator.name}</span>
        </div>

        {!compact && onQueue && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onQueue()
            }}
            className="h-7 gap-1.5 text-xs"
          >
            Queue Sprint
            <ArrowRight className="size-3.5" />
          </Button>
        )}

        {primaryAction && (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              primaryAction.onClick()
            }}
            className="h-7 text-xs"
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    </article>
  )
}
