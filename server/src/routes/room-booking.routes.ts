import { Router, type Request, type Response } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';
import * as roomBookingService from '../services/room-booking.service.js';
import { AppError } from '../utils/errors.js';
import { logActivity } from '../services/activity.service.js';

const router = Router();

// All routes require authentication
router.use(authGuard);

/**
 * GET /api/room-bookings — All room bookings (admin)
 */
router.get('/', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      search: req.query.search as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      roomId: req.query.roomId as string,
    };
    const bookings = await roomBookingService.getAllRoomBookings(filters);
    res.json({ data: bookings });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/room-bookings/mine — User's bookings
 */
router.get('/mine', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const bookings = await roomBookingService.getUserRoomBookings(user.id);
    res.json({ data: bookings });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/room-bookings/notifications — Review notifications
 */
router.get('/notifications', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const notifications = await roomBookingService.getRoomReviewNotifications();
    res.json({ data: notifications });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/room-bookings/date/:date — Bookings for specific date
 */
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const bookings = await roomBookingService.getRoomBookingsForDate(req.params.date as string);
    res.json({ data: bookings });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/room-bookings/:id — Single booking detail
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const booking = await roomBookingService.getRoomBookingById(req.params.id as string);
    
    if (user.role !== 'admin' && user.role !== 'superadmin' && booking.userId !== user.id) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    
    res.json({ data: booking });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/room-bookings — Create room booking (auto-approved)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const booking = await roomBookingService.createRoomBooking({
      ...req.body,
      userId: user.id,
    });
    res.status(201).json({ data: booking });

    logActivity({
      userId: user.id,
      userName: user.name,
      action: 'ROOM_BOOKING_CREATED',
      targetId: booking.id,
      targetName: `Peminjaman Ruangan: ${booking.keperluan}`,
      detail: `Membuat pengajuan peminjaman ruangan: ${booking.roomName}`,
      ipAddress: (Array.isArray(req.ip) ? req.ip[0] : req.ip) || undefined,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/room-bookings/mandatory — Create mandatory room booking
 */
router.post('/mandatory', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const booking = await roomBookingService.createRoomBooking({
      ...req.body,
      userId: admin.id,
    }, true);
    res.status(201).json({ data: booking });

    logActivity({
      userId: admin.id,
      userName: admin.name,
      action: 'ROOM_BOOKING_CREATED',
      targetId: booking.id,
      targetName: `Mandatory Peminjaman Ruangan: ${booking.keperluan}`,
      detail: `Admin membuat peminjaman wajib ruangan: ${booking.roomName}`,
      ipAddress: (Array.isArray(req.ip) ? req.ip[0] : req.ip) || undefined,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * PATCH /api/room-bookings/:id/cancel — Cancel room booking
 */
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const { alasan } = req.body;

    const booking = await roomBookingService.cancelRoomBooking(req.params.id as string, user.id, isAdmin, alasan);
    res.json({ data: booking });

    logActivity({
      userId: user.id,
      userName: user.name,
      action: 'ROOM_BOOKING_CANCELLED',
      targetId: booking.id,
      targetName: `Peminjaman Ruangan: ${booking.keperluan}`,
      detail: isAdmin 
        ? `Admin membatalkan peminjaman ruangan. Alasan: ${alasan}`
        : `User membatalkan peminjaman ruangan.`,
      ipAddress: (Array.isArray(req.ip) ? req.ip[0] : req.ip) || undefined,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/room-bookings/:id/review — Submit post-use review
 */
router.post('/:id/review', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { reviewNotes } = req.body;
    
    await roomBookingService.submitRoomReview(req.params.id as string, reviewNotes, user.id);
    res.json({ message: 'Review berhasil disubmit.' });

    logActivity({
      userId: user.id,
      userName: user.name,
      action: 'ROOM_BOOKING_REVIEW',
      targetId: req.params.id as string,
      targetName: `Review Ruangan`,
      detail: `User memberikan ulasan penggunaan ruangan`,
      ipAddress: (Array.isArray(req.ip) ? req.ip[0] : req.ip) || undefined,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * PATCH /api/room-bookings/:id/review/read — Mark review as read
 */
router.patch('/:id/review/read', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    await roomBookingService.markRoomReviewAsRead(req.params.id as string);
    res.json({ message: 'Review telah ditandai sudah dibaca.' });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;
