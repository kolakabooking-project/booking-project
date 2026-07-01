import { db } from '../config/db.js';
import { loginAnnouncement, announcementRead, user } from '../db/schema.js';
import { eq, desc, and, or, isNull, lte, gte, notInArray, sql } from 'drizzle-orm';

export interface CreateAnnouncementParams {
  title: string;
  content: string;
  isActive?: boolean;
  priority?: 'info' | 'warning' | 'urgent';
  targetRole?: 'all' | 'user' | 'admin';
  displayFrequency?: 'always' | 'once' | 'daily';
  startDate?: string | null;
  endDate?: string | null;
}

/**
 * Get active announcements for a user based on role, dates, and read history.
 */
export async function getActiveAnnouncements(userId: string, userRole: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Normalize role for target matching
  const isAdminRole = userRole === 'admin' || userRole === 'superadmin';
  const roleMatch = isAdminRole ? 'admin' : 'user';

  // Fetch all active announcements matching role and date range
  const activeList = await db
    .select()
    .from(loginAnnouncement)
    .where(
      and(
        eq(loginAnnouncement.isActive, true),
        or(
          eq(loginAnnouncement.targetRole, 'all'),
          eq(loginAnnouncement.targetRole, roleMatch)
        ),
        or(isNull(loginAnnouncement.startDate), lte(loginAnnouncement.startDate, now)),
        or(isNull(loginAnnouncement.endDate), gte(loginAnnouncement.endDate, now))
      )
    )
    .orderBy(desc(loginAnnouncement.createdAt));

  if (activeList.length === 0) return [];

  // Fetch user's read history for these announcements
  const readHistory = await db
    .select()
    .from(announcementRead)
    .where(eq(announcementRead.userId, userId));

  const readMap = new Map<string, Date>();
  for (const item of readHistory) {
    readMap.set(item.announcementId, new Date(item.readAt));
  }

  // Filter out announcements already acknowledged based on frequency
  return activeList.filter((ann: any) => {
    const readAt = readMap.get(ann.id);
    if (!readAt) return true; // Not read yet, always show

    if (ann.displayFrequency === 'once') {
      return false; // Already read once, hide
    }

    if (ann.displayFrequency === 'daily') {
      // If read today, hide; if read before today, show again
      if (readAt >= todayStart) {
        return false;
      }
    }

    // Even if displayFrequency is 'always', if the user explicitly clicked "Jangan tampilkan lagi"
    // we recorded it in announcementRead, so hide it!
    return false;
  });
}

/**
 * Get all announcements for Superadmin dashboard.
 */
export async function getAllAnnouncements() {
  const rows = await db
    .select({
      id: loginAnnouncement.id,
      title: loginAnnouncement.title,
      content: loginAnnouncement.content,
      isActive: loginAnnouncement.isActive,
      priority: loginAnnouncement.priority,
      targetRole: loginAnnouncement.targetRole,
      displayFrequency: loginAnnouncement.displayFrequency,
      startDate: loginAnnouncement.startDate,
      endDate: loginAnnouncement.endDate,
      createdAt: loginAnnouncement.createdAt,
      updatedAt: loginAnnouncement.updatedAt,
      createdBy: loginAnnouncement.createdBy,
      creatorName: user.name,
    })
    .from(loginAnnouncement)
    .leftJoin(user, eq(loginAnnouncement.createdBy, user.id))
    .orderBy(desc(loginAnnouncement.createdAt));

  return rows;
}

/**
 * Create a new announcement.
 */
export async function createAnnouncement(params: CreateAnnouncementParams, creatorId?: string) {
  const [newAnn] = await db
    .insert(loginAnnouncement)
    .values({
      title: params.title,
      content: params.content,
      isActive: params.isActive ?? true,
      priority: params.priority ?? 'info',
      targetRole: params.targetRole ?? 'all',
      displayFrequency: params.displayFrequency ?? 'always',
      startDate: params.startDate ? new Date(params.startDate) : null,
      endDate: params.endDate ? new Date(params.endDate) : null,
      createdBy: creatorId || null,
    })
    .returning();

  return newAnn;
}

/**
 * Update an announcement.
 */
export async function updateAnnouncement(id: string, params: Partial<CreateAnnouncementParams>) {
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (params.title !== undefined) updateData.title = params.title;
  if (params.content !== undefined) updateData.content = params.content;
  if (params.isActive !== undefined) updateData.isActive = params.isActive;
  if (params.priority !== undefined) updateData.priority = params.priority;
  if (params.targetRole !== undefined) updateData.targetRole = params.targetRole;
  if (params.displayFrequency !== undefined) updateData.displayFrequency = params.displayFrequency;
  if (params.startDate !== undefined) updateData.startDate = params.startDate ? new Date(params.startDate) : null;
  if (params.endDate !== undefined) updateData.endDate = params.endDate ? new Date(params.endDate) : null;

  const [updated] = await db
    .update(loginAnnouncement)
    .set(updateData)
    .where(eq(loginAnnouncement.id, id))
    .returning();

  return updated;
}

/**
 * Delete an announcement.
 */
export async function deleteAnnouncement(id: string) {
  await db
    .delete(loginAnnouncement)
    .where(eq(loginAnnouncement.id, id));
  return true;
}

/**
 * Record user acknowledgment ("Jangan tampilkan lagi" / read).
 */
export async function acknowledgeAnnouncement(announcementId: string, userId: string) {
  // Check if already exists
  const existing = await db
    .select()
    .from(announcementRead)
    .where(
      and(
        eq(announcementRead.announcementId, announcementId),
        eq(announcementRead.userId, userId)
      )
    );

  if (existing.length > 0) {
    // Update timestamp
    await db
      .update(announcementRead)
      .set({ readAt: new Date() })
      .where(eq(announcementRead.id, existing[0].id));
    return true;
  }

  await db
    .insert(announcementRead)
    .values({
      announcementId,
      userId,
      readAt: new Date(),
    });

  return true;
}
