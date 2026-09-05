import { db } from '../config/db.js';
import { room, roomBooking } from '../db/schema.js';
import { eq, and, not, or, lte, gte, lt, gt, inArray, isNull, sql } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '../utils/errors.js';

type RoomInsert = typeof room.$inferInsert;

export async function getAllRooms() {
  const now = new Date();
  // NOTE: foto is EXCLUDED to save egress bandwidth.
  // Photos are fetched individually via getRoomPhoto() when needed.
  const allRooms = await db
    .select({
      id: room.id,
      name: room.name,
      lokasi: room.lokasi,
      status: room.status,
      hasFoto: sql<boolean>`(${room.foto} IS NOT NULL AND ${room.foto} != '')`.as('has_foto'),
      deletedAt: room.deletedAt,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    })
    .from(room)
    .where(isNull(room.deletedAt));

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
    .select({
      id: room.id,
      name: room.name,
      lokasi: room.lokasi,
      status: room.status,
      hasFoto: sql<boolean>`(${room.foto} IS NOT NULL AND ${room.foto} != '')`.as('has_foto'),
      deletedAt: room.deletedAt,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    })
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

/**
 * Get only the photo (foto) for a single room by ID.
 * Used by the lazy-load photo endpoint to avoid sending Base64 in list queries.
 */
export async function getRoomPhoto(id: string) {
  const [found] = await db
    .select({ id: room.id, foto: room.foto })
    .from(room)
    .where(and(eq(room.id, id), isNull(room.deletedAt)));
  if (!found) throw new NotFoundError('Ruangan');
  return found.foto;
}

export async function createRoom(data: any) {
  if (!data.name || !data.lokasi) {
    throw new ValidationError('Nama dan lokasi ruangan wajib diisi.');
  }

  // Support both photo and foto fields from frontend
  const insertData: any = { ...data };
  if (insertData.photo !== undefined && insertData.foto === undefined) {
    insertData.foto = insertData.photo;
    delete insertData.photo;
  }
  if (insertData.foto === '') insertData.foto = null;

  const [created] = await db.insert(room).values(insertData).returning();
  return created;
}

export async function updateRoom(id: string, data: any) {
  const { id: _, createdAt, updatedAt, ...updateData } = data;
  
  // Support both photo and foto fields from frontend
  if (updateData.photo !== undefined && updateData.foto === undefined) {
    updateData.foto = updateData.photo;
    delete updateData.photo;
  }
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
