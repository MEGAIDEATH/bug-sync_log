"use client"

import { useMemo, useState, useCallback } from "react"
import type { Bug as PortalBug } from "@/lib/bugsync-data"
import { Sidebar, type ScreenId } from "@/components/bugsync/sidebar"
import { TriageDashboard } from "@/components/bugsync/triage-dashboard"
import { SprintPlanning } from "@/components/bugsync/sprint-planning"
import { KanbanBoard } from "@/components/bugsync/kanban-board"
import { TicketDrawer } from "@/components/bugsync/ticket-drawer"
import { updateBugStatus, toggleVote } from "@/app/actions/bugs"
import { hasPermission } from "@/lib/permissions/config"
import { STATUS_LABELS } from "@/lib/workflow"

type BoardBug = {
  id: number
  ref: string
  title: string
  urgency: string
  priority: string
  status: string
  environment: string
  filePath: string | null
  stepsToReproduce: string | null
  expected: string | null
  actual: string | null
  codeSnippet: string | null
  language: string | null
  reporterId: string
  reporterName: string
  assigneeId: string | null
  assigneeName: string | null
  location: string
  upvotes: number
  hasVoted: boolean
  createdAt: Date
}

type BoardClientProps = {
  project: { slug: string; name: string; color: string; id: number }
  bugs: BoardBug[]
  projectId: number
  currentUserId: string
  role: string
}

export function BoardClient({ project, bugs: initialBugs, projectId, currentUserId, role }: BoardClientProps) {
  const [bugs, setBugs] = useState(initialBugs)
  const [screen, setScreen] = useState<ScreenId>("triage")
  const [query, setQuery] = useState("")
  const [openId, setOpenId] = useState<number | null>(null)
  const [sprintLocked, setSprintLocked] = useState(false)
  const daysRemaining = 5

  const canChangeStatus = hasPermission(role, "bug.update.status")
  const canAssign = hasPermission(role, "bug.assign")
  const canModifyAny = hasPermission(role, "bug.modifyAny")

  const updateBug = useCallback((id: number, patch: Partial<BoardBug>) => {
    setBugs((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }, [])

  const handleStatusChange = async (bugId: number, newStatus: string) => {
    try {
      await updateBugStatus(projectId, project.slug, bugId, newStatus)
      updateBug(bugId, { status: newStatus })
    } catch {
      // silently fail
    }
  }

  const handleVote = async (bugId: number) => {
    try {
      await toggleVote(projectId, project.slug, bugId)
      setBugs((prev) =>
        prev.map((b) =>
          b.id === bugId
            ? { ...b, hasVoted: !b.hasVoted, upvotes: b.upvotes + (b.hasVoted ? -1 : 1) }
            : b,
        ),
      )
    } catch {
      // silently fail
    }
  }

  // Transform to the format expected by existing workspace components
  const workspaceBugs: PortalBug[] = useMemo(() =>
    bugs.map((b) => ({
      id: b.ref,
      title: b.title,
      urgency: (["blocker", "critical", "minor"].includes(b.urgency) ? b.urgency : "minor") as "blocker" | "critical" | "minor",
      priority: b.priority,
      upvotes: b.upvotes,
      environment: b.environment,
      filePath: b.filePath ?? "unknown",
      reportedAt: new Date(b.createdAt).toLocaleDateString(),
      creator: { id: b.reporterId, name: b.reporterName, initials: b.reporterName.charAt(0).toUpperCase() },
      assignee: b.assigneeName,
      status: b.status,
      location: (b.location === "triage" || b.location === "sprint" ? b.location : "triage") as "triage" | "sprint",
      stepsToReproduce: b.stepsToReproduce ?? "",
      expected: b.expected ?? "",
      actual: b.actual ?? "",
      codeSnippet: b.codeSnippet ?? "",
      language: b.language ?? "text",
    })),
  [bugs])

  const triageBugs = useMemo(
    () => workspaceBugs.filter((b) => b.location === "triage").sort((a, b) => b.upvotes - a.upvotes),
    [workspaceBugs],
  )

  const filteredTriage = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return triageBugs
    return triageBugs.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.filePath.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q),
    )
  }, [triageBugs, query])

  const sprintBugs = useMemo(
    () => workspaceBugs.filter((b) => b.location === "sprint").sort((a, b) => b.upvotes - a.upvotes),
    [workspaceBugs],
  )

  const openBug = workspaceBugs.find((b) => b.id === bugs.find((x) => x.id === openId)?.ref) ?? null

  return (
    <main className="flex h-dvh overflow-hidden bg-background">
      <Sidebar
        active={screen}
        onSelect={setScreen}
        triageCount={triageBugs.length}
        sprintCount={sprintBugs.length}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {screen === "triage" && (
          <TriageDashboard
            bugs={filteredTriage}
            query={query}
            onQueryChange={setQuery}
            onReportBug={() => {}}
            onOpen={(id) => {
              const bug = bugs.find((b) => b.ref === id)
              if (bug) setOpenId(bug.id)
            }}
            onUpvote={(id) => {
              const bug = bugs.find((b) => b.ref === id)
              if (bug) handleVote(bug.id)
            }}
            onQueue={(id) => {
              const bug = bugs.find((b) => b.ref === id)
              if (bug) updateBug(bug.id, { location: "sprint" })
            }}
          />
        )}

        {screen === "planning" && (
          <SprintPlanning
            triageBugs={triageBugs}
            sprintBugs={sprintBugs}
            locked={sprintLocked}
            daysRemaining={daysRemaining}
            onMove={(id, to) => {
              const bug = bugs.find((b) => b.ref === id)
              if (bug) updateBug(bug.id, { location: to as "triage" | "sprint" })
            }}
            onStartSprint={() => setSprintLocked(true)}
            onOpen={(id) => {
              const bug = bugs.find((b) => b.ref === id)
              if (bug) setOpenId(bug.id)
            }}
          />
        )}

        {screen === "kanban" && (
          <KanbanBoard
            bugs={sprintBugs}
            daysRemaining={daysRemaining}
            locked={sprintLocked}
            onMove={(id, status: string) => {
              if (canChangeStatus) {
                const bug = bugs.find((b) => b.ref === id)
                if (bug) handleStatusChange(bug.id, status)
              }
            }}
            onOpen={(id) => {
              const bug = bugs.find((b) => b.ref === id)
              if (bug) setOpenId(bug.id)
            }}
          />
        )}
      </div>

      <TicketDrawer
        bug={openBug}
        onClose={() => setOpenId(null)}
        onUpdate={(id, patch) => {
          const bug = bugs.find((b) => b.ref === id)
          if (bug && (canModifyAny || bug.assigneeId === currentUserId)) {
            updateBug(bug.id, patch as Partial<BoardBug>)
          }
        }}
      />
    </main>
  )
}