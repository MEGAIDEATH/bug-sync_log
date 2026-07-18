"use client"

import { useMemo, useState } from "react"
import { PortalHeader, type PortalTab } from "@/components/portal/portal-header"
import { PortalHero } from "@/components/portal/portal-hero"
import { IssueList } from "@/components/portal/issue-list"
import { ReportForm } from "@/components/portal/report-form"
import { MyReports } from "@/components/portal/my-reports"
import { IssueDetail } from "@/components/portal/issue-detail"
import { reportBug, toggleVote } from "@/app/actions/bugs"

type HelpCenterBug = {
  id: number
  ref: string
  title: string
  urgency: string
  priority: string
  status: string
  environment: string
  filePath: string | null
  reporterId: string
  reporterName: string
  assigneeId: string | null
  assigneeName: string | null
  location: string
  upvotes: number
  hasVoted: boolean
  createdAt: Date
}

type HelpCenterClientProps = {
  project: { slug: string; name: string; color: string }
  bugs: HelpCenterBug[]
  projectId: number
}

export function HelpCenterClient({ project, bugs: initialBugs, projectId }: HelpCenterClientProps) {
  const [bugs, setBugs] = useState(initialBugs)
  const [tab, setTab] = useState<PortalTab>("issues")
  const [query, setQuery] = useState("")
  const [openId, setOpenId] = useState<number | null>(null)

  const openCount = useMemo(() => bugs.filter((b) => !["fixed", "closed", "rejected", "duplicate"].includes(b.status)).length, [bugs])
  const fixedCount = useMemo(() => bugs.filter((b) => b.status === "fixed" || b.status === "closed").length, [bugs])

  const filteredBugs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return bugs
    return bugs.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.ref.toLowerCase().includes(q) ||
        b.reporterName.toLowerCase().includes(q),
    )
  }, [bugs, query])

  const myBugIds = useMemo(() => {
    // In a full implementation, this would be tracked per user session
    return new Set<number>()
  }, [])

  const myBugs = useMemo(
    () => bugs.filter((b) => myBugIds.has(b.id)),
    [bugs, myBugIds],
  )

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

  const handleReport = async (data: {
    title: string
    description: string
    area: string
    impact: string
    email: string
  }) => {
    const formData = new FormData()
    formData.set("title", data.title)
    formData.set("urgency", data.impact)
    formData.set("environment", data.area)
    formData.set("stepsToReproduce", data.description)
    formData.set("expected", "")
    formData.set("actual", data.description)

    try {
      await reportBug(projectId, project.slug, formData)
      setTab("issues")
      // In a full implementation, we'd refetch the bugs list
    } catch {
      // silently fail
    }
  }

  const openBug = bugs.find((b) => b.id === openId) ?? null

  // Transform bugs to the format expected by existing portal components
  const portalBugs = bugs.map((b) => ({
    id: b.ref,
    title: b.title,
    urgency: b.urgency as "blocker" | "critical" | "minor",
    priority: b.priority,
    upvotes: b.upvotes,
    environment: b.environment,
    filePath: b.filePath ?? "unknown",
    reportedAt: new Date(b.createdAt).toLocaleDateString(),
    creator: { id: b.reporterId, name: b.reporterName, initials: b.reporterName.charAt(0).toUpperCase() },
    assignee: b.assigneeName,
    status: b.status,
    location: b.location as "triage" | "sprint",
    stepsToReproduce: "",
    expected: "",
    actual: "",
    codeSnippet: "",
    language: "text",
  }))

  return (
    <main className="min-h-dvh bg-background">
      <PortalHeader
        active={tab}
        onSelect={setTab}
        myCount={myBugs.length}
      />

      {tab === "issues" && (
        <>
          <PortalHero
            query={query}
            onQueryChange={setQuery}
            openCount={openCount}
            fixedCount={fixedCount}
          />
          <IssueList
            bugs={portalBugs}
            query={query}
            votes={new Set(bugs.filter((b) => b.hasVoted).map((b) => b.ref))}
            onVote={(id) => {
              const bug = bugs.find((b) => b.ref === id)
              if (bug) handleVote(bug.id)
            }}
            onOpen={(id) => {
              const bug = bugs.find((b) => b.ref === id)
              if (bug) setOpenId(bug.id)
            }}
          />
        </>
      )}

      {tab === "report" && (
        <ReportForm onSubmit={handleReport} />
      )}

      {tab === "mine" && (
        <MyReports bugs={portalBugs.filter((b) => myBugIds.has(bugs.find((x) => x.ref === b.id)?.id ?? -1))} onOpen={() => {}} onReport={() => setTab("report")} />
      )}

      {openBug && (
        <IssueDetail
          bug={portalBugs.find((b) => b.id === openBug.ref) ?? null}
          voted={openBug.hasVoted}
          onVote={() => handleVote(openBug.id)}
          onClose={() => setOpenId(null)}
        />
      )}

      <footer className="border-t border-border/70 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          {project.name} Help Center · Powered by BugSync
        </p>
      </footer>
    </main>
  )
}