import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { member, project } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { hasPermission, canModifyBug, type Permission } from "@/lib/permissions/config"

export type Role = "admin" | "developer" | "user"

export type SessionUser = {
  id: string
  name: string
  email: string
}

/** Returns the signed-in user or null (no throw). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  }
}

/** Returns the signed-in user id, throwing if unauthenticated. */
export async function requireUserId(): Promise<string> {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  return user.id
}

/** Look up a project by its URL slug. */
export async function getProjectBySlug(slug: string) {
  const rows = await db.select().from(project).where(eq(project.slug, slug)).limit(1)
  return rows[0] ?? null
}

/**
 * Resolve the current user's role in a project.
 * Returns null if the user is not a member.
 */
export async function getUserRole(projectId: number, userId: string): Promise<Role | null> {
  const rows = await db
    .select()
    .from(member)
    .where(and(eq(member.projectId, projectId), eq(member.userId, userId)))
    .limit(1)
  return (rows[0]?.role as Role) ?? null
}

export type Access = {
  user: SessionUser
  role: string
  projectId: number
}

/**
 * Enforce that the current user is a member of the project.
 * Then check they have a specific permission.
 * Throws on failure. This is the server-side gate that backs all RBAC.
 *
 * Usage:
 *   await requireProjectAccess(projectId, "bug.create")       // any member
 *   await requireProjectAccess(projectId, "project.settings.view")  // admin only
 */
export async function requireProjectAccess(
  projectId: number,
  permission: Permission,
): Promise<Access> {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")

  const role = await getUserRole(projectId, user.id)
  if (!role) throw new Error("Forbidden — not a member of this project")

  if (!hasPermission(role, permission)) {
    throw new Error(`Forbidden — role "${role}" lacks permission "${permission}"`)
  }

  return { user, role, projectId }
}

/**
 * Legacy wrapper for backward compatibility.
 * Checks if the user has one of the allowed roles.
 * Use `requireProjectAccess(projectId, permission)` for new code.
 */
export async function requireProjectAccessLegacy(
  projectId: number,
  allowed: Role[],
): Promise<Access> {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  const role = await getUserRole(projectId, user.id)
  if (!role || !allowed.includes(role)) throw new Error("Forbidden")
  return { user, role, projectId }
}

// Re-export for convenience
export { hasPermission, canModifyBug }
export type { Permission }