import { Router, Request, Response } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import * as notificationService from '../services/notification.service.js';

const router = Router();

// Get all notifications for the logged-in user
router.get('/', authGuard, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const notifications = await notificationService.getUserNotifications(user.id);
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// Mark all notifications as read
router.put('/read-all', authGuard, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await notificationService.markAllAsRead(user.id);
    res.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca' });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// Mark a specific notification as read
router.put('/:id/read', authGuard, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    await notificationService.markAsRead(id, user.id);
    res.json({ success: true, message: 'Notifikasi ditandai sudah dibaca' });
  } catch (error: any) {
    console.error(`Error marking notification ${req.params.id} as read:`, error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

export default router;
