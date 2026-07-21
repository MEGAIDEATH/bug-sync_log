"use server"

import { db } from "@/lib/db"
import { bug, label, bugLabel } from "@/lib/db/schema"
import { requireProjectAccess } from "@/lib/rbac"
import { and, desc, eq, ilike, or, sql, inArray } from "drizzle-orm"

export type SearchFilters = {
  query?: string
  status?: string[]
  priority?: string[]
  urgency?: string[]
  assigneeId?: string
  reporterId?: string
  labelIds?: number[]
  location?: string
}

export type SearchResult = {
  id: number
  ref: string
  title: string
  status: string
  priority: string
  urgency: string
  upvotes: number
  assigneeName: string | null
  reporterName: string
  createdAt: Date
  labels: { id: number; name: string; color: string }[]
  matchReason?: string
}

/**
 * Search bugs across a project with full-text search and filters.
 * Supports pagination for scalability.
 */
export async function searchBugs(
  projectId: number,
  filters: SearchFilters,
  page = 1,
  pageSize = 50,
): Promise<{ results: SearchResult[]; total: number; page: number; pageSize: number }> {
  await requireProjectAccess(projectId, "bug.view")

  const conditions = [eq(bug.projectId, projectId)]

  // Full-text search on title, description, steps, expected, actual
  if (filters.query?.trim()) {
    const q = `%${filters.query.trim()}%`
    const searchCondition = or(
      ilike(bug.title, q),
      ilike(bug.ref, q),
      ilike(bug.reporterName, q),
      ilike(bug.environment, q),
    )
    if (searchCondition) {
      conditions.push(searchCondition)
    }
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    conditions.push(inArray(bug.status, filters.status))
  }

  // Priority filter
  if (filters.priority && filters.priority.length > 0) {
    conditions.push(inArray(bug.priority, filters.priority))
  }

  // Urgency filter
  if (filters.urgency && filters.urgency.length > 0) {
    conditions.push(inArray(bug.urgency, filters.urgency))
  }

  // Assignee filter
  if (filters.assigneeId) {
    conditions.push(eq(bug.assigneeId, filters.assigneeId))
  }

  // Reporter filter
  if (filters.reporterId) {
    conditions.push(eq(bug.reporterId, filters.reporterId))
  }

  // Location filter
  if (filters.location) {
    conditions.push(eq(bug.location, filters.location))
  }

  // Label filter — join through bug_label table
  let labelFilterJoin = false
  if (filters.labelIds && filters.labelIds.length > 0) {
    labelFilterJoin = true
    // Subquery: find bug IDs that have ALL specified label IDs
    const subquery = db
      .select({ bugId: bugLabel.bugId })
      .from(bugLabel)
      .where(
        and(
          inArray(bugLabel.labelId, filters.labelIds),
          eq(bugLabel.bugId, bug.id),
        ),
      )
      .groupBy(bugLabel.bugId)
      .having(sql`count(distinct ${bugLabel.labelId}) = ${filters.labelIds.length}`)
    conditions.push(sql`exists (${subquery})`)
  }

  // Count total matching results
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bug)
    .where(and(...conditions))

  const total = countResult?.count ?? 0

  // Fetch paginated results
  const bugs = await db
    .select()
    .from(bug)
    .where(and(...conditions))
    .orderBy(desc(bug.upvotes), desc(bug.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  // Fetch labels for all returned bugs
  let bugLabelsMap = new Map<number, { id: number; name: string; color: string }[]>()
  if (bugs.length > 0) {
    const bugIds = bugs.map((b) => b.id)
    const labelRows = await db
      .select({
        bugId: bugLabel.bugId,
        labelId: label.id,
        labelName: label.name,
        labelColor: label.color,
      })
      .from(bugLabel)
      .innerJoin(label, eq(bugLabel.labelId, label.id))
      .where(inArray(bugLabel.bugId, bugIds))

    for (const bugId of bugIds) {
      bugLabelsMap.set(bugId, [])
    }
    for (const row of labelRows) {
      const existing = bugLabelsMap.get(row.bugId) ?? []
      existing.push({ id: row.labelId, name: row.labelName, color: row.labelColor })
      bugLabelsMap.set(row.bugId, existing)
    }
  }

  const results: SearchResult[] = bugs.map((b) => ({
    id: b.id,
    ref: b.ref,
    title: b.title,
    status: b.status,
    priority: b.priority,
    urgency: b.urgency,
    upvotes: b.upvotes,
    assigneeName: b.assigneeName,
    reporterName: b.reporterName,
    createdAt: b.createdAt,
    labels: bugLabelsMap.get(b.id) ?? [],
  }))

  return { results, total, page, pageSize }
}

/** Get all available filter options for a project. */
export async function getProjectFilterOptions(projectId: number) {
  await requireProjectAccess(projectId, "bug.view")

  const statusRows = await db
    .select({ value: bug.status })
    .from(bug)
    .where(eq(bug.projectId, projectId))
    .groupBy(bug.status)
    .orderBy(bug.status)

  const priorityRows = await db
    .select({ value: bug.priority })
    .from(bug)
    .where(eq(bug.projectId, projectId))
    .groupBy(bug.priority)
    .orderBy(bug.priority)

  const urgencyRows = await db
    .select({ value: bug.urgency })
    .from(bug)
    .where(eq(bug.projectId, projectId))
    .groupBy(bug.urgency)
    .orderBy(bug.urgency)

  const labels = await db
    .select()
    .from(label)
    .where(eq(label.projectId, projectId))
    .orderBy(label.name)

  return {
    statuses: statusRows.map((r) => r.value),
    priorities: priorityRows.map((r) => r.value),
    urgencies: urgencyRows.map((r) => r.value),
    labels,
  }
}
