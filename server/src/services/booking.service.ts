import { db } from '../config/db.js';
import { booking, bookingReview, user, vehicle, driver } from '../db/schema.js';
import { eq, and, or, not, lte, gte, desc, asc, ilike, inArray, sql } from 'drizzle-orm';
import { BOOKING_STATUS, TERMINAL_BOOKING_STATUSES, ACTIVE_BOOKING_STATUSES } from '../utils/constants.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors.js';
import { broadcastBookingUpdate } from '../lib/ably.js';

type BookingInsert = typeof booking.$inferInsert;

// ─── Helpers ───

/**
 * Apply computed status: if endTime is past and status is ONGOING/APPROVED → COMPLETED.
 */
function computeBookingStatus<T extends { status: string; endTime: Date }>(b: T): T {
  const now = new Date();
  if (
    (b.status === BOOKING_STATUS.ONGOING || b.status === BOOKING_STATUS.APPROVED) &&
    now > new Date(b.endTime)
  ) {
    return { ...b, status: BOOKING_STATUS.COMPLETED };
  }
  return b;
}

function formatDateTime(d: Date): string {
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Makassar',
  }) + ' WITA';
}

// ─── Queries ───

/**
 * Get all bookings with filters (admin).
 */
export async function getAllBookings(filters?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  vehicleId?: string;
}) {
  let query = db
    .select({
      booking: booking,
      userName: user.name,
      vehiclePlat: vehicle.platNomor,
      vehicleMerek: vehicle.merek,
      driverName: driver.name,
    })
    .from(booking)
    .leftJoin(user, eq(booking.userId, user.id))
    .leftJoin(vehicle, eq(booking.vehicleId, vehicle.id))
    .leftJoin(driver, eq(booking.driverId, driver.id))
    .orderBy(desc(booking.createdAt))
    .$dynamic();

  const conditions: any[] = [];

  if (filters?.status) {
    conditions.push(eq(booking.status, filters.status as typeof booking.status.enumValues[number]));
  }

  if (filters?.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(user.name, term),
        ilike(booking.keperluan, term),
        ilike(vehicle.platNomor, term),
        ilike(vehicle.merek, term)
      )
    );
  }

  if (filters?.startDate) {
    conditions.push(gte(booking.startTime, new Date(filters.startDate)));
  }

  if (filters?.endDate) {
    conditions.push(lte(booking.startTime, new Date(filters.endDate + 'T23:59:59')));
  }

  if (filters?.vehicleId) {
    conditions.push(eq(booking.vehicleId, filters.vehicleId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const results = await query;

  return results.map((r) => ({
    ...computeBookingStatus(r.booking),
    userName: r.userName,
    vehicleName: r.vehiclePlat && r.vehicleMerek
      ? `${r.vehicleMerek} (${r.vehiclePlat})`
      : null,
    driverName: r.driverName,
  }));
}

/**
 * Get bookings for a specific user.
 */
export async function getUserBookings(userId: string) {
  const results = await db
    .select({
      booking: booking,
      userName: user.name,
      vehiclePlat: vehicle.platNomor,
      vehicleMerek: vehicle.merek,
      driverName: driver.name,
    })
    .from(booking)
    .leftJoin(user, eq(booking.userId, user.id))
    .leftJoin(vehicle, eq(booking.vehicleId, vehicle.id))
    .leftJoin(driver, eq(booking.driverId, driver.id))
    .where(eq(booking.userId, userId))
    .orderBy(desc(booking.startTime));

  return results.map((r) => ({
    ...computeBookingStatus(r.booking),
    userName: r.userName,
    vehicleName: r.vehiclePlat && r.vehicleMerek
      ? `${r.vehicleMerek} (${r.vehiclePlat})`
      : null,
    driverName: r.driverName,
  }));
}

/**
 * Get pending bookings (approval queue).
 */
export async function getPendingBookings() {
  return getAllBookings({ status: BOOKING_STATUS.PENDING });
}

/**
 * Get bookings for a specific date.
 */
export async function getBookingsForDate(dateStr: string) {
  const dayStart = new Date(dateStr);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dateStr);
  dayEnd.setHours(23, 59, 59, 999);

  const results = await db
    .select({
      booking: booking,
      userName: user.name,
      vehiclePlat: vehicle.platNomor,
      vehicleMerek: vehicle.merek,
      driverName: driver.name,
    })
    .from(booking)
    .leftJoin(user, eq(booking.userId, user.id))
    .leftJoin(vehicle, eq(booking.vehicleId, vehicle.id))
    .leftJoin(driver, eq(booking.driverId, driver.id))
    .where(
      and(
        not(inArray(booking.status, [BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED])),
        lte(booking.startTime, dayEnd),
        gte(booking.endTime, dayStart)
      )
    )
    .orderBy(asc(booking.startTime));

  return results.map((r) => ({
    ...computeBookingStatus(r.booking),
    userName: r.userName,
    vehicleName: r.vehiclePlat && r.vehicleMerek
      ? `${r.vehicleMerek} (${r.vehiclePlat})`
      : null,
    driverName: r.driverName,
  }));
}

/**
 * Get unread review notifications.
 */
export async function getReviewNotifications() {
  const results = await db
    .select({
      review: bookingReview,
      bookingData: booking,
      userName: user.name,
    })
    .from(bookingReview)
    .innerJoin(booking, eq(bookingReview.bookingId, booking.id))
    .leftJoin(user, eq(booking.userId, user.id))
    .where(eq(bookingReview.isNew, true))
    .orderBy(desc(bookingReview.createdAt));

  return results.map((r) => ({
    bookingId: r.bookingData.id,
    userName: r.userName,
    reviewNotes: r.review.reviewNotes,
    keperluan: r.bookingData.keperluan,
    createdAt: r.review.createdAt,
  }));
}

/**
 * Get a single booking by ID.
 */
export async function getBookingById(id: string) {
  // Single query with LEFT JOIN for review — eliminates a separate DB roundtrip
  const [result] = await db
    .select({
      booking: booking,
      userName: user.name,
      vehiclePlat: vehicle.platNomor,
      vehicleMerek: vehicle.merek,
      driverName: driver.name,
      reviewNotes: bookingReview.reviewNotes,
      isNewReview: bookingReview.isNew,
    })
    .from(booking)
    .leftJoin(user, eq(booking.userId, user.id))
    .leftJoin(vehicle, eq(booking.vehicleId, vehicle.id))
    .leftJoin(driver, eq(booking.driverId, driver.id))
    .leftJoin(bookingReview, eq(bookingReview.bookingId, booking.id))
    .where(eq(booking.id, id));

  if (!result) throw new NotFoundError('Peminjaman');

  return {
    ...computeBookingStatus(result.booking),
    userName: result.userName,
    vehicleName: result.vehiclePlat && result.vehicleMerek
      ? `${result.vehicleMerek} (${result.vehiclePlat})`
      : null,
    driverName: result.driverName,
    reviewNotes: result.reviewNotes || null,
    isNewReview: result.isNewReview || false,
  };
}

// ─── Mutations ───

/**
 * Create a new booking (user — status=Pending).
 */
export async function createBooking(data: BookingInsert) {
  if (!data.keperluan) throw new ValidationError('Keperluan wajib diisi.');
  if (!data.startTime || !data.endTime) throw new ValidationError('Waktu mulai dan selesai wajib diisi.');

  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  // ── Core mutation (awaited — must succeed) ──
  const [created] = await db
    .insert(booking)
    .values({ ...data, startTime, endTime, status: BOOKING_STATUS.PENDING })
    .returning();

  const fullBooking = await getBookingById(created.id);

  // ── Side-effects: fire-and-forget (non-blocking) ──
  // DB mutation is committed; broadcast & push are best-effort.
  broadcastBookingUpdate('BOOKING_CREATED', { booking: fullBooking }).catch((err) =>
    console.error('[BookingService] Ably broadcast failed:', err)
  );

  // Push notification to admins — uses fullBooking.userName instead of separate DB query
  (async () => {
    try {
      const adminUsers = await db.select({ id: user.id }).from(user).where(eq(user.role, 'admin'));
      const formattedStart = formatDateTime(startTime);
      const payload = {
        title: 'Pengajuan Peminjaman Baru',
        body: `Pegawai ${fullBooking.userName || 'Pegawai'} mengajukan peminjaman ${created.jenisKendaraan} untuk keperluan "${created.keperluan}" pada ${formattedStart}. Mohon segera ditinjau.`,
        url: '/admin/requests',
      };
      const { sendPushNotification } = await import('./push.service.js');
      await Promise.all(adminUsers.map(admin => sendPushNotification(admin.id, payload)));
    } catch (err) {
      console.error('[BookingService] Failed to send push notifications for new booking:', err);
    }
  })();

  return fullBooking;
}

/**
 * Create a mandatory booking (admin — status=Disetujui).
 */
export async function createMandatoryBooking(data: BookingInsert) {
  if (!data.keperluan) throw new ValidationError('Keperluan wajib diisi.');
  if (!data.startTime || !data.endTime) throw new ValidationError('Waktu mulai dan selesai wajib diisi.');

  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  // ── Core mutation (awaited) ──
  const [created] = await db
    .insert(booking)
    .values({ ...data, startTime, endTime, status: BOOKING_STATUS.APPROVED })
    .returning();

  const fullBooking = await getBookingById(created.id);

  // ── Fire-and-forget broadcast ──
  broadcastBookingUpdate('BOOKING_CREATED', { booking: fullBooking }).catch((err) =>
    console.error('[BookingService] Ably broadcast failed:', err)
  );

  return fullBooking;
}

/**
 * Approve a booking.
 * Assigns vehicle (and optional driver), auto-rejects overlapping PENDING bookings.
 */
export async function approveBooking(
  bookingId: string,
  vehicleId: string,
  driverId: string | null
) {
  // ── Validation (awaited — security critical) ──
  const [target] = await db.select().from(booking).where(eq(booking.id, bookingId));
  if (!target) throw new NotFoundError('Peminjaman');
  if (target.status !== BOOKING_STATUS.PENDING) {
    throw new ValidationError('Hanya peminjaman dengan status Pending yang bisa disetujui.');
  }

  // ── Core mutation (awaited) ──
  const [approved] = await db
    .update(booking)
    .set({
      status: BOOKING_STATUS.APPROVED,
      vehicleId,
      driverId: driverId || null,
      updatedAt: new Date(),
    })
    .where(eq(booking.id, bookingId))
    .returning();

  // ── Parallelise: auto-reject overlapping + fetch full booking ──
  const tStart = new Date(target.startTime);
  const tEnd = new Date(target.endTime);

  const [, fullBooking] = await Promise.all([
    // Auto-reject overlapping PENDING bookings (data-integrity, must succeed)
    db
      .update(booking)
      .set({
        status: BOOKING_STATUS.REJECTED,
        alasanPenolakan:
          'Sistem Otomatis: Kendaraan telah disetujui untuk pengajuan lain pada waktu yang bersamaan.',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(booking.vehicleId, vehicleId),
          eq(booking.status, BOOKING_STATUS.PENDING),
          not(eq(booking.id, bookingId)),
          lte(booking.startTime, tEnd),
          gte(booking.endTime, tStart)
        )
      ),
    // Fetch enriched booking data
    getBookingById(approved.id),
  ]);

  // ── Side-effects: fire-and-forget (non-blocking) ──
  broadcastBookingUpdate('BOOKING_APPROVED', { booking: fullBooking }).catch((err) =>
    console.error('[BookingService] Ably broadcast failed:', err)
  );

  (async () => {
    try {
      const formattedStart = formatDateTime(new Date(fullBooking.startTime));
      const payload = {
        title: 'Pengajuan Peminjaman Disetujui',
        body: `Halo ${fullBooking.userName}, pengajuan kendaraan untuk keperluan "${fullBooking.keperluan}" pada ${formattedStart} telah disetujui menggunakan ${fullBooking.vehicleName || 'kendaraan dinas'}.`,
        url: '/user/my-bookings',
      };
      const { sendPushNotification } = await import('./push.service.js');
      await sendPushNotification(fullBooking.userId, payload);
    } catch (err) {
      console.error('[BookingService] Failed to send push notification for approved booking:', err);
    }
  })();

  return fullBooking;
}

/**
 * Reject a booking with a reason.
 */
export async function rejectBooking(bookingId: string, alasan: string) {
  if (!alasan?.trim()) throw new ValidationError('Alasan penolakan wajib diisi.');

  // ── Core mutation (awaited) ──
  const [rejected] = await db
    .update(booking)
    .set({
      status: BOOKING_STATUS.REJECTED,
      alasanPenolakan: alasan,
      updatedAt: new Date(),
    })
    .where(and(eq(booking.id, bookingId), eq(booking.status, BOOKING_STATUS.PENDING)))
    .returning();

  if (!rejected) throw new NotFoundError('Peminjaman Pending');
  
  const fullBooking = await getBookingById(rejected.id);

  // ── Side-effects: fire-and-forget ──
  broadcastBookingUpdate('BOOKING_REJECTED', { booking: fullBooking }).catch((err) =>
    console.error('[BookingService] Ably broadcast failed:', err)
  );

  (async () => {
    try {
      const formattedStart = formatDateTime(new Date(fullBooking.startTime));
      const payload = {
        title: 'Pengajuan Peminjaman Ditolak',
        body: `Halo ${fullBooking.userName}, pengajuan peminjaman untuk keperluan "${fullBooking.keperluan}" pada ${formattedStart} ditolak. Alasan: ${rejected.alasanPenolakan || '-'}`,
        url: '/user/my-bookings',
      };
      const { sendPushNotification } = await import('./push.service.js');
      await sendPushNotification(fullBooking.userId, payload);
    } catch (err) {
      console.error('[BookingService] Failed to send push notification for rejected booking:', err);
    }
  })();

  return fullBooking;
}

/**
 * Cancel a booking (only PENDING can be cancelled by users).
 */
export async function cancelBooking(bookingId: string, userId: string) {
  // ── Validation (awaited — security critical) ──
  const [target] = await db.select().from(booking).where(eq(booking.id, bookingId));
  if (!target) throw new NotFoundError('Peminjaman');
  if (target.userId !== userId) throw new ForbiddenError('Anda hanya bisa membatalkan peminjaman sendiri.');
  if (target.status !== BOOKING_STATUS.PENDING) {
    throw new ValidationError('Hanya peminjaman Pending yang bisa dibatalkan.');
  }

  // ── Core mutation (awaited) ──
  const [cancelled] = await db
    .update(booking)
    .set({ status: BOOKING_STATUS.CANCELLED, updatedAt: new Date() })
    .where(eq(booking.id, bookingId))
    .returning();

  const fullBooking = await getBookingById(cancelled.id);

  // ── Fire-and-forget broadcast ──
  broadcastBookingUpdate('BOOKING_CANCELLED', { booking: fullBooking }).catch((err) =>
    console.error('[BookingService] Ably broadcast failed:', err)
  );

  return fullBooking;
}

/**
 * Submit a post-trip review (user).
 */
export async function submitReview(bookingId: string, reviewNotes: string, userId: string) {
  if (!reviewNotes?.trim()) throw new ValidationError('Catatan review tidak boleh kosong.');

  // ── Validation (awaited — security critical) ──
  const [target] = await db.select().from(booking).where(eq(booking.id, bookingId));
  if (!target) throw new NotFoundError('Peminjaman');
  if (target.userId !== userId) throw new ForbiddenError('Anda hanya bisa memberikan review untuk peminjaman sendiri.');

  // ── Core mutations (awaited) ──
  // Update booking status
  await db
    .update(booking)
    .set({
      status: BOOKING_STATUS.COMPLETED_WITH_NOTES,
      updatedAt: new Date(),
    })
    .where(eq(booking.id, bookingId));

  // Insert review
  const [review] = await db
    .insert(bookingReview)
    .values({ bookingId, reviewNotes, isNew: true })
    .onConflictDoUpdate({
      target: bookingReview.bookingId,
      set: { reviewNotes, isNew: true, createdAt: new Date() },
    })
    .returning();

  const fullBooking = await getBookingById(bookingId);

  // ── Fire-and-forget broadcast ──
  broadcastBookingUpdate('REVIEW_SUBMITTED', { booking: fullBooking }).catch((err) =>
    console.error('[BookingService] Ably broadcast failed:', err)
  );

  return review;
}

/**
 * Mark a review notification as read (admin).
 */
export async function markReviewAsRead(bookingId: string) {
  const [updated] = await db
    .update(bookingReview)
    .set({ isNew: false })
    .where(eq(bookingReview.bookingId, bookingId))
    .returning();

  if (!updated) throw new NotFoundError('Review');
  return updated;
}
