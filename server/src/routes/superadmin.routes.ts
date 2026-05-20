import { Router, type Request, type Response } from 'express';
import { AppError } from '../utils/errors.js';
import * as superadminService from '../services/superadmin.service.js';
import * as activityService from '../services/activity.service.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Export limiter — very strict to prevent CU spikes from data exports
const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 exports per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Terlalu banyak permintaan export. Coba lagi dalam 15 menit.',
  },
  keyGenerator: (req: Request) => {
    const ip = req.ip;
    return Array.isArray(ip) ? ip[0] : (ip || 'unknown');
  },
});

/** Safely extract client IP (req.ip can be string | string[] in some Express versions) */
function getClientIp(req: Request): string | undefined {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
}

/** Centralized and Sanitized Error Handler to prevent leakage of internal DB error messages */
function handleError(err: any, res: Response) {
  const status = err instanceof AppError ? err.statusCode : 500;
  const message = status === 500 ? 'Terjadi kesalahan internal pada server' : err.message;
  if (status === 500) {
    console.error('[Superadmin Route Error]', err);
  }
  res.status(status).json({ error: message });
}

// ─── Consolidated Dashboard Endpoint ───

/**
 * GET /api/superadmin/dashboard — Single aggregated endpoint for dashboard
 *
 * Combines stats, recent logs, service status, and recent users into one response.
 * This eliminates 4 separate API calls (each with its own authGuard DB validation)
 * and reduces total queries from ~9 to ~4-5.
 */
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [stats, logsResult, serviceStatus, recentUsers] = await Promise.all([
      superadminService.getUserStats(),
      activityService.getActivityLogs({ limit: 6, skipCount: true }),
      superadminService.getServiceStatus(),
      superadminService.listRecentUsers(6),
    ]);

    res.json({
      data: {
        stats,
        recentLogs: logsResult.logs,
        serviceStatus,
        recentUsers,
      },
    });
  } catch (err: any) {
    handleError(err, res);
  }
});

// ─── User Management Routes ───

/**
 * GET /api/superadmin/users — List users (with optional server-side search & pagination)
 * 
 * Query params: search, role, page, limit
 * When no params provided, returns all users (backward compatible).
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { search, role, page, limit } = req.query;

    // If any filter/pagination params provided, use server-side pagination
    if (search || role || page || limit) {
      const result = await superadminService.listUsers({
        search: search as string,
        role: role as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json({ data: result });
    } else {
      // Backward compatible: return all users (for legacy calls)
      const users = await superadminService.listAllUsers();
      res.json({ data: users });
    }
  } catch (err: any) {
    handleError(err, res);
  }
});

/**
 * GET /api/superadmin/stats — User statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await superadminService.getUserStats();
    res.json({ data: stats });
  } catch (err: any) {
    handleError(err, res);
  }
});

/**
 * POST /api/superadmin/users — Create a new user
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { nip, name, jabatan, role } = req.body;

    if (!nip || !name) {
      res.status(400).json({ error: 'NIP dan nama wajib diisi.' });
      return;
    }

    const created = await superadminService.createUser(
      { nip, name, jabatan, role: role || 'user' },
      actor.id,
      actor.name,
      getClientIp(req)
    );

    res.status(201).json({ data: created });
  } catch (err: any) {
    handleError(err, res);
  }
});

/**
 * DELETE /api/superadmin/users/:id — Delete a user
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const result = await superadminService.deleteUser(
      req.params.id as string,
      actor.id,
      actor.name,
      getClientIp(req)
    );
    res.json({ data: result });
  } catch (err: any) {
    handleError(err, res);
  }
});

/**
 * PATCH /api/superadmin/users/:id/role — Change user role
 */
router.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Role harus "user" atau "admin".' });
      return;
    }

    const result = await superadminService.changeUserRole(
      req.params.id as string,
      role,
      actor.id,
      actor.name,
      getClientIp(req)
    );
    res.json({ data: result });
  } catch (err: any) {
    handleError(err, res);
  }
});

/**
 * PATCH /api/superadmin/users/:id/reset-password — Reset password to default
 */
router.patch('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const result = await superadminService.resetUserPassword(
      req.params.id as string,
      actor.id,
      actor.name,
      getClientIp(req)
    );
    res.json({ data: result });
  } catch (err: any) {
    handleError(err, res);
  }
});

// ─── Service Control Routes ───

/**
 * GET /api/superadmin/settings/service-status — Get service status
 */
router.get('/settings/service-status', async (_req: Request, res: Response) => {
  try {
    const status = await superadminService.getServiceStatus();
    res.json({ data: status });
  } catch (err: any) {
    handleError(err, res);
  }
});

/**
 * PATCH /api/superadmin/settings/service-status — Toggle service on/off
 */
router.patch('/settings/service-status', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      res.status(400).json({ error: 'Field "active" (boolean) wajib diisi.' });
      return;
    }

    const result = await superadminService.toggleService(
      active,
      actor.id,
      actor.name,
      getClientIp(req)
    );
    res.json({ data: result });
  } catch (err: any) {
    handleError(err, res);
  }
});

// ─── Activity Log Routes ───

/**
 * GET /api/superadmin/logs — Get activity logs (paginated)
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { action, userId, search, startDate, endDate, page, limit } = req.query;
    const result = await activityService.getActivityLogs({
      action: action as string,
      userId: userId as string,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({ data: result });
  } catch (err: any) {
    handleError(err, res);
  }
});

/**
 * GET /api/superadmin/logs/export — Export activity logs (all, for Excel)
 * Strict rate limiting applied to prevent CU consumption spikes
 */
router.get('/logs/export', exportLimiter, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const logs = await activityService.getActivityLogsForExport(
      startDate as string,
      endDate as string
    );
    res.json({ data: logs });
  } catch (err: any) {
    handleError(err, res);
  }
});

/**
 * POST /api/superadmin/logs/cleanup — Manual cleanup of old logs
 */
router.post('/logs/cleanup', async (_req: Request, res: Response) => {
  try {
    const deletedCount = await activityService.cleanupOldLogs();
    res.json({ data: { deletedCount, message: `${deletedCount} log lama berhasil dihapus.` } });
  } catch (err: any) {
    handleError(err, res);
  }
});

export default router;
