import { db } from '../config/db.js';
import { booking, user, vehicle, driver } from '../db/schema.js';
import { eq, and, gte, lte, not, sql, count } from 'drizzle-orm';
import { BOOKING_STATUS } from '../utils/constants.js';

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  vehicleId?: string;
}

/**
 * Get aggregated booking statistics.
 * Uses a single query with conditional counting (PostgreSQL FILTER clause)
 * instead of 4 separate COUNT queries — reduces 4 DB roundtrips to 1.
 */
export async function getReportSummary(filters?: ReportFilters) {
  const conditions: any[] = [];

  if (filters?.startDate) {
    conditions.push(gte(booking.startTime, new Date(filters.startDate)));
  }
  if (filters?.endDate) {
    conditions.push(lte(booking.startTime, new Date(filters.endDate + 'T23:59:59')));
  }
  if (filters?.vehicleId) {
    conditions.push(eq(booking.vehicleId, filters.vehicleId));
  }

  // Exclude cancelled
  conditions.push(not(eq(booking.status, BOOKING_STATUS.CANCELLED)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Single query with conditional counting — replaces 4 separate COUNT queries
  const [result] = await db
    .select({
      total: count(),
      pending: sql<number>`count(*) filter (where ${booking.status} = 'Pending')`,
      completed: sql<number>`count(*) filter (where ${booking.status} = 'Selesai')`,
      rejected: sql<number>`count(*) filter (where ${booking.status} = 'Ditolak')`,
    })
    .from(booking)
    .where(where);

  return {
    total: result.total,
    pending: result.pending,
    completed: result.completed,
    rejected: result.rejected,
  };
}

/**
 * Get filtered booking data for export (returns JSON, frontend converts to xlsx/csv).
 */
export async function getExportData(filters?: ReportFilters) {
  const conditions: any[] = [];

  if (filters?.startDate) {
    conditions.push(gte(booking.startTime, new Date(filters.startDate)));
  }
  if (filters?.endDate) {
    conditions.push(lte(booking.startTime, new Date(filters.endDate + 'T23:59:59')));
  }
  if (filters?.vehicleId) {
    conditions.push(eq(booking.vehicleId, filters.vehicleId));
  }

  conditions.push(not(eq(booking.status, BOOKING_STATUS.CANCELLED)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

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
    .where(where)
    .orderBy(booking.startTime);

  return results.map((r) => ({
    id: r.booking.id,
    userName: r.userName,
    startTime: r.booking.startTime,
    endTime: r.booking.endTime,
    keperluan: r.booking.keperluan,
    vehicleName: r.vehiclePlat && r.vehicleMerek
      ? `${r.vehicleMerek} (${r.vehiclePlat})`
      : null,
    driverName: r.driverName,
    jumlahPenumpang: r.booking.jumlahPenumpang,
    status: r.booking.status,
    catatan: r.booking.catatan,
  }));
}
