import { db } from '../config/db.js';
import { systemSettings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Shared service status cache.
 *
 * Used by both `maintenanceGuard` (every API request for non-superadmin)
 * and `superadminService.getServiceStatus()` (dashboard load).
 *
 * Avoids duplicate DB queries for the same data.
 */

interface ServiceStatusCache {
  active: boolean;
  updatedAt: string | null;
  checkedAt: number;
}

let cachedStatus: ServiceStatusCache | null = null;
const CACHE_TTL_MS = 10_000; // 10 seconds

/**
 * Get service status — uses cache with 10s TTL.
 * Returns { active, updatedAt }.
 */
export async function getServiceStatusCached(): Promise<{ active: boolean; updatedAt: string | null }> {
  const now = Date.now();

  if (cachedStatus && (now - cachedStatus.checkedAt) < CACHE_TTL_MS) {
    return { active: cachedStatus.active, updatedAt: cachedStatus.updatedAt };
  }

  try {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'service_active'));

    const active = setting?.value !== 'false';
    const updatedAt = setting?.updatedAt?.toISOString() || null;

    cachedStatus = { active, updatedAt, checkedAt: now };
    return { active, updatedAt };
  } catch (err) {
    console.error('[ServiceStatusCache] Error checking service status:', err);
    // Default to active on error to avoid accidentally blocking all users
    return { active: true, updatedAt: null };
  }
}

/**
 * Check only active status (boolean) — lightweight version for maintenanceGuard.
 */
export async function isServiceActive(): Promise<boolean> {
  const status = await getServiceStatusCached();
  return status.active;
}

/**
 * Invalidate cache — called when superadmin toggles service status.
 */
export function invalidateServiceStatusCache(): void {
  cachedStatus = null;
}
