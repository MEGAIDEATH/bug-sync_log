"use client"

import { useMemo, useState } from "react"
import type { Bug, Status, Urgency } from "@/lib/bugsync-data"
import { BUGS, TEAM } from "@/lib/bugsync-data"

// Customer portal shows a lively mix of progress states without mutating
// the team dashboard's own data. Keyed by bug id, falls back to "todo".
const PORTAL_STATUS_SEED: Record<string, Status> = {
  "BUG-412": "in-progress",
  "BUG-398": "review",
  "BUG-419": "in-progress",
  "BUG-401": "done",
  "BUG-377": "review",
  "BUG-340": "done",
}

const SEEDED_BUGS: Bug[] = BUGS.map((b) => ({
  ...b,
  status: PORTAL_STATUS_SEED[b.id] ?? b.status,
}))
import { PortalHeader, type PortalTab } from "@/components/portal/portal-header"
import { PortalHero } from "@/components/portal/portal-hero"
import { IssueList } from "@/components/portal/issue-list"
import { ReportForm } from "@/components/portal/report-form"
import { MyReports } from "@/components/portal/my-reports"
import { IssueDetail } from "@/components/portal/issue-detail"

let publicReportCount = 0

export default function PortalPage() {
  const [bugs, setBugs] = useState<Bug[]>(SEEDED_BUGS)
  const [tab, setTab] = useState<PortalTab>("issues")
  const [query, setQuery] = useState("")
  const [votes, setVotes] = useState<Set<string>>(new Set())
  const [mineIds, setMineIds] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)

  const openCount = useMemo(() => bugs.filter((b) => b.status !== "done").length, [bugs])
  const fixedCount = useMemo(() => bugs.filter((b) => b.status === "done").length, [bugs])
  const myBugs = useMemo(
    () => mineIds.map((id) => bugs.find((b) => b.id === id)).filter(Boolean) as Bug[],
    [mineIds, bugs],
  )

  const toggleVote = (id: string) => {
    setVotes((prev) => {
      const next = new Set(prev)
      const has = next.has(id)
      if (has) next.delete(id)
      else next.add(id)
      setBugs((bs) => bs.map((b) => (b.id === id ? { ...b, upvotes: b.upvotes + (has ? -1 : 1) } : b)))
      return next
    })
  }

  const submitReport = (data: {
    title: string
    description: string
    area: string
    impact: Urgency
    email: string
  }) => {
    publicReportCount += 1
    const id = `BUG-${700 + publicReportCount}`
    const newBug: Bug = {
      id,
      title: data.title,
      urgency: data.impact,
      upvotes: 1,
      environment: "Production",
      filePath: data.area,
      reportedAt: "Just now",
      creator: TEAM[publicReportCount % TEAM.length],
      assignee: null,
      status: "todo",
      location: "triage",
      stepsToReproduce: data.description,
      expected: "Works as expected.",
      actual: data.description,
      codeSnippet: "// pending investigation",
      language: "text",
    }
    setBugs((prev) => [newBug, ...prev])
    setMineIds((prev) => [id, ...prev])
    setVotes((prev) => new Set(prev).add(id))
  }

  const openBug = bugs.find((b) => b.id === openId) ?? null

  return (
    <main className="min-h-dvh bg-background">
      <PortalHeader active={tab} onSelect={setTab} myCount={mineIds.length} />

      {tab === "issues" && (
        <>
          <PortalHero
            query={query}
            onQueryChange={setQuery}
            openCount={openCount}
            fixedCount={fixedCount}
          />
          <IssueList
            bugs={bugs}
            query={query}
            votes={votes}
            onVote={toggleVote}
            onOpen={setOpenId}
          />
        </>
      )}

      {tab === "report" && <ReportForm onSubmit={submitReport} />}

      {tab === "mine" && (
        <MyReports bugs={myBugs} onOpen={setOpenId} onReport={() => setTab("report")} />
      )}

      <IssueDetail
        bug={openBug}
        voted={openId ? votes.has(openId) : false}
        onVote={() => openId && toggleVote(openId)}
        onClose={() => setOpenId(null)}
      />

      <footer className="border-t border-border/70 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          BugSync Help Center · Powered by the same log your team ships from.
        </p>
      </footer>
    </main>
  )
}
