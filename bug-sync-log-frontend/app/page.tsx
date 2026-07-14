"use client"

import { useMemo, useState } from "react"
import type { Bug, Status } from "@/lib/bugsync-data"
import { BUGS } from "@/lib/bugsync-data"
import { Sidebar, type ScreenId } from "@/components/bugsync/sidebar"
import { TriageDashboard } from "@/components/bugsync/triage-dashboard"
import { SprintPlanning } from "@/components/bugsync/sprint-planning"
import { KanbanBoard } from "@/components/bugsync/kanban-board"
import { TicketDrawer } from "@/components/bugsync/ticket-drawer"

let reportCount = 0

export default function Page() {
  const [bugs, setBugs] = useState<Bug[]>(BUGS)
  const [screen, setScreen] = useState<ScreenId>("triage")
  const [query, setQuery] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)
  const [sprintLocked, setSprintLocked] = useState(false)
  const daysRemaining = 5

  const updateBug = (id: string, patch: Partial<Bug>) =>
    setBugs((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))

  const upvote = (id: string) =>
    setBugs((prev) => prev.map((b) => (b.id === id ? { ...b, upvotes: b.upvotes + 1 } : b)))

  const triageBugs = useMemo(
    () => bugs.filter((b) => b.location === "triage").sort((a, b) => b.upvotes - a.upvotes),
    [bugs],
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
    () => bugs.filter((b) => b.location === "sprint").sort((a, b) => b.upvotes - a.upvotes),
    [bugs],
  )

  const reportBug = () => {
    reportCount += 1
    const id = `BUG-${500 + reportCount}`
    const creator = BUGS[reportCount % BUGS.length].creator
    const newBug: Bug = {
      id,
      title: "New bug report — describe what went wrong",
      urgency: "minor",
      upvotes: 0,
      environment: "Local",
      filePath: "src/untriaged.ts",
      reportedAt: "Today",
      creator,
      assignee: null,
      status: "todo",
      location: "triage",
      stepsToReproduce: "1. …\n2. …",
      expected: "Describe the expected behavior.",
      actual: "Describe what actually happened.",
      codeSnippet: "// paste the offending code here",
      language: "typescript",
    }
    setBugs((prev) => [newBug, ...prev])
    setOpenId(id)
  }

  const openBug = bugs.find((b) => b.id === openId) ?? null

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
            onReportBug={reportBug}
            onOpen={setOpenId}
            onUpvote={upvote}
            onQueue={(id) => updateBug(id, { location: "sprint" })}
          />
        )}

        {screen === "planning" && (
          <SprintPlanning
            triageBugs={triageBugs}
            sprintBugs={sprintBugs}
            locked={sprintLocked}
            daysRemaining={daysRemaining}
            onMove={(id, to) => updateBug(id, { location: to })}
            onStartSprint={() => setSprintLocked(true)}
            onOpen={setOpenId}
          />
        )}

        {screen === "kanban" && (
          <KanbanBoard
            bugs={sprintBugs}
            daysRemaining={daysRemaining}
            locked={sprintLocked}
            onMove={(id, status: Status) => updateBug(id, { status })}
            onOpen={setOpenId}
          />
        )}
      </div>

      <TicketDrawer bug={openBug} onClose={() => setOpenId(null)} onUpdate={updateBug} />
    </main>
  )
}
