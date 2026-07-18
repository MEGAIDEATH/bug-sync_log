import { cn } from "@/lib/utils"
import type { Status, Urgency } from "@/lib/bugsync-data"
import { CircleDot, Loader2, Search, CheckCircle2 } from "lucide-react"

// Friendly, customer-facing translations of the internal dev states.
export const CUSTOMER_STATUS: Record<
  Status,
  { label: string; className: string; icon: typeof CircleDot; dot: string }
> = {
  open: {
    label: "Open",
    className: "border-border bg-secondary text-muted-foreground",
    icon: CircleDot,
    dot: "bg-muted-foreground",
  },
  todo: {
    label: "Received",
    className: "border-border bg-secondary text-muted-foreground",
    icon: CircleDot,
    dot: "bg-muted-foreground",
  },
  "in-progress": {
    label: "Being Fixed",
    className: "border-primary/40 bg-primary/10 text-primary",
    icon: Loader2,
    dot: "bg-primary",
  },
  review: {
    label: "In Review",
    className: "border-chart-2/40 bg-chart-2/10 text-chart-2",
    icon: Search,
    dot: "bg-chart-2",
  },
  done: {
    label: "Fixed",
    className: "border-chart-4/40 bg-chart-4/10 text-chart-4",
    icon: CheckCircle2,
    dot: "bg-chart-4",
  },
}

export const CUSTOMER_IMPACT: Record<Urgency, { label: string; className: string }> = {
  blocker: { label: "Critical impact", className: "text-destructive" },
  critical: { label: "High impact", className: "text-chart-2" },
  minor: { label: "Low impact", className: "text-muted-foreground" },
}

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const s = CUSTOMER_STATUS[status]
  const Icon = s.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        s.className,
        className,
      )}
    >
      <Icon className={cn("size-3.5", status === "in-progress" && "animate-spin")} />
      {s.label}
    </span>
  )
}
