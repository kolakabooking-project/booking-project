import { Router, type Request, type Response } from 'express';
import { roleGuard } from '../middleware/roleGuard.js';
import * as bookingService from '../services/booking.service.js';
import { AppError } from '../utils/errors.js';
import { logActivity } from '../services/activity.service.js';

const router = Router();

/** Extract client IP safely */
function getIp(req: Request): string | undefined {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
}

/**
 * GET /api/bookings — All bookings with filters (admin)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search, startDate, endDate, vehicleId } = req.query;
    const bookings = await bookingService.getAllBookings({
      status: status as string,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
      vehicleId: vehicleId as string,
    });
    res.json({ data: bookings });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/bookings/mine — Current user's bookings
 */
router.get('/mine', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const bookings = await bookingService.getUserBookings(userId);
    res.json({ data: bookings });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/bookings/pending — Pending approval queue (admin)
 */
router.get('/pending', roleGuard('admin'), async (_req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getPendingBookings();
    res.json({ data: bookings });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/bookings/notifications — Unread review notifications (admin)
 */
router.get('/notifications', roleGuard('admin'), async (_req: Request, res: Response) => {
  try {
    const notifications = await bookingService.getReviewNotifications();
    res.json({ data: notifications });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/bookings/pegawai — Active pegawai list for admin selection
 */
router.get('/pegawai', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const pegawaiList = await bookingService.getPegawaiList(search);
    res.json({ data: pegawaiList });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/bookings/date/:date — Bookings for specific date
 */
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getBookingsForDate(req.params.date as string);
    res.json({ data: bookings });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/bookings/:id — Single booking detail
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const booking = await bookingService.getBookingById(req.params.id as string);

    // Standard user can only read their own bookings (IDOR protection)
    if (actor.role === 'user' && booking.userId !== actor.id) {
      res.status(403).json({ error: 'Forbidden', message: 'Anda tidak memiliki akses untuk melihat peminjaman ini.' });
      return;
    }

    res.json({ data: booking });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/bookings — Create booking (user: Pending)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const booking = await bookingService.createBooking({
      ...req.body,
      userId: actor.id,
    });
    res.status(201).json({ data: booking });

    // Log: user request
    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'BOOKING_CREATED',
      targetId: booking.id,
      detail: `Pengajuan peminjaman: ${req.body.keperluan || '-'}`,
      ipAddress: getIp(req),
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/bookings/mandatory — Create mandatory booking (admin: Disetujui)
 */
router.post('/mandatory', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { targetUserId, targetUserName, ...restBody } = req.body;
    const booking = await bookingService.createMandatoryBooking({
      ...restBody,
      userId: targetUserId || restBody.userId || actor.id,
    });
    res.status(201).json({ data: booking });

    // Log: admin mandatory booking
    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'BOOKING_MANDATORY',
      targetId: booking.id,
      targetName: booking.userName || targetUserName || undefined,
      detail: `Booking mandatory dibuat untuk ${booking.userName || targetUserName || actor.name}: ${req.body.keperluan || '-'} (langsung disetujui)`,
      ipAddress: getIp(req),
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * PATCH /api/bookings/:id/approve — Approve booking (admin)
 */
router.patch('/:id/approve', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { vehicleId, driverId } = req.body;
    if (!vehicleId) {
      res.status(400).json({ error: 'vehicleId wajib diisi.' });
      return;
    }
    const booking = await bookingService.approveBooking(req.params.id as string, vehicleId, driverId || null);
    res.json({ data: booking });

    // Log: admin approve — booking already contains userName/keperluan (no extra DB call)
    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'BOOKING_APPROVED',
      targetId: booking.id,
      targetName: booking.userName || undefined,
      detail: `Peminjaman disetujui: ${booking.keperluan || '-'}`,
      ipAddress: getIp(req),
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * PATCH /api/bookings/:id/reject — Reject booking (admin)
 */
router.patch('/:id/reject', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { alasan } = req.body;
    const booking = await bookingService.rejectBooking(req.params.id as string, alasan);
    res.json({ data: booking });

    // Log: admin reject — booking already contains userName/keperluan (no extra DB call)
    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'BOOKING_REJECTED',
      targetId: booking.id,
      targetName: booking.userName || undefined,
      detail: `Peminjaman ditolak: ${alasan || '-'}`,
      ipAddress: getIp(req),
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * PATCH /api/bookings/:id/complete — Complete booking early / finish trip (admin)
 */
router.patch('/:id/complete', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { catatan } = req.body || {};
    const booking = await bookingService.completeBookingEarly(req.params.id as string, catatan);
    res.json({ data: booking });

    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'BOOKING_COMPLETED',
      targetId: booking.id,
      targetName: booking.userName || undefined,
      detail: `Peminjaman diselesaikan lebih awal / kendaraan kembali: ${booking.keperluan || '-'}${catatan ? ` (Catatan: ${catatan})` : ''}`,
      ipAddress: getIp(req),
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * PATCH /api/bookings/:id/cancel — Cancel own booking
 */
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { alasan } = req.body || {};
    const booking = await bookingService.cancelBooking(
      req.params.id as string,
      actor.id,
      actor.role === 'admin',
      alasan
    );
    res.json({ data: booking });

    // Log: cancel
    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'BOOKING_CANCELLED',
      targetId: booking.id,
      detail: actor.role === 'admin' ? `Peminjaman dibatalkan oleh Admin: ${alasan || '-'}` : `Peminjaman dibatalkan oleh user`,
      ipAddress: getIp(req),
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/bookings/:id/review — Submit post-trip review
 */
router.post('/:id/review', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { reviewNotes } = req.body;

    // submitReview service internally handles ownership validation and 404 checks securely
    const review = await bookingService.submitReview(req.params.id as string, reviewNotes, actor.id);
    res.json({ data: review });

    // Log: user review
    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'BOOKING_REVIEW',
      targetId: req.params.id as string,
      detail: `Review perjalanan disubmit: ${(reviewNotes || '').substring(0, 100)}`,
      ipAddress: getIp(req),
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * PATCH /api/bookings/:id/review/read — Mark review as read (admin)
 */
router.patch('/:id/review/read', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const review = await bookingService.markReviewAsRead(req.params.id as string);
    res.json({ data: review });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;
