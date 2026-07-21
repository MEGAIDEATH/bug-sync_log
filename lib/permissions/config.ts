/**
 * Centralized role and permission definitions.
 *
 * This is the single source of truth for all permissions in the application.
 * To add a new role: add it to ROLES with a numeric rank.
 * To add a new permission: add it to PERMISSIONS with a minRole.
 * No database schema changes needed.
 */

/** All known roles. The rank determines hierarchy. */
export const ROLES = {
  viewer: 1,
  user: 10,
  reporter: 15,
  developer: 50,
  qa_tester: 40,
  project_manager: 70,
  admin: 100,
} as const

export type Role = keyof typeof ROLES

/** Get the numeric rank of a role. Unknown roles default to 0 (no permissions). */
export function roleRank(role: string): number {
  return (ROLES[role as Role] ?? 0)
}

/** All permissions and their minimum required role. */
export const PERMISSIONS = {
  // ── Bug permissions ──────────────────────────────────────────────
  /** Anyone can report a bug (user-level access). */
  "bug.create": { minRole: "user" as Role },
  /** View bugs in a project. */
  "bug.view": { minRole: "user" as Role },
  /** Vote on bugs. */
  "bug.vote": { minRole: "user" as Role },
  /** Comment on bugs. */
  "bug.comment": { minRole: "user" as Role },
  /** Change bug status. */
  "bug.update.status": { minRole: "developer" as Role },
  /** Update bug priority. */
  "bug.update.priority": { minRole: "developer" as Role },
  /** Update bug urgency. */
  "bug.update.urgency": { minRole: "developer" as Role },
  /** Assign a bug to a developer. */
  "bug.assign": { minRole: "admin" as Role },
  /** Manage bug labels. */
  "bug.update.labels": { minRole: "developer" as Role },
  /** Delete a bug. */
  "bug.delete": { minRole: "admin" as Role },
  /** Add internal/developer notes. */
  "bug.addInternalNote": { minRole: "developer" as Role },
  /** Upload attachments to a bug. */
  "bug.attach": { minRole: "developer" as Role },
  /** Edit bug title/description. */
  "bug.edit": { minRole: "developer" as Role },
  /** Archive a bug (soft-delete). */
  "bug.archive": { minRole: "admin" as Role },
  /** Modify bugs assigned to OTHER developers (admin override). */
  "bug.modifyAny": { minRole: "admin" as Role },

  // ── Project permissions ──────────────────────────────────────────
  /** View project settings page. */
  "project.settings.view": { minRole: "admin" as Role },
  /** Edit project name, description, icon, color, visibility. */
  "project.settings.edit": { minRole: "admin" as Role },
  /** Invite new members. */
  "project.members.invite": { minRole: "admin" as Role },
  /** Remove members. */
  "project.members.remove": { minRole: "admin" as Role },
  /** Change member roles. */
  "project.members.roles.edit": { minRole: "admin" as Role },
  /** Manage project labels (create/edit/delete). */
  "project.labels.manage": { minRole: "admin" as Role },
  /** Archive the project. */
  "project.archive": { minRole: "admin" as Role },
  /** Restore an archived project. */
  "project.restore": { minRole: "admin" as Role },
  /** Delete the project permanently. */
  "project.delete": { minRole: "admin" as Role },

  // ── Dashboard permissions ────────────────────────────────────────
  /** View the main dashboard. */
  "dashboard.view": { minRole: "user" as Role },
  /** Create a new project. */
  "project.create": { minRole: "user" as Role },

  // ── Notification permissions ─────────────────────────────────────
  /** View own notifications. */
  "notification.view": { minRole: "user" as Role },
  /** Mark notifications as read. */
  "notification.markRead": { minRole: "user" as Role },
} as const

export type Permission = keyof typeof PERMISSIONS

/**
 * Check if a given role has a specific permission.
 * This is the single function all server actions call for authorization.
 * Never hardcode role checks elsewhere in the codebase.
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const config = PERMISSIONS[permission]
  if (!config) return false
  return roleRank(role) >= roleRank(config.minRole)
}

/**
 * Check if a user can modify a specific bug.
 * Admins can modify any bug. Developers can only modify bugs assigned to them.
 */
export function canModifyBug(
  role: string,
  bugAssigneeId: string | null,
  currentUserId: string,
): boolean {
  if (hasPermission(role, "bug.modifyAny")) return true
  return bugAssigneeId === currentUserId
}