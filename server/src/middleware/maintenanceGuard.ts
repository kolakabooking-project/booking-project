import type { Request, Response, NextFunction } from 'express';
import { isKdoServiceActive, isRoomServiceActive, invalidateServiceStatusCache } from '../lib/serviceStatusCache.js';

/**
 * Maintenance mode guard.
 * Checks if the service is currently disabled by superadmin.
 * Superadmin always bypasses maintenance mode.
 * Must be used AFTER authGuard so that req.user is available.
 *
 * Uses shared service status cache (10s TTL) from serviceStatusCache module.
 */

// Re-export for backward compatibility
export const invalidateMaintenanceCache = invalidateServiceStatusCache;

export async function maintenanceGuard(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  // Superadmin always bypasses maintenance mode
  if (user?.role === 'superadmin') {
    next();
    return;
  }

  const isRoomRoute = req.originalUrl.includes('/api/room');
  
  const active = isRoomRoute 
    ? await isRoomServiceActive()
    : await isKdoServiceActive();

  if (!active) {
    res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      message: 'Sistem sedang dalam perbaikan/maintenance. Silakan coba kembali nanti.',
    });
    return;
  }

  next();
}
