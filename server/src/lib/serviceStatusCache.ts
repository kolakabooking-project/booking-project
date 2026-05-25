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
  kdoActive: boolean;
  roomActive: boolean;
  updatedAt: string | null;
  checkedAt: number;
}

let cachedStatus: ServiceStatusCache | null = null;
const CACHE_TTL_MS = 10_000; // 10 seconds

/**
 * Get service status — uses cache with 10s TTL.
 * Returns { active, updatedAt }.
 */
export async function getServiceStatusCached(): Promise<{ kdoActive: boolean; roomActive: boolean; updatedAt: string | null }> {
  const now = Date.now();

  if (cachedStatus && (now - cachedStatus.checkedAt) < CACHE_TTL_MS) {
    return { kdoActive: cachedStatus.kdoActive, roomActive: cachedStatus.roomActive, updatedAt: cachedStatus.updatedAt };
  }

  try {
    const settings = await db
      .select()
      .from(systemSettings);

    const kdoSetting = settings.find(s => s.key === 'kdo_service_active');
    const roomSetting = settings.find(s => s.key === 'room_service_active');

    // Default to true if not found in db
    const kdoActive = kdoSetting ? kdoSetting.value !== 'false' : true;
    const roomActive = roomSetting ? roomSetting.value !== 'false' : true;
    
    // Get latest updated at
    const latestUpdate = [kdoSetting?.updatedAt, roomSetting?.updatedAt]
      .filter(Boolean)
      .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0];
      
    const updatedAt = latestUpdate ? (latestUpdate as Date).toISOString() : null;

    cachedStatus = { kdoActive, roomActive, updatedAt, checkedAt: now };
    return { kdoActive, roomActive, updatedAt };
  } catch (err) {
    console.error('[ServiceStatusCache] Error checking service status:', err);
    // Default to active on error to avoid accidentally blocking all users
    return { kdoActive: true, roomActive: true, updatedAt: null };
  }
}

/**
 * Check only active status for specific service — lightweight version for maintenanceGuard.
 */
export async function isKdoServiceActive(): Promise<boolean> {
  const status = await getServiceStatusCached();
  return status.kdoActive;
}

export async function isRoomServiceActive(): Promise<boolean> {
  const status = await getServiceStatusCached();
  return status.roomActive;
}

/**
 * Invalidate cache — called when superadmin toggles service status.
 */
export function invalidateServiceStatusCache(): void {
  cachedStatus = null;
}
