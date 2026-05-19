/**
 * Activity Log Action Configuration
 * 
 * Enterprise-grade icon system using Lucide React icons.
 * Each action has a dedicated icon component, label, and theme-aware color classes.
 * Colors use CSS variables for seamless light/dark mode support.
 */
import {
  LogIn, LogOut, KeyRound,
  FilePlus2, FileX2, FileCheck2, FileWarning, FileClock, Navigation, FlagTriangleRight, CircleCheckBig,
  CarFront, Wrench, Trash2,
  UserPlus, Pencil,
  UserRoundPlus, UserRoundX, RefreshCcw, ShieldCheck,
  Power, UserCog,
  CircleDot,
} from 'lucide-react';

/**
 * Action metadata map — each entry has:
 * - icon: Lucide icon component
 * - label: Human-readable label
 * - iconClass: Tailwind classes for the icon color
 * - bgClass: Tailwind classes for the icon container background
 * - badgeClass: Tailwind classes for the label badge
 */
export const ACTION_CONFIG = {
  // ─── Auth ─────────────────────────────────────
  LOGIN: {
    icon: LogIn,
    label: 'Login',
    iconClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/8 dark:bg-blue-500/15 border border-blue-500/15 dark:border-blue-400/20',
    badgeClass: 'text-blue-700 dark:text-blue-300 bg-blue-500/8 dark:bg-blue-500/15',
  },
  LOGOUT: {
    icon: LogOut,
    label: 'Logout',
    iconClass: 'text-slate-500 dark:text-slate-400',
    bgClass: 'bg-slate-500/8 dark:bg-slate-500/15 border border-slate-500/15 dark:border-slate-400/20',
    badgeClass: 'text-slate-600 dark:text-slate-300 bg-slate-500/8 dark:bg-slate-500/15',
  },
  PASSWORD_CHANGED: {
    icon: KeyRound,
    label: 'Password Diubah',
    iconClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500/8 dark:bg-amber-500/15 border border-amber-500/15 dark:border-amber-400/20',
    badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-500/8 dark:bg-amber-500/15',
  },

  // ─── Booking — User ───────────────────────────
  BOOKING_CREATED: {
    icon: FilePlus2,
    label: 'Booking Dibuat',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/8 dark:bg-emerald-500/15 border border-emerald-500/15 dark:border-emerald-400/20',
    badgeClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/8 dark:bg-emerald-500/15',
  },
  BOOKING_CANCELLED: {
    icon: FileX2,
    label: 'Booking Dibatalkan',
    iconClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-500/8 dark:bg-rose-500/15 border border-rose-500/15 dark:border-rose-400/20',
    badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-500/8 dark:bg-rose-500/15',
  },
  BOOKING_REVIEW: {
    icon: FileCheck2,
    label: 'Review Perjalanan',
    iconClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-500/8 dark:bg-violet-500/15 border border-violet-500/15 dark:border-violet-400/20',
    badgeClass: 'text-violet-700 dark:text-violet-300 bg-violet-500/8 dark:bg-violet-500/15',
  },

  // ─── Booking — Admin ──────────────────────────
  BOOKING_APPROVED: {
    icon: CircleCheckBig,
    label: 'Booking Disetujui',
    iconClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/8 dark:bg-blue-500/15 border border-blue-500/15 dark:border-blue-400/20',
    badgeClass: 'text-blue-700 dark:text-blue-300 bg-blue-500/8 dark:bg-blue-500/15',
  },
  BOOKING_REJECTED: {
    icon: FileWarning,
    label: 'Booking Ditolak',
    iconClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-500/8 dark:bg-red-500/15 border border-red-500/15 dark:border-red-400/20',
    badgeClass: 'text-red-700 dark:text-red-300 bg-red-500/8 dark:bg-red-500/15',
  },
  BOOKING_MANDATORY: {
    icon: FileClock,
    label: 'Booking Mandatory',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-500/8 dark:bg-indigo-500/15 border border-indigo-500/15 dark:border-indigo-400/20',
    badgeClass: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/8 dark:bg-indigo-500/15',
  },
  BOOKING_STARTED: {
    icon: Navigation,
    label: 'Trip Dimulai',
    iconClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-500/8 dark:bg-sky-500/15 border border-sky-500/15 dark:border-sky-400/20',
    badgeClass: 'text-sky-700 dark:text-sky-300 bg-sky-500/8 dark:bg-sky-500/15',
  },
  BOOKING_COMPLETED: {
    icon: FlagTriangleRight,
    label: 'Trip Selesai',
    iconClass: 'text-slate-600 dark:text-slate-400',
    bgClass: 'bg-slate-500/8 dark:bg-slate-500/15 border border-slate-500/15 dark:border-slate-400/20',
    badgeClass: 'text-slate-700 dark:text-slate-300 bg-slate-500/8 dark:bg-slate-500/15',
  },

  // ─── Fleet — Admin ────────────────────────────
  VEHICLE_CREATED: {
    icon: CarFront,
    label: 'Kendaraan Ditambah',
    iconClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-500/8 dark:bg-teal-500/15 border border-teal-500/15 dark:border-teal-400/20',
    badgeClass: 'text-teal-700 dark:text-teal-300 bg-teal-500/8 dark:bg-teal-500/15',
  },
  VEHICLE_UPDATED: {
    icon: Wrench,
    label: 'Kendaraan Diperbarui',
    iconClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-500/8 dark:bg-teal-500/15 border border-teal-500/15 dark:border-teal-400/20',
    badgeClass: 'text-teal-700 dark:text-teal-300 bg-teal-500/8 dark:bg-teal-500/15',
  },
  VEHICLE_DELETED: {
    icon: Trash2,
    label: 'Kendaraan Dihapus',
    iconClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-500/8 dark:bg-rose-500/15 border border-rose-500/15 dark:border-rose-400/20',
    badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-500/8 dark:bg-rose-500/15',
  },
  DRIVER_CREATED: {
    icon: UserPlus,
    label: 'Pengemudi Ditambah',
    iconClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-500/8 dark:bg-cyan-500/15 border border-cyan-500/15 dark:border-cyan-400/20',
    badgeClass: 'text-cyan-700 dark:text-cyan-300 bg-cyan-500/8 dark:bg-cyan-500/15',
  },
  DRIVER_UPDATED: {
    icon: Pencil,
    label: 'Pengemudi Diperbarui',
    iconClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-500/8 dark:bg-cyan-500/15 border border-cyan-500/15 dark:border-cyan-400/20',
    badgeClass: 'text-cyan-700 dark:text-cyan-300 bg-cyan-500/8 dark:bg-cyan-500/15',
  },
  DRIVER_DELETED: {
    icon: Trash2,
    label: 'Pengemudi Dihapus',
    iconClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-500/8 dark:bg-rose-500/15 border border-rose-500/15 dark:border-rose-400/20',
    badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-500/8 dark:bg-rose-500/15',
  },

  // ─── Superadmin — Account ─────────────────────
  ACCOUNT_CREATED: {
    icon: UserRoundPlus,
    label: 'Akun Dibuat',
    iconClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-500/8 dark:bg-purple-500/15 border border-purple-500/15 dark:border-purple-400/20',
    badgeClass: 'text-purple-700 dark:text-purple-300 bg-purple-500/8 dark:bg-purple-500/15',
  },
  ACCOUNT_DELETED: {
    icon: UserRoundX,
    label: 'Akun Dihapus',
    iconClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-500/8 dark:bg-rose-500/15 border border-rose-500/15 dark:border-rose-400/20',
    badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-500/8 dark:bg-rose-500/15',
  },
  ACCOUNT_ROLE_CHANGED: {
    icon: ShieldCheck,
    label: 'Role Diubah',
    iconClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-500/8 dark:bg-purple-500/15 border border-purple-500/15 dark:border-purple-400/20',
    badgeClass: 'text-purple-700 dark:text-purple-300 bg-purple-500/8 dark:bg-purple-500/15',
  },
  ACCOUNT_PASSWORD_RESET: {
    icon: RefreshCcw,
    label: 'Password Direset',
    iconClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500/8 dark:bg-amber-500/15 border border-amber-500/15 dark:border-amber-400/20',
    badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-500/8 dark:bg-amber-500/15',
  },

  // ─── Superadmin — System ──────────────────────
  SERVICE_TOGGLED: {
    icon: Power,
    label: 'Layanan Toggle',
    iconClass: 'text-slate-600 dark:text-slate-400',
    bgClass: 'bg-slate-500/8 dark:bg-slate-500/15 border border-slate-500/15 dark:border-slate-400/20',
    badgeClass: 'text-slate-700 dark:text-slate-300 bg-slate-500/8 dark:bg-slate-500/15',
  },
  PROFILE_UPDATED: {
    icon: UserCog,
    label: 'Profil Diperbarui',
    iconClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-500/8 dark:bg-teal-500/15 border border-teal-500/15 dark:border-teal-400/20',
    badgeClass: 'text-teal-700 dark:text-teal-300 bg-teal-500/8 dark:bg-teal-500/15',
  },
};

/** Default config for unknown action types */
export const DEFAULT_ACTION = {
  icon: CircleDot,
  label: 'Aktivitas',
  iconClass: 'text-slate-500 dark:text-slate-400',
  bgClass: 'bg-slate-500/8 dark:bg-slate-500/15 border border-slate-500/15 dark:border-slate-400/20',
  badgeClass: 'text-slate-600 dark:text-slate-300 bg-slate-500/8 dark:bg-slate-500/15',
};

/** Get action config by key, with fallback */
export function getActionMeta(action) {
  return ACTION_CONFIG[action] || { ...DEFAULT_ACTION, label: action };
}

/** Build select options for filter dropdown (text-only, no emoji) */
export const ACTION_FILTER_OPTIONS = Object.entries(ACTION_CONFIG).map(([key, val]) => ({
  value: key,
  label: val.label,
}));
