import { Router, type Request, type Response } from 'express';
import { AppError } from '../utils/errors.js';
import * as superadminService from '../services/superadmin.service.js';
import * as activityService from '../services/activity.service.js';

const router = Router();

/** Safely extract client IP (req.ip can be string | string[] in some Express versions) */
function getClientIp(req: Request): string | undefined {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
}

// ─── User Management Routes ───

/**
 * GET /api/superadmin/users — List all users
 */
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await superadminService.listAllUsers();
    res.json({ data: users });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
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
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
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
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
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
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
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
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
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
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/superadmin/logs/export — Export activity logs (all, for Excel)
 */
router.get('/logs/export', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const logs = await activityService.getActivityLogsForExport(
      startDate as string,
      endDate as string
    );
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

export default router;
