import { db } from '../config/db.js';
import { roomBooking, user, room } from '../db/schema.js';
import { eq, and, or, gte, lte, not, count } from 'drizzle-orm';

interface RoomReportFilters {
  startDate?: string;
  endDate?: string;
  roomId?: string;
}

export async function getRoomReportSummary(filters?: RoomReportFilters) {
  const baseConditions: any[] = [];

  if (filters?.startDate) {
    baseConditions.push(gte(roomBooking.startTime, new Date(filters.startDate)));
  }
  if (filters?.endDate) {
    baseConditions.push(lte(roomBooking.startTime, new Date(filters.endDate + 'T23:59:59')));
  }
  if (filters?.roomId) {
    baseConditions.push(eq(roomBooking.roomId, filters.roomId));
  }

  const validConditions = [...baseConditions, not(eq(roomBooking.status, 'Dibatalkan'))];
  const validWhere = validConditions.length > 0 ? and(...validConditions) : undefined;

  const [totalResult] = await db.select({ count: count() }).from(roomBooking).where(validWhere);

  const [completedResult] = await db
    .select({ count: count() })
    .from(roomBooking)
    .where(
      validWhere
        ? and(validWhere, or(eq(roomBooking.status, 'Selesai'), eq(roomBooking.status, 'Selesai dengan Catatan')))
        : or(eq(roomBooking.status, 'Selesai'), eq(roomBooking.status, 'Selesai dengan Catatan'))
    );
    
  const [activeResult] = await db
    .select({ count: count() })
    .from(roomBooking)
    .where(
      validWhere
        ? and(validWhere, or(eq(roomBooking.status, 'Disetujui'), eq(roomBooking.status, 'Berlangsung')))
        : or(eq(roomBooking.status, 'Disetujui'), eq(roomBooking.status, 'Berlangsung'))
    );

  const cancelledConditions = [...baseConditions, eq(roomBooking.status, 'Dibatalkan')];
  const cancelledWhere = cancelledConditions.length > 0 ? and(...cancelledConditions) : undefined;
  
  const [cancelledResult] = await db.select({ count: count() }).from(roomBooking).where(cancelledWhere);

  return {
    total: totalResult.count,
    active: activeResult.count,
    completed: completedResult.count,
    cancelled: cancelledResult.count,
  };
}

export async function getRoomExportData(filters?: RoomReportFilters) {
  const conditions: any[] = [];

  if (filters?.startDate) {
    conditions.push(gte(roomBooking.startTime, new Date(filters.startDate)));
  }
  if (filters?.endDate) {
    conditions.push(lte(roomBooking.startTime, new Date(filters.endDate + 'T23:59:59')));
  }
  if (filters?.roomId) {
    conditions.push(eq(roomBooking.roomId, filters.roomId));
  }

  conditions.push(not(eq(roomBooking.status, 'Dibatalkan')));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

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
    .where(where)
    .orderBy(roomBooking.startTime);

  return results.map((r) => ({
    id: r.booking.id,
    userName: r.userName,
    startTime: r.booking.startTime,
    endTime: r.booking.endTime,
    keperluan: r.booking.keperluan,
    roomName: r.roomName && r.roomLokasi ? `${r.roomName} (${r.roomLokasi})` : r.roomName,
    jumlahPeserta: r.booking.jumlahPeserta,
    status: r.booking.status,
    catatan: r.booking.catatan,
  }));
}
