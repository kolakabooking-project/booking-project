import { db } from '../config/db.js';
import { notification, user } from '../db/schema.js';
import { eq, desc, and, gte } from 'drizzle-orm';
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
 * Time-bounded to the last 30 days and limited to 30 most recent records.
 * Strictly scopes notifications based on the user's role / active role to prevent
 * operational admin notifications leaking to regular employees or Kepala Kantor.
 */
export async function getUserNotifications(userId: string, activeRole?: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch the user's base role from DB
  const [currentUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const effectiveRole = activeRole || currentUser?.role || 'user';

  const rawNotifications = await db
    .select()
    .from(notification)
    .where(
      and(
        eq(notification.userId, userId),
        gte(notification.createdAt, thirtyDaysAgo)
      )
    )
    .orderBy(desc(notification.createdAt))
    .limit(60);

  // Filter notifications based on strict role boundary
  const filtered = rawNotifications.filter((n) => {
    // 1. Kepala Kantor boundary:
    // Only executive notifications (Agenda, ST, official office broadcasts).
    // NEVER operational requests or general staff assignments.
    if (effectiveRole === 'kepala_kantor') {
      if (n.url && n.url.startsWith('/admin')) return false;
      if (n.url && (n.url.startsWith('/user/room') || n.url.startsWith('/user/my-bookings') || n.url.startsWith('/user/kdo'))) return false;
      if (
        n.title.includes('Peminjaman Ruangan Baru') ||
        n.title.includes('Pengajuan Peminjaman') ||
        n.title.includes('Peminjaman Kendaraan') ||
        n.title.includes('Penugasan Ruangan Baru') ||
        n.title.includes('Penugasan Kendaraan Dinas') ||
        n.title.includes('Dibatalkan Pegawai') ||
        n.title.includes('Selesai Lebih Awal')
      ) {
        return false;
      }
      return true;
    }

    // 2. Regular Pegawai (user) boundary:
    // Only personal booking updates, WFO schedules, and broadcasts.
    // NEVER administrative/operational approval requests.
    if (effectiveRole === 'user') {
      if (n.url && n.url.startsWith('/admin')) return false;
      if (
        n.title.includes('Peminjaman Ruangan Baru') ||
        n.title.includes('Pengajuan Peminjaman Baru') ||
        n.title.includes('Dibatalkan Pegawai') ||
        n.title.includes('Selesai Lebih Awal') ||
        n.title.includes('Ulasan Peminjaman')
      ) {
        return false;
      }
      return true;
    }

    // 3. Sekretaris boundary:
    // In sekretaris view, exclude general room booking requests from other employees
    if (effectiveRole === 'sekretaris') {
      if (
        n.title.includes('Peminjaman Ruangan Baru') ||
        n.title.includes('Pengajuan Peminjaman Baru') ||
        n.title.includes('Dibatalkan Pegawai') ||
        n.title.includes('Selesai Lebih Awal')
      ) {
        return false;
      }
      return true;
    }

    // Admin & Superadmin can see all notifications addressed to them
    return true;
  });

  return filtered.slice(0, 30);
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
