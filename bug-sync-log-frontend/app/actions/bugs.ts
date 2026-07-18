"use server"

import { db } from "@/lib/db"
import { bug, comment, vote, activityLog } from "@/lib/db/schema"
import { getSessionUser, getUserRole, requireProjectAccess, hasPermission } from "@/lib/rbac"
import { and, desc, eq, sql, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"

async function nextRef(projectId: number) {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bug)
    .where(eq(bug.projectId, projectId))
  const n = (rows[0]?.count ?? 0) + 400
  return `BUG-${n + 1}`
}

async function logActivity(
  projectId: number,
  bugId: number | null,
  userId: string,
  userName: string,
  action: string,
  oldValue?: string | null,
  newValue?: string | null,
) {
  await db.insert(activityLog).values({
    projectId,
    bugId,
    userId,
    userName,
    action,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
  })
}

/** Report a bug. Any project member may report. */
export async function reportBug(projectId: number, slug: string, formData: FormData) {
  const { user } = await requireProjectAccess(projectId, "bug.create")

  const title = String(formData.get("title") ?? "").trim()
  if (!title) throw new Error("Please describe the bug")

  const urgency = String(formData.get("urgency") ?? "minor")
  const priority = String(formData.get("priority") ?? "medium")
  const environment = String(formData.get("environment") ?? "Production")
  const stepsToReproduce = String(formData.get("stepsToReproduce") ?? "").trim()
  const expected = String(formData.get("expected") ?? "").trim()
  const actual = String(formData.get("actual") ?? "").trim()

  const ref = await nextRef(projectId)

  const [created] = await db
    .insert(bug)
    .values({
      projectId,
      ref,
      title,
      urgency: ["blocker", "critical", "minor"].includes(urgency) ? urgency : "minor",
      priority: ["low", "medium", "high", "critical"].includes(priority) ? priority : "medium",
      environment,
      stepsToReproduce: stepsToReproduce || null,
      expected: expected || null,
      actual: actual || null,
      reporterId: user.id,
      reporterName: user.name,
      status: "open",
      location: "triage",
      upvotes: 0,
    })
    .returning()

  await logActivity(projectId, created.id, user.id, user.name, "bug.created", null, `Bug ${ref} created`)

  revalidatePath(`/project/${slug}`)
  revalidatePath(`/project/${slug}/board`)
}

/** All bugs for a project, with whether the current user voted. */
export async function getBugs(projectId: number) {
  const { user } = await requireProjectAccess(projectId, "bug.view")

  const bugs = await db
    .select()
    .from(bug)
    .where(eq(bug.projectId, projectId))
    .orderBy(desc(bug.upvotes), desc(bug.createdAt))

  const myVotes = await db.select().from(vote).where(eq(vote.userId, user.id))
  const votedBugIds = new Set(myVotes.map((v) => v.bugId))

  return bugs.map((b) => ({ ...b, hasVoted: votedBugIds.has(b.id) }))
}

/** Toggle a vote for a bug. Any member may vote. */
export async function toggleVote(projectId: number, slug: string, bugId: number) {
  const { user } = await requireProjectAccess(projectId, "bug.vote")

  const existing = await db
    .select()
    .from(vote)
    .where(and(eq(vote.bugId, bugId), eq(vote.userId, user.id)))
    .limit(1)

  if (existing.length > 0) {
    await db.delete(vote).where(eq(vote.id, existing[0].id))
    await db
      .update(bug)
      .set({ upvotes: sql`greatest(${bug.upvotes} - 1, 0)` })
      .where(and(eq(bug.id, bugId), eq(bug.projectId, projectId)))
  } else {
    await db.insert(vote).values({ bugId, userId: user.id })
    await db
      .update(bug)
      .set({ upvotes: sql`${bug.upvotes} + 1` })
      .where(and(eq(bug.id, bugId), eq(bug.projectId, projectId)))
  }

  revalidatePath(`/project/${slug}`)
}

/** Comments for a bug. Internal notes are hidden from plain users. */
export async function getComments(projectId: number, bugId: number) {
  const { user } = await requireProjectAccess(projectId, "bug.comment")
  const role = await getUserRole(projectId, user.id)
  const canSeeInternal = hasPermission(role, "bug.addInternalNote")

  const rows = await db
    .select()
    .from(comment)
    .where(eq(comment.bugId, bugId))
    .orderBy(comment.createdAt)

  return rows.filter((c) => (c.isInternal ? canSeeInternal : true))
}

/** Add a comment. Only devs/admins may post internal notes. */
export async function addComment(
  projectId: number,
  slug: string,
  bugId: number,
  body: string,
  isInternal: boolean,
) {
  const { user, role } = await requireProjectAccess(projectId, "bug.comment")
  const text = body.trim()
  if (!text) throw new Error("Comment cannot be empty")

  const internal = isInternal && hasPermission(role, "bug.addInternalNote")

  await db.insert(comment).values({
    bugId,
    userId: user.id,
    userName: user.name,
    body: text,
    isInternal: internal,
  })

  await logActivity(projectId, bugId, user.id, user.name, "comment.added", null, text.slice(0, 100))

  revalidatePath(`/project/${slug}`)
}

/** Update bug status. Developers and admins only. */
export async function updateBugStatus(
  projectId: number,
  slug: string,
  bugId: number,
  status: string,
) {
  const { user, role } = await requireProjectAccess(projectId, "bug.update.status")

  // Get the current bug to check assignment
  const [currentBug] = await db
    .select({ status: bug.status, assigneeId: bug.assigneeId })
    .from(bug)
    .where(and(eq(bug.id, bugId), eq(bug.projectId, projectId)))
    .limit(1)

  if (!currentBug) throw new Error("Bug not found")

  // Check if developer can modify this bug (only assigned bugs)
  if (!hasPermission(role, "bug.modifyAny") && currentBug.assigneeId !== user.id) {
    throw new Error("You can only modify bugs assigned to you")
  }

  const oldStatus = currentBug.status
  const setData: Record<string, unknown> = { status }

  // Auto-set fixedAt when marking as fixed
  if (status === "fixed") {
    setData.fixedAt = sql`now()`
  }
  if (status === "closed") {
    setData.closedAt = sql`now()`
  }

  setData.updatedAt = sql`now()`

  await db
    .update(bug)
    .set(setData)
    .where(and(eq(bug.id, bugId), eq(bug.projectId, projectId)))

  await logActivity(projectId, bugId, user.id, user.name, "status.changed", oldStatus, status)

  revalidatePath(`/project/${slug}/board`)
  revalidatePath(`/project/${slug}`)
}

/** Update bug urgency/assignee/location. */
export async function updateBug(
  projectId: number,
  slug: string,
  bugId: number,
  patch: {
    urgency?: string
    priority?: string
    assigneeId?: string | null
    assigneeName?: string | null
    location?: string
  },
) {
  const { user, role } = await requireProjectAccess(projectId, "bug.update.urgency")

  // Get the current bug to check assignment
  const [currentBug] = await db
    .select({ assigneeId: bug.assigneeId })
    .from(bug)
    .where(and(eq(bug.id, bugId), eq(bug.projectId, projectId)))
    .limit(1)

  if (!currentBug) throw new Error("Bug not found")

  // Check if developer can modify this bug (only assigned bugs)
  if (!hasPermission(role, "bug.modifyAny") && currentBug.assigneeId !== user.id) {
    throw new Error("You can only modify bugs assigned to you")
  }

  const set: Record<string, unknown> = {}
  if (patch.urgency && ["blocker", "critical", "minor"].includes(patch.urgency)) {
    set.urgency = patch.urgency
  }
  if (patch.priority && ["low", "medium", "high", "critical"].includes(patch.priority)) {
    set.priority = patch.priority
  }
  if (patch.location && ["triage", "sprint"].includes(patch.location)) {
    set.location = patch.location
  }
  if ("assigneeId" in patch && hasPermission(role, "bug.assign")) {
    set.assigneeId = patch.assigneeId
    set.assigneeName = patch.assigneeName
  }
  if (Object.keys(set).length === 0) return

  set.updatedAt = sql`now()`

  await db.update(bug).set(set).where(and(eq(bug.id, bugId), eq(bug.projectId, projectId)))

  if ("assigneeId" in patch) {
    await logActivity(
      projectId, bugId, user.id, user.name, "bug.assigned",
      currentBug.assigneeId, patch.assigneeId,
    )
  }

  revalidatePath(`/project/${slug}/board`)
  revalidatePath(`/project/${slug}`)
}

/** Assign a bug to a developer (admin only). */
export async function assignBug(
  projectId: number,
  slug: string,
  bugId: number,
  developerId: string | null,
  developerName: string | null,
) {
  const { user } = await requireProjectAccess(projectId, "bug.assign")

  const [currentBug] = await db
    .select({ assigneeId: bug.assigneeId })
    .from(bug)
    .where(and(eq(bug.id, bugId), eq(bug.projectId, projectId)))
    .limit(1)

  await db
    .update(bug)
    .set({
      assigneeId: developerId,
      assigneeName: developerName,
      updatedAt: sql`now()`,
    })
    .where(and(eq(bug.id, bugId), eq(bug.projectId, projectId)))

  await logActivity(
    projectId, bugId, user.id, user.name, "bug.assigned",
    currentBug?.assigneeId, developerId,
  )

  revalidatePath(`/project/${slug}/board`)
  revalidatePath(`/project/${slug}`)
}

/** Get bugs assigned to a specific developer. */
export async function getMyAssignedBugs(projectId: number) {
  const { user } = await requireProjectAccess(projectId, "bug.view")

  return await db
    .select()
    .from(bug)
    .where(and(eq(bug.projectId, projectId), eq(bug.assigneeId, user.id)))
    .orderBy(desc(bug.upvotes), desc(bug.createdAt))
}

/** Get activity log for a bug. */
export async function getBugActivity(projectId: number, bugId: number) {
  await requireProjectAccess(projectId, "bug.view")

  return await db
    .select()
    .from(activityLog)
    .where(and(eq(activityLog.bugId, bugId), eq(activityLog.projectId, projectId)))
    .orderBy(desc(activityLog.createdAt))
}