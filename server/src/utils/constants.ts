// ─── Booking Status ───
export const BOOKING_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Disetujui',
  ONGOING: 'Berlangsung',
  COMPLETED: 'Selesai',
  COMPLETED_WITH_NOTES: 'Selesai dengan Catatan',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
} as const;

// ─── Vehicle Status ───
export const VEHICLE_STATUS = {
  AVAILABLE: 'Tersedia',
  IN_USE: 'Sedang Dipakai',
  MAINTENANCE: 'Dalam Perawatan',
} as const;

// ─── Driver Status ───
export const DRIVER_STATUS = {
  AVAILABLE: 'Tersedia',
  ON_DUTY: 'Bertugas',
  OFF: 'Libur',
} as const;

// ─── Vehicle Types ───
export const VEHICLE_TYPES = {
  CAR: 'Mobil',
  MOTORCYCLE: 'Motor',
} as const;

// ─── Active booking statuses (non-terminal) ───
export const ACTIVE_BOOKING_STATUSES = [
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.APPROVED,
  BOOKING_STATUS.ONGOING,
] as const;

// ─── Terminal booking statuses ───
export const TERMINAL_BOOKING_STATUSES = [
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.COMPLETED_WITH_NOTES,
  BOOKING_STATUS.REJECTED,
  BOOKING_STATUS.CANCELLED,
] as const;
