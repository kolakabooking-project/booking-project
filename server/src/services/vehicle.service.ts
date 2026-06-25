import { db } from '../config/db.js';
import { vehicle, booking } from '../db/schema.js';
import { eq, and, not, or, lte, gte, lt, gt, inArray, isNull, sql } from 'drizzle-orm';
import { BOOKING_STATUS, VEHICLE_STATUS, TERMINAL_BOOKING_STATUSES } from '../utils/constants.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

type VehicleInsert = typeof vehicle.$inferInsert;
type VehicleUpdate = Partial<Omit<VehicleInsert, 'id' | 'createdAt'>>;

/**
 * Get all vehicles with computed real-time status.
 * Vehicles with active bookings at the current moment are marked as "Sedang Dipakai".
 * Uses a single query with subquery instead of 2 separate queries.
 */
export async function getAllVehicles() {
  const now = new Date();

  // Single query: fetch vehicles + check active bookings via subquery
  const allVehicles = await db
    .select({
      id: vehicle.id,
      platNomor: vehicle.platNomor,
      merek: vehicle.merek,
      tipe: vehicle.tipe,
      tahun: vehicle.tahun,
      kapasitas: vehicle.kapasitas,
      status: vehicle.status,
      odometer: vehicle.odometer,
      jadwalPajak: vehicle.jadwalPajak,
      jadwalServis: vehicle.jadwalServis,
      warna: vehicle.warna,
      foto: vehicle.foto,
      deletedAt: vehicle.deletedAt,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
      isInUse: sql<boolean>`EXISTS (
        SELECT 1 FROM booking
        WHERE booking.vehicle_id = ${vehicle.id}
        AND booking.status IN ('Berlangsung', 'Disetujui')
        AND booking.start_time <= ${now.toISOString()}
        AND booking.end_time >= ${now.toISOString()}
      )`.as('is_in_use'),
    })
    .from(vehicle)
    .where(isNull(vehicle.deletedAt));

  return allVehicles.map((v) => {
    const { isInUse, ...vehicleData } = v;
    if (vehicleData.status === VEHICLE_STATUS.MAINTENANCE) return vehicleData;
    if (isInUse) return { ...vehicleData, status: VEHICLE_STATUS.IN_USE };
    return { ...vehicleData, status: VEHICLE_STATUS.AVAILABLE };
  });
}

/**
 * Get available vehicles for a specific time range.
 * Excludes vehicles that have overlapping non-terminal bookings,
 * and vehicles currently under maintenance.
 * NOTE: We do NOT filter by status = 'Tersedia' because 'Sedang Dipakai'
 * is a computed/real-time status. A vehicle that is in-use RIGHT NOW
 * may still be available for a booking at a different time.
 */
export async function getAvailableVehicles(startTime: Date, endTime: Date) {
  // Get vehicle IDs that have overlapping bookings
  const overlapping = await db
    .select({ vehicleId: booking.vehicleId })
    .from(booking)
    .where(
      and(
        not(inArray(booking.status, [...TERMINAL_BOOKING_STATUSES])),
        lt(booking.startTime, endTime),
        gt(booking.endTime, startTime)
      )
    );

  const bookedIds = new Set(overlapping.map((b) => b.vehicleId).filter(Boolean));

  // Exclude only vehicles under maintenance — not 'Sedang Dipakai' (which is computed)
  const allVehicles = await db
    .select()
    .from(vehicle)
    .where(
      and(
        not(eq(vehicle.status, VEHICLE_STATUS.MAINTENANCE)),
        isNull(vehicle.deletedAt)
      )
    );

  return allVehicles.filter((v) => !bookedIds.has(v.id));
}

/**
 * Get a single vehicle by ID.
 */
export async function getVehicleById(id: string) {
  const [found] = await db.select().from(vehicle).where(and(eq(vehicle.id, id), isNull(vehicle.deletedAt)));
  if (!found) throw new NotFoundError('Kendaraan');
  return found;
}

/**
 * Create a new vehicle.
 */
export async function createVehicle(data: VehicleInsert) {
  if (!data.platNomor || !data.merek) {
    throw new ValidationError('Plat nomor dan merek wajib diisi.');
  }

  const [created] = await db.insert(vehicle).values(data).returning();
  return created;
}

/**
 * Update an existing vehicle.
 */
export async function updateVehicle(id: string, data: any) {
  // Prevent Drizzle date serialization errors by stripping out fields that shouldn't be updated
  const { id: _, createdAt, updatedAt, ...updateData } = data;
  
  // Handle empty strings for dates
  if (updateData.jadwalPajak === '') updateData.jadwalPajak = null;
  if (updateData.jadwalServis === '') updateData.jadwalServis = null;
  if (updateData.foto === '') updateData.foto = null;

  const [updated] = await db
    .update(vehicle)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(vehicle.id, id))
    .returning();

  if (!updated) throw new NotFoundError('Kendaraan');
  return updated;
}

/**
 * Delete a vehicle.
 */
export async function deleteVehicle(id: string) {
  const [deleted] = await db
    .update(vehicle)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(vehicle.id, id), isNull(vehicle.deletedAt)))
    .returning();
  if (!deleted) throw new NotFoundError('Kendaraan');
  return deleted;
}
