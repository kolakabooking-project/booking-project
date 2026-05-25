import { db } from '../config/db.js';
import { room, roomBooking } from '../db/schema.js';
import { eq, and, not, or, lte, gte, lt, gt, inArray, isNull } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '../utils/errors.js';

type RoomInsert = typeof room.$inferInsert;

export async function getAllRooms() {
  const now = new Date();
  const allRooms = await db.select().from(room).where(isNull(room.deletedAt));

  const activeBookings = await db
    .select({ roomId: roomBooking.roomId })
    .from(roomBooking)
    .where(
      and(
        inArray(roomBooking.status, ['Disetujui', 'Berlangsung']),
        lte(roomBooking.startTime, now),
        gte(roomBooking.endTime, now)
      )
    );

  const inUseRoomIds = new Set(activeBookings.map((b) => b.roomId).filter(Boolean));

  return allRooms.map((r) => {
    if (r.status === 'Dalam Perawatan') return r;
    if (inUseRoomIds.has(r.id)) return { ...r, status: 'Sedang Dipakai' };
    return { ...r, status: 'Tersedia' };
  });
}

export async function getAvailableRooms(startTime: Date, endTime: Date) {
  const overlapping = await db
    .select({ roomId: roomBooking.roomId })
    .from(roomBooking)
    .where(
      and(
        inArray(roomBooking.status, ['Disetujui', 'Berlangsung']),
        lt(roomBooking.startTime, endTime),
        gt(roomBooking.endTime, startTime)
      )
    );

  const bookedIds = new Set(overlapping.map((b) => b.roomId).filter(Boolean));

  const allRooms = await db
    .select()
    .from(room)
    .where(
      and(
        not(eq(room.status, 'Dalam Perawatan')),
        isNull(room.deletedAt)
      )
    );

  return allRooms.filter((r) => !bookedIds.has(r.id));
}

export async function getRoomById(id: string) {
  const [found] = await db.select().from(room).where(and(eq(room.id, id), isNull(room.deletedAt)));
  if (!found) throw new NotFoundError('Ruangan');
  return found;
}

export async function createRoom(data: RoomInsert) {
  if (!data.name || !data.lokasi) {
    throw new ValidationError('Nama dan lokasi ruangan wajib diisi.');
  }

  const [created] = await db.insert(room).values(data).returning();
  return created;
}

export async function updateRoom(id: string, data: any) {
  const { id: _, createdAt, updatedAt, ...updateData } = data;
  
  if (updateData.foto === '') updateData.foto = null;

  const [updated] = await db
    .update(room)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(room.id, id))
    .returning();

  if (!updated) throw new NotFoundError('Ruangan');
  return updated;
}

export async function deleteRoom(id: string) {
  const [deleted] = await db
    .update(room)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(room.id, id), isNull(room.deletedAt)))
    .returning();
  if (!deleted) throw new NotFoundError('Ruangan');
  return deleted;
}
