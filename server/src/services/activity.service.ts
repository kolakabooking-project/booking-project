import { db } from '../config/db.js';
import { activityLog, user } from '../db/schema.js';
import { eq, desc, and, gte, lte, ilike, or, lt } from 'drizzle-orm';

// ─── Types ───

type ActivityAction = typeof activityLog.$inferInsert['action'];

interface LogActivityInput {
  userId: string | null;
  userName: string;
  action: ActivityAction;
  targetId?: string | null;
  targetName?: string | null;
  detail?: string | null;
  ipAddress?: string | null;
}

interface LogQueryFilters {
  action?: string;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ─── Constants ───

const DEFAULT_PAGE_SIZE = 25;
const LOG_RETENTION_DAYS = 31; // Keep logs for 1 month

// ─── Mutations ───

/**
 * Record an activity log entry.
 */
export async function logActivity(data: LogActivityInput) {
  try {
    await db.insert(activityLog).values({
      userId: data.userId,
      userName: data.userName,
      action: data.action,
      targetId: data.targetId || null,
      targetName: data.targetName || null,
      detail: data.detail || null,
      ipAddress: data.ipAddress || null,
    });
  } catch (err) {
    // Activity logging should never break the main flow
    console.error('[ActivityLog] Failed to log activity:', err);
  }
}

// ─── Queries ───

/**
 * Get activity logs with pagination and filters.
 */
export async function getActivityLogs(filters?: LogQueryFilters) {
  const page = filters?.page || 1;
  const limit = filters?.limit || DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];

  if (filters?.action) {
    conditions.push(eq(activityLog.action, filters.action as ActivityAction));
  }

  if (filters?.userId) {
    conditions.push(eq(activityLog.userId, filters.userId));
  }

  if (filters?.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(activityLog.userName, term),
        ilike(activityLog.targetName, term),
        ilike(activityLog.detail, term)
      )
    );
  }

  if (filters?.startDate) {
    conditions.push(gte(activityLog.createdAt, new Date(filters.startDate)));
  }

  if (filters?.endDate) {
    conditions.push(lte(activityLog.createdAt, new Date(filters.endDate + 'T23:59:59')));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, countResult] = await Promise.all([
    db
      .select()
      .from(activityLog)
      .where(whereClause)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: activityLog.id })
      .from(activityLog)
      .where(whereClause),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total: countResult.length,
      totalPages: Math.ceil(countResult.length / limit),
    },
  };
}

/**
 * Get all logs for export (within date range).
 * Returns all logs without pagination for Excel export.
 */
export async function getActivityLogsForExport(startDate?: string, endDate?: string) {
  const conditions: any[] = [];

  if (startDate) {
    conditions.push(gte(activityLog.createdAt, new Date(startDate)));
  }

  if (endDate) {
    conditions.push(lte(activityLog.createdAt, new Date(endDate + 'T23:59:59')));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(activityLog)
    .where(whereClause)
    .orderBy(desc(activityLog.createdAt));
}

// ─── Maintenance ───

/**
 * Delete activity logs older than LOG_RETENTION_DAYS.
 * Should be called periodically (e.g., daily via cron or on startup).
 */
export async function cleanupOldLogs(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LOG_RETENTION_DAYS);

  const deleted = await db
    .delete(activityLog)
    .where(lt(activityLog.createdAt, cutoff))
    .returning({ id: activityLog.id });

  if (deleted.length > 0) {
    console.log(`[ActivityLog] Cleaned up ${deleted.length} logs older than ${LOG_RETENTION_DAYS} days.`);
  }

  return deleted.length;
}
