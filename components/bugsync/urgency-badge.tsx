import { cn } from "@/lib/utils"
import type { Urgency } from "@/lib/bugsync-data"
import { URGENCY_LABELS } from "@/lib/bugsync-data"

const STYLES: Record<Urgency, string> = {
  blocker:
    "bg-destructive/15 text-destructive border-destructive/40 animate-blocker-flash",
  critical: "bg-chart-2/15 text-chart-2 border-chart-2/40",
  minor: "bg-muted text-muted-foreground border-border",
}

export function UrgencyBadge({
  urgency,
  className,
}: {
  urgency: Urgency
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        STYLES[urgency],
        className,
      )}
    >
      {urgency === "blocker" && (
        <span className="size-1.5 rounded-full bg-destructive" aria-hidden />
      )}
      {URGENCY_LABELS[urgency]}
    </span>
  )
}
