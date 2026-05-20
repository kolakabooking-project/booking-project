import { db } from '../config/db.js';
import { vehicle, booking } from '../db/schema.js';
import { eq, and, not, or, lte, gte, inArray, isNull } from 'drizzle-orm';
import { BOOKING_STATUS, VEHICLE_STATUS, TERMINAL_BOOKING_STATUSES } from '../utils/constants.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

type VehicleInsert = typeof vehicle.$inferInsert;
type VehicleUpdate = Partial<Omit<VehicleInsert, 'id' | 'createdAt'>>;

/**
 * Get all vehicles with computed real-time status.
 * Vehicles with active bookings at the current moment are marked as "Sedang Dipakai".
 */
export async function getAllVehicles() {
  const now = new Date();
  const allVehicles = await db.select().from(vehicle).where(isNull(vehicle.deletedAt));

  // Get active bookings to compute "in-use" status
  const activeBookings = await db
    .select({ vehicleId: booking.vehicleId })
    .from(booking)
    .where(
      and(
        inArray(booking.status, [BOOKING_STATUS.ONGOING, BOOKING_STATUS.APPROVED]),
        lte(booking.startTime, now),
        gte(booking.endTime, now)
      )
    );

  const inUseVehicleIds = new Set(activeBookings.map((b) => b.vehicleId).filter(Boolean));

  return allVehicles.map((v) => {
    if (v.status === VEHICLE_STATUS.MAINTENANCE) return v;
    if (inUseVehicleIds.has(v.id)) return { ...v, status: VEHICLE_STATUS.IN_USE };
    return { ...v, status: VEHICLE_STATUS.AVAILABLE };
  });
}

/**
 * Get available vehicles for a specific time range.
 * Excludes vehicles that have overlapping non-terminal bookings.
 */
export async function getAvailableVehicles(startTime: Date, endTime: Date) {
  // Get vehicle IDs that have overlapping bookings
  const overlapping = await db
    .select({ vehicleId: booking.vehicleId })
    .from(booking)
    .where(
      and(
        not(inArray(booking.status, [...TERMINAL_BOOKING_STATUSES])),
        lte(booking.startTime, endTime),
        gte(booking.endTime, startTime)
      )
    );

  const bookedIds = new Set(overlapping.map((b) => b.vehicleId).filter(Boolean));

  const allVehicles = await db
    .select()
    .from(vehicle)
    .where(and(eq(vehicle.status, 'Tersedia'), isNull(vehicle.deletedAt)));

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
