import { db } from '../config/db.js';
import { activityLog, user } from '../db/schema.js';
import { eq, desc, and, gte, lte, ilike, or, lt, count } from 'drizzle-orm';

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
  skipCount?: boolean; // Skip COUNT query when pagination info isn't needed (e.g., dashboard widget)
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

  // When skipCount is true (e.g., dashboard widget), skip the expensive COUNT query
  if (filters?.skipCount) {
    const logs = await db
      .select()
      .from(activityLog)
      .where(whereClause)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      logs,
      pagination: {
        page,
        limit,
        total: -1,
        totalPages: -1,
      },
    };
  }

  const [logs, countResult] = await Promise.all([
    db
      .select()
      .from(activityLog)
      .where(whereClause)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count(activityLog.id) })
      .from(activityLog)
      .where(whereClause),
  ]);

  const total = countResult[0].value;

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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

  // Hard limit to prevent memory bombs on unbounded exports
  return db
    .select()
    .from(activityLog)
    .where(whereClause)
    .orderBy(desc(activityLog.createdAt))
    .limit(5000);
}

// ─── Maintenance ───

/**
 * Delete activity logs older than LOG_RETENTION_DAYS.
 * Should be called periodically (e.g., daily via cron or on startup).
 */
export async function cleanupOldLogs(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LOG_RETENTION_DAYS);

  // Use a subquery approach: count first, then delete
  // Avoids .returning() which loads all deleted row IDs into memory
  const countResult = await db
    .select({ value: count(activityLog.id) })
    .from(activityLog)
    .where(lt(activityLog.createdAt, cutoff));

  const toDelete = countResult[0]?.value || 0;

  if (toDelete > 0) {
    await db
      .delete(activityLog)
      .where(lt(activityLog.createdAt, cutoff));

    console.log(`[ActivityLog] Cleaned up ${toDelete} logs older than ${LOG_RETENTION_DAYS} days.`);
  }

  return toDelete;
}
