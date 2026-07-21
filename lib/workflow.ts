/**
 * Configurable bug workflow.
 *
 * Defines allowed status transitions and which roles can perform them.
 * This is designed to be extended per-project in the future without
 * requiring database schema changes.
 */

import { roleRank } from "@/lib/permissions/config"

export type StatusTransition = {
  from: string[]
  to: string
  label: string
  minRole: string // minimum role rank name
}

/** Default workflow for all projects. */
export const DEFAULT_WORKFLOW: StatusTransition[] = [
  { from: ["open"], to: "confirmed", label: "Confirm", minRole: "developer" },
  { from: ["open", "confirmed"], to: "rejected", label: "Reject", minRole: "developer" },
  { from: ["open", "confirmed"], to: "duplicate", label: "Mark Duplicate", minRole: "developer" },
  { from: ["confirmed"], to: "in-progress", label: "Start Working", minRole: "developer" },
  { from: ["in-progress"], to: "needs-review", label: "Request Review", minRole: "developer" },
  { from: ["needs-review"], to: "in-progress", label: "Reopen", minRole: "developer" },
  { from: ["needs-review"], to: "fixed", label: "Mark Fixed", minRole: "developer" },
  { from: ["fixed"], to: "closed", label: "Close", minRole: "admin" },
  { from: ["fixed", "closed", "rejected", "duplicate"], to: "open", label: "Reopen", minRole: "developer" },
]

/** Get available transitions for a given status and role. */
export function getAvailableTransitions(
  currentStatus: string,
  role: string,
  workflow: StatusTransition[] = DEFAULT_WORKFLOW,
): StatusTransition[] {
  const userRank = roleRank(role)

  return workflow.filter(
    (t) =>
      t.from.includes(currentStatus) &&
      userRank >= roleRank(t.minRole),
  )
}

/** Human-readable label for a status. */
export const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  confirmed: "Confirmed",
  "in-progress": "In Progress",
  "needs-review": "Needs Review",
  fixed: "Fixed",
  closed: "Closed",
  rejected: "Rejected",
  duplicate: "Duplicate",
}

/** Color for a status badge. */
export const STATUS_COLORS: Record<string, string> = {
  open: "#6b7280",
  confirmed: "#f59e0b",
  "in-progress": "#3b82f6",
  "needs-review": "#8b5cf6",
  fixed: "#10b981",
  closed: "#6b7280",
  rejected: "#ef4444",
  duplicate: "#6b7280",
}