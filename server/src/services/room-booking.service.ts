import { db } from '../config/db.js';
import { roomBooking, roomBookingReview, user, room } from '../db/schema.js';
import { eq, and, or, not, lte, gte, desc, asc, ilike, lt, gt } from 'drizzle-orm';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors.js';
import { broadcastBookingUpdate } from '../lib/ably.js';

type RoomBookingInsert = typeof roomBooking.$inferInsert;

function computeRoomBookingStatus<T extends { status: string; endTime: Date }>(b: T): T {
  const now = new Date();
  if (
    (b.status === 'Disetujui' || b.status === 'Berlangsung') &&
    now > new Date(b.endTime)
  ) {
    return { ...b, status: 'Selesai' };
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

export async function getAllRoomBookings(filters?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  roomId?: string;
}) {
  let query = db
    .select({
      booking: roomBooking,
      userName: user.name,
      roomName: room.name,
      roomLokasi: room.lokasi,
    })
    .from(roomBooking)
    .leftJoin(user, eq(roomBooking.userId, user.id))
    .leftJoin(room, eq(roomBooking.roomId, room.id))
    .orderBy(desc(roomBooking.createdAt))
    .$dynamic();

  const conditions: any[] = [];

  if (filters?.status) {
    conditions.push(eq(roomBooking.status, filters.status as any));
  }

  if (filters?.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(user.name, term),
        ilike(roomBooking.keperluan, term),
        ilike(room.name, term)
      )
    );
  }

  if (filters?.startDate) {
    conditions.push(gte(roomBooking.startTime, new Date(filters.startDate)));
  }

  if (filters?.endDate) {
    conditions.push(lte(roomBooking.startTime, new Date(filters.endDate + 'T23:59:59')));
  }

  if (filters?.roomId) {
    conditions.push(eq(roomBooking.roomId, filters.roomId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const results = await query;

  return results.map((r) => ({
    ...computeRoomBookingStatus(r.booking),
    userName: r.userName,
    roomName: r.roomName && r.roomLokasi ? `${r.roomName} (${r.roomLokasi})` : r.roomName,
  }));
}

export async function getUserRoomBookings(userId: string) {
  const results = await db
    .select({
      booking: roomBooking,
      userName: user.name,
      roomName: room.name,
      roomLokasi: room.lokasi,
    })
    .from(roomBooking)
    .leftJoin(user, eq(roomBooking.userId, user.id))
    .leftJoin(room, eq(roomBooking.roomId, room.id))
    .where(eq(roomBooking.userId, userId))
    .orderBy(desc(roomBooking.startTime));

  return results.map((r) => ({
    ...computeRoomBookingStatus(r.booking),
    userName: r.userName,
    roomName: r.roomName && r.roomLokasi ? `${r.roomName} (${r.roomLokasi})` : r.roomName,
  }));
}

export async function getRoomBookingsForDate(dateStr: string) {
  const dayStart = new Date(dateStr);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dateStr);
  dayEnd.setHours(23, 59, 59, 999);

  const results = await db
    .select({
      booking: roomBooking,
      userName: user.name,
      roomName: room.name,
      roomLokasi: room.lokasi,
    })
    .from(roomBooking)
    .leftJoin(user, eq(roomBooking.userId, user.id))
    .leftJoin(room, eq(roomBooking.roomId, room.id))
    .where(
      and(
        not(eq(roomBooking.status, 'Dibatalkan')),
        lte(roomBooking.startTime, dayEnd),
        gte(roomBooking.endTime, dayStart)
      )
    )
    .orderBy(asc(roomBooking.startTime));

  return results.map((r) => ({
    ...computeRoomBookingStatus(r.booking),
    userName: r.userName,
    roomName: r.roomName && r.roomLokasi ? `${r.roomName} (${r.roomLokasi})` : r.roomName,
  }));
}

export async function getRoomReviewNotifications() {
  const results = await db
    .select({
      review: roomBookingReview,
      bookingData: roomBooking,
      userName: user.name,
    })
    .from(roomBookingReview)
    .innerJoin(roomBooking, eq(roomBookingReview.bookingId, roomBooking.id))
    .leftJoin(user, eq(roomBooking.userId, user.id))
    .where(eq(roomBookingReview.isNew, true))
    .orderBy(desc(roomBookingReview.createdAt));

  return results.map((r) => ({
    bookingId: r.bookingData.id,
    userName: r.userName,
    reviewNotes: r.review.reviewNotes,
    keperluan: r.bookingData.keperluan,
    createdAt: r.review.createdAt,
  }));
}

export async function getRoomBookingById(id: string) {
  const [result] = await db
    .select({
      booking: roomBooking,
      userName: user.name,
      roomName: room.name,
      roomLokasi: room.lokasi,
      reviewNotes: roomBookingReview.reviewNotes,
      isNewReview: roomBookingReview.isNew,
    })
    .from(roomBooking)
    .leftJoin(user, eq(roomBooking.userId, user.id))
    .leftJoin(room, eq(roomBooking.roomId, room.id))
    .leftJoin(roomBookingReview, eq(roomBookingReview.bookingId, roomBooking.id))
    .where(eq(roomBooking.id, id));

  if (!result) throw new NotFoundError('Peminjaman Ruangan');

  return {
    ...computeRoomBookingStatus(result.booking),
    userName: result.userName,
    roomName: result.roomName && result.roomLokasi ? `${result.roomName} (${result.roomLokasi})` : result.roomName,
    reviewNotes: result.reviewNotes || null,
    isNewReview: result.isNewReview || false,
  };
}

export async function createRoomBooking(data: RoomBookingInsert, isAdmin: boolean = false) {
  if (!data.keperluan) throw new ValidationError('Keperluan wajib diisi.');
  if (!data.startTime || !data.endTime) throw new ValidationError('Waktu mulai dan selesai wajib diisi.');
  if (!data.roomId) throw new ValidationError('Ruangan wajib dipilih.');

  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  // Check overlap securely
  const overlapping = await db
    .select({ id: roomBooking.id })
    .from(roomBooking)
    .where(
      and(
        eq(roomBooking.roomId, data.roomId),
        not(eq(roomBooking.status, 'Dibatalkan')),
        lt(roomBooking.startTime, endTime),
        gt(roomBooking.endTime, startTime)
      )
    );

  if (overlapping.length > 0) {
    throw new ValidationError('Ruangan sudah dibooking pada waktu tersebut. Silakan pilih waktu atau ruangan lain.');
  }

  // Create as Disetujui
  const [created] = await db
    .insert(roomBooking)
    .values({ ...data, startTime, endTime, status: 'Disetujui' })
    .returning();

  const fullBooking = await getRoomBookingById(created.id);

  broadcastBookingUpdate('ROOM_BOOKING_CREATED', { booking: fullBooking }, 'room-bookings').catch((err) =>
    console.error('[RoomBookingService] Ably broadcast failed:', err)
  );

  if (!isAdmin) {
    (async () => {
      try {
        const adminUsers = await db.select({ id: user.id }).from(user).where(eq(user.role, 'admin'));
        const formattedStart = formatDateTime(startTime);
        const payload = {
          title: 'Peminjaman Ruangan Baru',
          body: `Pegawai ${fullBooking.userName || 'Pegawai'} meminjam ${fullBooking.roomName} untuk keperluan "${created.keperluan}" pada ${formattedStart}.`,
          url: '/admin/room/requests',
        };
        const { sendPushNotification } = await import('./push.service.js');
        await Promise.all(adminUsers.map(admin => sendPushNotification(admin.id, payload)));
      } catch (err) {
        console.error('[RoomBookingService] Failed to send push notifications:', err);
      }
    })();
  }

  return fullBooking;
}

export async function cancelRoomBooking(bookingId: string, userId: string, isAdmin: boolean = false, alasan?: string) {
  const [target] = await db.select().from(roomBooking).where(eq(roomBooking.id, bookingId));
  if (!target) throw new NotFoundError('Peminjaman Ruangan');
  
  if (!isAdmin && target.userId !== userId) {
    throw new ForbiddenError('Anda hanya bisa membatalkan peminjaman sendiri.');
  }

  if (isAdmin && !alasan?.trim()) {
    throw new ValidationError('Alasan pembatalan wajib diisi oleh Admin.');
  }
  
  if (target.status !== 'Disetujui' && target.status !== 'Berlangsung') {
    throw new ValidationError('Hanya peminjaman aktif yang bisa dibatalkan.');
  }

  const [cancelled] = await db
    .update(roomBooking)
    .set({ 
      status: 'Dibatalkan', 
      alasanPembatalan: isAdmin ? alasan : null,
      updatedAt: new Date() 
    })
    .where(eq(roomBooking.id, bookingId))
    .returning();

  const fullBooking = await getRoomBookingById(cancelled.id);

  broadcastBookingUpdate('ROOM_BOOKING_CANCELLED', { booking: fullBooking }, 'room-bookings').catch((err) =>
    console.error('[RoomBookingService] Ably broadcast failed:', err)
  );

  // If admin cancelled it, notify the user
  if (isAdmin) {
    (async () => {
      try {
        const formattedStart = formatDateTime(new Date(fullBooking.startTime));
        const payload = {
          title: 'Peminjaman Ruangan Dibatalkan',
          body: `Peminjaman ${fullBooking.roomName} pada ${formattedStart} dibatalkan oleh Admin. Alasan: ${cancelled.alasanPembatalan}`,
          url: '/user/room/my-bookings',
        };
        const { sendPushNotification } = await import('./push.service.js');
        await sendPushNotification(fullBooking.userId, payload);
      } catch (err) {
        console.error('[RoomBookingService] Failed to send push notification:', err);
      }
    })();
  }

  return fullBooking;
}

export async function submitRoomReview(bookingId: string, reviewNotes: string, userId: string) {
  if (!reviewNotes?.trim()) throw new ValidationError('Catatan review tidak boleh kosong.');

  const [target] = await db.select().from(roomBooking).where(eq(roomBooking.id, bookingId));
  if (!target) throw new NotFoundError('Peminjaman');
  if (target.userId !== userId) throw new ForbiddenError('Anda hanya bisa memberikan review untuk peminjaman sendiri.');

  await db
    .update(roomBooking)
    .set({
      status: 'Selesai dengan Catatan',
      updatedAt: new Date(),
    })
    .where(eq(roomBooking.id, bookingId));

  const [review] = await db
    .insert(roomBookingReview)
    .values({ bookingId, reviewNotes, isNew: true })
    .onConflictDoUpdate({
      target: roomBookingReview.bookingId,
      set: { reviewNotes, isNew: true, createdAt: new Date() },
    })
    .returning();

  const fullBooking = await getRoomBookingById(bookingId);

  broadcastBookingUpdate('ROOM_REVIEW_SUBMITTED', { booking: fullBooking }, 'room-bookings').catch((err) =>
    console.error('[RoomBookingService] Ably broadcast failed:', err)
  );

  return review;
}

export async function markRoomReviewAsRead(bookingId: string) {
  const [updated] = await db
    .update(roomBookingReview)
    .set({ isNew: false })
    .where(eq(roomBookingReview.bookingId, bookingId))
    .returning();

  if (!updated) throw new NotFoundError('Review');
  return updated;
}
