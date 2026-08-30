/**
 * Format tanggal ke format Indonesia
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format tanggal singkat
 */
export function formatDateShort(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format waktu
 */
export function formatTime(date) {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format datetime lengkap
 */
export function formatDateTime(date) {
  return `${formatDateShort(date)} ${formatTime(date)}`;
}

/**
 * Cek apakah tanggal sudah lewat
 */
export function isPastDate(date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return target < now;
}

/**
 * Cek apakah tanggal adalah hari ini
 */
export function isToday(date) {
  const now = new Date();
  const target = new Date(date);
  return (
    now.getDate() === target.getDate() &&
    now.getMonth() === target.getMonth() &&
    now.getFullYear() === target.getFullYear()
  );
}

/**
 * Generate array hari dalam sebulan
 */
export function getDaysInMonth(year, month) {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

/**
 * Get hari pertama bulan (0=Minggu, 1=Senin, ...)
 */
export function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  // Convert to Mon=0 format
  return day === 0 ? 6 : day - 1;
}

/**
 * Nama bulan Indonesia
 */
export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

/**
 * Generate ID unik sederhana
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Get minimum datetime untuk input (sekarang)
 */
export function getMinDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

/**
 * Mendapatkan inisial nama maksimal 2 huruf (e.g. Ahmad Fikri -> AF)
 */
export function getInitials(name) {
  if (!name) return 'U';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

const MONTHS_ID_MAP = {
  januari: 0, februari: 1, maret: 2, april: 3,
  mei: 4, juni: 5, juli: 6, agustus: 7,
  september: 8, oktober: 9, november: 10, desember: 11,
};

/**
 * Parse Indonesian date string or ISO/standard date string into a Date object.
 */
export function parseIndonesianDate(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  // Indonesian format: "05 Januari 2026"
  const parts = str.toLowerCase().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const month = MONTHS_ID_MAP[parts[1]];
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Standard formats: "8/24/2026", "2026-08-24"
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}
