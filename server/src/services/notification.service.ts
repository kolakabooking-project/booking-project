import { db } from '../config/db.js';
import { notification } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import ably from '../lib/ably.js';

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

  try {
    // Broadcast via Ably for real-time pop-up
    await ably.channels.get(`notifications:user_${params.userId}`).publish('new_notification', newNotification);
  } catch (error) {
    console.error(`[ABLY] Failed to broadcast notification to user ${params.userId}:`, error);
  }

  return newNotification;
}

/**
 * Creates multiple in-app notifications in a single batch INSERT.
 * Significantly reduces DB roundtrips when notifying many users (e.g., WFO schedule).
 */
export async function createNotificationsBatch(
  notifications: CreateNotificationParams[]
): Promise<void> {
  if (notifications.length === 0) return;

  // Single batch INSERT for all notifications
  const inserted = await db.insert(notification).values(
    notifications.map((n) => ({
      userId: n.userId,
      title: n.title,
      body: n.body,
      url: n.url,
      isRead: false,
    }))
  ).returning();

  // Broadcast via Ably for real-time pop-up (fire-and-forget)
  const ablyPromises = inserted.map((n) =>
    ably.channels.get(`notifications:user_${n.userId}`)
      .publish('new_notification', n)
      .catch((err: any) => console.error(`[ABLY] Batch notification broadcast failed for ${n.userId}:`, err))
  );
  await Promise.allSettled(ablyPromises);
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
