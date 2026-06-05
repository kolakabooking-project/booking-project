import { db } from '../config/db.js';
import { notification } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

interface CreateNotificationParams {
  userId: string;
  title: string;
  body: string;
  url?: string;
}

/**
 * Creates an in-app notification for a user.
 */
export async function createNotification(params: CreateNotificationParams) {
  const [newNotification] = await db.insert(notification).values({
    userId: params.userId,
    title: params.title,
    body: params.body,
    url: params.url,
    isRead: false,
  }).returning();

  return newNotification;
}

/**
 * Retrieves notifications for a specific user.
 * Limits to the 50 most recent notifications.
 */
export async function getUserNotifications(userId: string) {
  return await db
    .select()
    .from(notification)
    .where(eq(notification.userId, userId))
    .orderBy(desc(notification.createdAt))
    .limit(50);
}

/**
 * Marks a specific notification as read.
 */
export async function markAsRead(notificationId: string, userId: string) {
  return await db
    .update(notification)
    .set({ isRead: true })
    .where(and(eq(notification.id, notificationId), eq(notification.userId, userId)));
}

/**
 * Marks all notifications as read for a specific user.
 */
export async function markAllAsRead(userId: string) {
  return await db
    .update(notification)
    .set({ isRead: true })
    .where(and(eq(notification.userId, userId), eq(notification.isRead, false)));
}
