import { Router, type Request, type Response } from 'express';
import * as announcementService from '../services/announcement.service.js';

const router = Router();

/**
 * GET /api/announcements/active — Get active announcements for current logged in user
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const activeList = await announcementService.getActiveAnnouncements(user.id, user.role || 'user');
    res.json({ success: true, data: activeList });
  } catch (error: any) {
    console.error('Error fetching active announcements:', error);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan saat mengambil notifikasi' });
  }
});

/**
 * POST /api/announcements/:id/acknowledge — Acknowledge an announcement (mark as read / don't show again)
 */
router.post('/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const id = req.params.id as string;
    await announcementService.acknowledgeAnnouncement(id, user.id);
    res.json({ success: true, message: 'Notifikasi berhasil dicatat sudah dibaca' });
  } catch (error: any) {
    console.error(`Error acknowledging announcement ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server' });
  }
});

export default router;
