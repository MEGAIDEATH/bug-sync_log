"use server"

import { db } from "@/lib/db"
import { notification } from "@/lib/db/schema"
import { getSessionUser, requireUserId } from "@/lib/rbac"
import { and, desc, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

/** Get all notifications for the current user. */
export async function getMyNotifications() {
  const user = await getSessionUser()
  if (!user) return []

  return await db
    .select()
    .from(notification)
    .where(eq(notification.userId, user.id))
    .orderBy(desc(notification.createdAt))
    .limit(50)
}

/** Get unread notification count for the current user. */
export async function getUnreadCount() {
  const user = await getSessionUser()
  if (!user) return 0

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notification)
    .where(and(eq(notification.userId, user.id), eq(notification.read, false)))

  return result?.count ?? 0
}

/** Mark a single notification as read. */
export async function markNotificationRead(notificationId: number) {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")

  await db
    .update(notification)
    .set({ read: true })
    .where(and(eq(notification.id, notificationId), eq(notification.userId, user.id)))

  revalidatePath("/")
}

/** Mark all notifications as read for the current user. */
export async function markAllNotificationsRead() {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")

  await db
    .update(notification)
    .set({ read: true })
    .where(and(eq(notification.userId, user.id), eq(notification.read, false)))

  revalidatePath("/")
}

/** Internal helper to create a notification. Called by other server actions. */
export async function createNotification(
  userId: string,
  projectId: number | null,
  bugId: number | null,
  type: string,
  title: string,
  body?: string,
  link?: string,
) {
  await db.insert(notification).values({
    userId,
    projectId,
    bugId,
    type,
    title,
    body: body ?? null,
    link: link ?? null,
  })
}