import { db } from '../config/db.js';
import { driver, booking } from '../db/schema.js';
import { eq, and, not, lte, gte, inArray, isNull } from 'drizzle-orm';
import { TERMINAL_BOOKING_STATUSES } from '../utils/constants.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

type DriverInsert = typeof driver.$inferInsert;
type DriverUpdate = Partial<Omit<DriverInsert, 'id' | 'createdAt'>>;

/**
 * Get all drivers.
 */
export async function getAllDrivers() {
  return db.select().from(driver).where(isNull(driver.deletedAt));
}

/**
 * Get available drivers for a specific time range.
 */
export async function getAvailableDrivers(startTime: Date, endTime: Date) {
  const overlapping = await db
    .select({ driverId: booking.driverId })
    .from(booking)
    .where(
      and(
        not(inArray(booking.status, [...TERMINAL_BOOKING_STATUSES])),
        lte(booking.startTime, endTime),
        gte(booking.endTime, startTime)
      )
    );

  const busyIds = new Set(overlapping.map((b) => b.driverId).filter(Boolean));

  const allDrivers = await db
    .select()
    .from(driver)
    .where(and(eq(driver.status, 'Tersedia'), isNull(driver.deletedAt)));

  return allDrivers.filter((d) => !busyIds.has(d.id));
}

/**
 * Get a single driver by ID.
 */
export async function getDriverById(id: string) {
  const [found] = await db.select().from(driver).where(and(eq(driver.id, id), isNull(driver.deletedAt)));
  if (!found) throw new NotFoundError('Pengemudi');
  return found;
}

/**
 * Create a new driver.
 */
export async function createDriver(data: DriverInsert) {
  if (!data.name) {
    throw new ValidationError('Nama pengemudi wajib diisi.');
  }

  const [created] = await db.insert(driver).values(data).returning();
  return created;
}

/**
 * Update an existing driver.
 */
export async function updateDriver(id: string, data: any) {
  // Prevent Drizzle date serialization errors by stripping out fields that shouldn't be updated
  const { id: _, createdAt, updatedAt, ...updateData } = data;
  
  // Handle empty strings for dates
  if (updateData.simExpiry === '') updateData.simExpiry = null;
  if (updateData.foto === '') updateData.foto = null;

  const [updated] = await db
    .update(driver)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(driver.id, id))
    .returning();

  if (!updated) throw new NotFoundError('Pengemudi');
  return updated;
}

/**
 * Delete a driver.
 */
export async function deleteDriver(id: string) {
  const [deleted] = await db
    .update(driver)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(driver.id, id), isNull(driver.deletedAt)))
    .returning();
  if (!deleted) throw new NotFoundError('Pengemudi');
  return deleted;
}
