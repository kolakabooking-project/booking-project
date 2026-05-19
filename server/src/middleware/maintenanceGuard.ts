import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/db.js';
import { systemSettings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Maintenance mode guard.
 * Checks if the service is currently disabled by superadmin.
 * Superadmin always bypasses maintenance mode.
 * Must be used AFTER authGuard so that req.user is available.
 *
 * Caches the status in memory for 10 seconds to avoid excessive DB queries.
 */

let cachedStatus: { active: boolean; checkedAt: number } | null = null;
const CACHE_TTL_MS = 10_000; // 10 seconds

async function getServiceStatus(): Promise<boolean> {
  const now = Date.now();

  if (cachedStatus && (now - cachedStatus.checkedAt) < CACHE_TTL_MS) {
    return cachedStatus.active;
  }

  try {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'service_active'));

    const active = setting?.value !== 'false';
    cachedStatus = { active, checkedAt: now };
    return active;
  } catch (err) {
    console.error('[MaintenanceGuard] Error checking service status:', err);
    // Default to active on error to avoid accidentally blocking all users
    return true;
  }
}

/**
 * Invalidate cache — called when superadmin toggles service status.
 */
export function invalidateMaintenanceCache(): void {
  cachedStatus = null;
}

export async function maintenanceGuard(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  // Superadmin always bypasses maintenance mode
  if (user?.role === 'superadmin') {
    next();
    return;
  }

  const isActive = await getServiceStatus();

  if (!isActive) {
    res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      message: 'Sistem sedang dalam perbaikan/maintenance. Silakan coba kembali nanti.',
    });
    return;
  }

  next();
}
