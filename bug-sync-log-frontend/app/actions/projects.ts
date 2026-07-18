"use server"

import { db } from "@/lib/db"
import {
  invitation,
  member,
  project,
  user as userTable,
  bug,
  label,
  vote,
  comment,
  bugLabel,
  attachment,
  activityLog,
  notification,
} from "@/lib/db/schema"
import { getSessionUser, requireProjectAccess, requireUserId } from "@/lib/rbac"
import { and, desc, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { sql } from "drizzle-orm"

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  return base || "project"
}

/** Create a new project. The creator becomes its admin. */
export async function createProject(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")

  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  if (!name) throw new Error("Project name is required")

  // Ensure a unique slug.
  let slug = slugify(name)
  const existing = await db.select({ slug: project.slug }).from(project)
  const taken = new Set(existing.map((e) => e.slug))
  if (taken.has(slug)) {
    let n = 2
    while (taken.has(`${slug}-${n}`)) n++
    slug = `${slug}-${n}`
  }

  const [created] = await db
    .insert(project)
    .values({ name, description: description || null, slug, ownerId: user.id })
    .returning()

  await db.insert(member).values({
    projectId: created.id,
    userId: user.id,
    role: "admin",
  })

  revalidatePath("/")
  return created.slug
}

/** All projects the current user belongs to, with their role. */
export async function getMyProjects() {
  const user = await getSessionUser()
  if (!user) return []

  const memberships = await db
    .select()
    .from(member)
    .where(eq(member.userId, user.id))
  if (memberships.length === 0) return []

  const projectIds = memberships.map((m) => m.projectId)
  const projects = await db
    .select()
    .from(project)
    .where(inArray(project.id, projectIds))
    .orderBy(desc(project.createdAt))

  const roleByProject = new Map(memberships.map((m) => [m.projectId, m.role]))
  return projects.map((p) => ({ ...p, role: roleByProject.get(p.id) as string }))
}

/** Pending invitations addressed to the current user's email. */
export async function getMyInvitations() {
  const user = await getSessionUser()
  if (!user) return []

  const invites = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.email, user.email), eq(invitation.status, "pending")))
  if (invites.length === 0) return []

  const projectIds = invites.map((i) => i.projectId)
  const projects = await db.select().from(project).where(inArray(project.id, projectIds))
  const projectById = new Map(projects.map((p) => [p.id, p]))

  return invites.map((i) => ({
    ...i,
    projectName: projectById.get(i.projectId)?.name ?? "Unknown project",
    projectSlug: projectById.get(i.projectId)?.slug ?? "",
  }))
}

/** Accept an invitation: create membership with the invited role. */
export async function acceptInvitation(invitationId: number) {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")

  const [invite] = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.id, invitationId), eq(invitation.email, user.email)))
    .limit(1)
  if (!invite || invite.status !== "pending") throw new Error("Invitation not found")

  const existing = await db
    .select()
    .from(member)
    .where(and(eq(member.projectId, invite.projectId), eq(member.userId, user.id)))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(member).values({
      projectId: invite.projectId,
      userId: user.id,
      role: invite.role,
    })
  }

  await db
    .update(invitation)
    .set({ status: "accepted" })
    .where(eq(invitation.id, invitationId))

  revalidatePath("/")
}

/** Decline an invitation. */
export async function declineInvitation(invitationId: number) {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  await db
    .update(invitation)
    .set({ status: "declined" })
    .where(and(eq(invitation.id, invitationId), eq(invitation.email, user.email)))
  revalidatePath("/")
}

/** Admin: list members and pending invitations for a project. */
export async function getProjectPeople(projectId: number) {
  await requireProjectAccess(projectId, "project.members.invite")

  const members = await db.select().from(member).where(eq(member.projectId, projectId))
  const userIds = members.map((m) => m.userId)
  const users =
    userIds.length > 0
      ? await db.select().from(userTable).where(inArray(userTable.id, userIds))
      : []
  const userById = new Map(users.map((u) => [u.id, u]))

  const people = members.map((m) => ({
    memberId: m.id,
    userId: m.userId,
    role: m.role,
    name: userById.get(m.userId)?.name ?? "Unknown",
    email: userById.get(m.userId)?.email ?? "",
  }))

  const invites = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.projectId, projectId), eq(invitation.status, "pending")))

  return { people, invites }
}

/** Admin: invite a person by email to a project with a role. */
export async function inviteMember(projectId: number, formData: FormData) {
  await requireProjectAccess(projectId, "project.members.invite")
  const inviter = await requireUserId()

  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const role = String(formData.get("role") ?? "developer")
  if (!email) throw new Error("Email is required")
  if (!["developer", "user", "admin"].includes(role)) throw new Error("Invalid role")

  // If already a member, do nothing.
  const [existingUser] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1)
  if (existingUser) {
    const existingMember = await db
      .select()
      .from(member)
      .where(and(eq(member.projectId, projectId), eq(member.userId, existingUser.id)))
      .limit(1)
    if (existingMember.length > 0) throw new Error("That person is already a member")
  }

  // Avoid duplicate pending invites.
  const dupe = await db
    .select()
    .from(invitation)
    .where(
      and(
        eq(invitation.projectId, projectId),
        eq(invitation.email, email),
        eq(invitation.status, "pending"),
      ),
    )
    .limit(1)
  if (dupe.length === 0) {
    await db.insert(invitation).values({
      projectId,
      email,
      role,
      invitedById: inviter,
    })
  }

  revalidatePath(`/p/${await slugFor(projectId)}/settings`)
}

/** Admin: change a member's role. */
export async function updateMemberRole(projectId: number, memberId: number, role: string) {
  await requireProjectAccess(projectId, "project.members.roles.edit")
  if (!["admin", "developer", "user"].includes(role)) throw new Error("Invalid role")
  await db
    .update(member)
    .set({ role })
    .where(and(eq(member.id, memberId), eq(member.projectId, projectId)))
  revalidatePath(`/p/${await slugFor(projectId)}/settings`)
}

/** Admin: remove a member from a project. */
export async function removeMember(projectId: number, memberId: number) {
  await requireProjectAccess(projectId, "project.members.remove")
  await db
    .delete(member)
    .where(and(eq(member.id, memberId), eq(member.projectId, projectId)))
  revalidatePath(`/p/${await slugFor(projectId)}/settings`)
}

/** Admin: update project settings (name, description, icon, color, visibility). */
export async function updateProject(projectId: number, formData: FormData) {
  await requireProjectAccess(projectId, "project.settings.edit")

  const updateData: Record<string, unknown> = {}

  const name = String(formData.get("name") ?? "").trim()
  if (name) updateData.name = name

  const description = String(formData.get("description") ?? "").trim()
  updateData.description = description || null

  const color = String(formData.get("color") ?? "").trim()
  if (color) updateData.color = color

  const visibility = String(formData.get("visibility") ?? "").trim()
  if (visibility === "private" || visibility === "public") {
    updateData.visibility = visibility
  }

  updateData.updatedAt = sql`now()`

  await db.update(project).set(updateData).where(eq(project.id, projectId))

  const [p] = await db
    .select({ slug: project.slug })
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1)

  revalidatePath(`/project/${p?.slug}/settings`)
  revalidatePath(`/project/${p?.slug}`)
}

/** Admin: archive a project. */
export async function archiveProject(projectId: number) {
  await requireProjectAccess(projectId, "project.archive")

  await db
    .update(project)
    .set({ archived: true, archivedAt: sql`now()`, updatedAt: sql`now()` })
    .where(eq(project.id, projectId))

  const [p] = await db
    .select({ slug: project.slug })
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1)

  revalidatePath(`/project/${p?.slug}/settings`)
  revalidatePath(`/project/${p?.slug}`)
  revalidatePath("/")
}

/** Admin: restore an archived project. */
export async function restoreProject(projectId: number) {
  await requireProjectAccess(projectId, "project.restore")

  await db
    .update(project)
    .set({ archived: false, archivedAt: null, updatedAt: sql`now()` })
    .where(eq(project.id, projectId))

  const [p] = await db
    .select({ slug: project.slug })
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1)

  revalidatePath(`/project/${p?.slug}/settings`)
  revalidatePath(`/project/${p?.slug}`)
  revalidatePath("/")
}

/** Admin: permanently delete a project and all related data. */
export async function deleteProject(projectId: number) {
  await requireProjectAccess(projectId, "project.delete")

  // Delete all related data for the project
  // Get all bug IDs first for related tables
  const bugIds = (await db.select({ id: bug.id }).from(bug).where(eq(bug.projectId, projectId))).map((b: { id: number }) => b.id)

  if (bugIds.length > 0) {
    await db.delete(vote).where(inArray(vote.bugId, bugIds))
    await db.delete(comment).where(inArray(comment.bugId, bugIds))
    await db.delete(bugLabel).where(inArray(bugLabel.bugId, bugIds))
    await db.delete(attachment).where(inArray(attachment.bugId, bugIds))
    await db.delete(activityLog).where(inArray(activityLog.bugId, bugIds))
    await db.delete(notification).where(inArray(notification.bugId, bugIds))
    await db.delete(bug).where(eq(bug.projectId, projectId))
  }

  await db.delete(label).where(eq(label.projectId, projectId))
  await db.delete(invitation).where(eq(invitation.projectId, projectId))
  await db.delete(member).where(eq(member.projectId, projectId))
  await db.delete(project).where(eq(project.id, projectId))

  revalidatePath("/")
}

async function slugFor(projectId: number) {
  const [p] = await db
    .select({ slug: project.slug })
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1)
  return p?.slug ?? ""
}