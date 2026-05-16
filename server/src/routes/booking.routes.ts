import { Router, type Request, type Response } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';
import * as bookingService from '../services/booking.service.js';
import { AppError } from '../utils/errors.js';

const router = Router();

router.use(authGuard);

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
    const booking = await bookingService.getBookingById(req.params.id as string);
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
    const userId = (req as any).user.id;
    const booking = await bookingService.createBooking({
      ...req.body,
      userId,
    });
    res.status(201).json({ data: booking });
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
    const userId = (req as any).user.id;
    const booking = await bookingService.createMandatoryBooking({
      ...req.body,
      userId,
    });
    res.status(201).json({ data: booking });
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
    const { vehicleId, driverId } = req.body;
    if (!vehicleId) {
      res.status(400).json({ error: 'vehicleId wajib diisi.' });
      return;
    }
    const booking = await bookingService.approveBooking(req.params.id as string, vehicleId, driverId || null);
    res.json({ data: booking });
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
    const { alasan } = req.body;
    const booking = await bookingService.rejectBooking(req.params.id as string, alasan);
    res.json({ data: booking });
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
    const userId = (req as any).user.id;
    const booking = await bookingService.cancelBooking(req.params.id as string, userId);
    res.json({ data: booking });
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
    const userId = (req as any).user.id;
    const { reviewNotes } = req.body;
    const review = await bookingService.submitReview(req.params.id as string, reviewNotes, userId);
    res.json({ data: review });
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
