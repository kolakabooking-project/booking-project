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

  const [totalResult] = await db
    .select({ count: count() })
    .from(booking)
    .where(where);

  const [pendingResult] = await db
    .select({ count: count() })
    .from(booking)
    .where(
      where
        ? and(where, eq(booking.status, BOOKING_STATUS.PENDING))
        : eq(booking.status, BOOKING_STATUS.PENDING)
    );

  const [completedResult] = await db
    .select({ count: count() })
    .from(booking)
    .where(
      where
        ? and(where, eq(booking.status, BOOKING_STATUS.COMPLETED))
        : eq(booking.status, BOOKING_STATUS.COMPLETED)
    );

  const [rejectedResult] = await db
    .select({ count: count() })
    .from(booking)
    .where(
      where
        ? and(where, eq(booking.status, BOOKING_STATUS.REJECTED))
        : eq(booking.status, BOOKING_STATUS.REJECTED)
    );

  return {
    total: totalResult.count,
    pending: pendingResult.count,
    completed: completedResult.count,
    rejected: rejectedResult.count,
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
