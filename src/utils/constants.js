export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

export const BOOKING_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Disetujui',
  ONGOING: 'Berlangsung',
  COMPLETED: 'Selesai',
  COMPLETED_WITH_NOTES: 'Selesai dengan Catatan',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
};

export const VEHICLE_STATUS = {
  AVAILABLE: 'Tersedia',
  IN_USE: 'Sedang Dipakai',
  MAINTENANCE: 'Dalam Perawatan',
};

export const DRIVER_STATUS = {
  AVAILABLE: 'Tersedia',
  ON_DUTY: 'Bertugas',
  OFF: 'Libur',
};

export const ROOM_STATUS = {
  AVAILABLE: 'Tersedia',
  IN_USE: 'Sedang Dipakai',
  MAINTENANCE: 'Dalam Perawatan',
};

export const VEHICLE_TYPES = {
  CAR: 'Mobil',
  MOTORCYCLE: 'Motor',
};

export const FUEL_LEVELS = ['Penuh', '3/4', '1/2', '1/4', 'Kosong'];
export const CLEANLINESS = ['Bersih', 'Cukup', 'Kotor'];

export const STATUS_COLORS = {
  [BOOKING_STATUS.PENDING]: { bg: 'bg-djp-yellow/20', text: 'text-djp-yellow-dark', dot: 'bg-djp-yellow' },
  [BOOKING_STATUS.APPROVED]: { bg: 'bg-success-light dark:bg-success/15', text: 'text-success', dot: 'bg-success' },
  [BOOKING_STATUS.ONGOING]: { bg: 'bg-info-light dark:bg-info/15', text: 'text-info', dot: 'bg-info' },
  [BOOKING_STATUS.COMPLETED]: { bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-black dark:text-white', dot: 'bg-black dark:bg-white' },
  [BOOKING_STATUS.COMPLETED_WITH_NOTES]: { bg: 'bg-purple-100 dark:bg-purple-500/15', text: 'text-purple-700 dark:text-purple-500', dot: 'bg-purple-500' },
  [BOOKING_STATUS.REJECTED]: { bg: 'bg-danger-light dark:bg-danger/15', text: 'text-danger', dot: 'bg-danger' },
  [BOOKING_STATUS.CANCELLED]: { bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-black dark:text-white', dot: 'bg-black dark:bg-white' },
  [VEHICLE_STATUS.AVAILABLE]: { bg: 'bg-success-light dark:bg-success/15', text: 'text-success', dot: 'bg-success' },
  [VEHICLE_STATUS.IN_USE]: { bg: 'bg-info-light dark:bg-info/15', text: 'text-info', dot: 'bg-info' },
  [VEHICLE_STATUS.MAINTENANCE]: { bg: 'bg-warning-light dark:bg-warning/15', text: 'text-warning', dot: 'bg-warning' },
  [DRIVER_STATUS.AVAILABLE]: { bg: 'bg-success-light dark:bg-success/15', text: 'text-success', dot: 'bg-success' },
  [DRIVER_STATUS.ON_DUTY]: { bg: 'bg-info-light dark:bg-info/15', text: 'text-info', dot: 'bg-info' },
  [DRIVER_STATUS.OFF]: { bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-black dark:text-white', dot: 'bg-black dark:bg-white' },
  [ROOM_STATUS.AVAILABLE]: { bg: 'bg-success-light dark:bg-success/15', text: 'text-success', dot: 'bg-success' },
  [ROOM_STATUS.IN_USE]: { bg: 'bg-info-light dark:bg-info/15', text: 'text-info', dot: 'bg-info' },
  [ROOM_STATUS.MAINTENANCE]: { bg: 'bg-warning-light dark:bg-warning/15', text: 'text-warning', dot: 'bg-warning' },
};

export const NAV_USER = [
  { path: '/user/dashboard', label: 'Beranda', icon: 'LayoutDashboard' },
  { path: '/user/my-bookings', label: 'Riwayat Saya', icon: 'ClipboardList' },
];

export const NAV_ADMIN = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/admin/requests', label: 'Persetujuan', icon: 'ClipboardCheck' },
  { path: '/admin/fleet', label: 'Manajemen Armada', icon: 'Car' },
  { path: '/admin/drivers', label: 'Manajemen Pengemudi', icon: 'Users' },
  { path: '/admin/reports', label: 'Laporan & Ekspor', icon: 'FileSpreadsheet' },
  { path: '/admin/chat', label: 'Live Chat', icon: 'MessageCircle' },
];

export const NAV_SUPERADMIN = [
  { path: '/superadmin/dashboard', label: 'Dashboard', icon: 'Shield' },
  { path: '/superadmin/accounts', label: 'Manajemen Akun', icon: 'UsersCog' },
  { path: '/superadmin/service', label: 'Kontrol Layanan', icon: 'Power' },
  { path: '/superadmin/logs', label: 'Log Aktivitas', icon: 'ScrollText' },
];

export const NAV_ROOM_USER = [
  { path: '/user/room/dashboard', label: 'Beranda', icon: 'LayoutDashboard' },
  { path: '/user/room/my-bookings', label: 'Riwayat Saya', icon: 'ClipboardList' },
];

export const NAV_ROOM_ADMIN = [
  { path: '/admin/room/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/admin/room/requests', label: 'Booking Aktif', icon: 'CalendarCheck' },
  { path: '/admin/room/rooms', label: 'Manajemen Ruangan', icon: 'Building2' },
  { path: '/admin/room/reports', label: 'Laporan & Ekspor', icon: 'FileSpreadsheet' },
];
