import { db } from '../config/db.js';
import { user, account, session, systemSettings, booking, driver, vehicle } from '../db/schema.js';
import { eq, ne, desc, count, ilike, or, and } from 'drizzle-orm';
import { auth } from '../auth/auth.js';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../utils/errors.js';
import { logActivity } from './activity.service.js';
import { getServiceStatusCached, invalidateServiceStatusCache } from '../lib/serviceStatusCache.js';
import { invalidateUserSessions } from '../middleware/authGuard.js';

// ─── Constants ───

export const DEFAULT_PASSWORD = 'Kolaka2026!';
const SUPERADMIN_NIP = '000';

// ─── User Management ───

/**
 * List all users (except the requesting superadmin's own account for safety).
 */
export async function listAllUsers() {
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      nip: user.nip,
      email: user.email,
      role: user.role,
      jabatan: user.jabatan,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  return users;
}

/**
 * List recent users (limited) — for dashboard preview widgets.
 * Much lighter than listAllUsers() which returns every user.
 */
export async function listRecentUsers(limit: number = 6) {
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      nip: user.nip,
      role: user.role,
      jabatan: user.jabatan,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(limit);

  return users;
}

/**
 * List users with server-side search, role filter, and pagination.
 * Replaces client-side filtering of the full user list.
 */
export async function listUsers(filters?: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const offset = (page - 1) * limit;
  const conditions: any[] = [];

  if (filters?.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(user.name, term),
        ilike(user.nip, term),
        ilike(user.jabatan, term),
      )
    );
  }

  if (filters?.role) {
    conditions.push(eq(user.role, filters.role as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [users, countResult] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        nip: user.nip,
        email: user.email,
        role: user.role,
        jabatan: user.jabatan,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(user)
      .where(whereClause),
  ]);

  const total = countResult[0].value;

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get summary statistics for dashboard.
 */
export async function getUserStats() {
  const result = await db
    .select({
      role: user.role,
      count: count(),
    })
    .from(user)
    .groupBy(user.role);

  let totalAdmins = 0;
  let totalSuperadmins = 0;
  let totalRegularUsers = 0;

  for (const row of result) {
    if (row.role === 'admin') totalAdmins += row.count;
    else if (row.role === 'superadmin') totalSuperadmins += row.count;
    else if (row.role === 'user') totalRegularUsers += row.count;
  }

  return {
    totalUsers: totalAdmins + totalSuperadmins + totalRegularUsers,
    totalAdmins,
    totalSuperadmins,
    totalRegularUsers,
  };
}

/**
 * Create a new user account with default password.
 */
export async function createUser(data: {
  nip: string;
  name: string;
  jabatan?: string;
  role: 'user' | 'admin';
}, actorId: string, actorName: string, ipAddress?: string) {
  // Prevent creating superadmin via this endpoint
  if ((data as any).role === 'superadmin') {
    throw new ForbiddenError('Tidak dapat membuat akun superadmin.');
  }

  // Validate NIP uniqueness
  const existing = await db.select({ id: user.id }).from(user).where(eq(user.nip, data.nip));
  if (existing.length > 0) {
    throw new ConflictError(`NIP ${data.nip} sudah terdaftar.`);
  }

  const email = `${data.nip}@kpp-kolaka.internal`;

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: data.name,
        email,
        password: DEFAULT_PASSWORD,
        username: data.nip,
        nip: data.nip,
        role: data.role,
        jabatan: data.jabatan || null,
      },
    });

    if (!result?.user) {
      throw new Error('Gagal membuat akun.');
    }

    await logActivity({
      userId: actorId,
      userName: actorName,
      action: 'ACCOUNT_CREATED',
      targetId: result.user.id,
      targetName: data.name,
      detail: `Akun ${data.name} (NIP: ${data.nip}) dibuat dengan role ${data.role}`,
      ipAddress,
    });

    return result.user;
  } catch (err: any) {
    if (err instanceof ConflictError || err instanceof ForbiddenError) throw err;
    if (err.message?.includes('already exists') || err.message?.includes('unique') || err.message?.includes('duplicate')) {
      throw new ConflictError(`Akun dengan NIP ${data.nip} atau email ${email} sudah ada.`);
    }
    throw new ValidationError(err.message || 'Gagal membuat akun.');
  }
}

/**
 * Delete a user account.
 * Cannot delete the superadmin account.
 */
export async function deleteUser(
  targetUserId: string,
  actorId: string,
  actorName: string,
  ipAddress?: string
) {
  // Get target user info
  const [targetUser] = await db
    .select({ id: user.id, name: user.name, nip: user.nip, role: user.role })
    .from(user)
    .where(eq(user.id, targetUserId));

  if (!targetUser) throw new NotFoundError('Akun');

  // Prevent deleting superadmin
  if (targetUser.role === 'superadmin') {
    throw new ForbiddenError('Akun superadmin tidak dapat dihapus.');
  }

  // Prevent self-deletion
  if (targetUserId === actorId) {
    throw new ForbiddenError('Tidak dapat menghapus akun sendiri.');
  }

  // Delete sessions first, then account, then user (cascade handles most)
  await db.delete(session).where(eq(session.userId, targetUserId));
  await db.delete(account).where(eq(account.userId, targetUserId));
  await db.delete(user).where(eq(user.id, targetUserId));

  // Invalidate session cache so stale sessions aren't served
  invalidateUserSessions(targetUserId);

  await logActivity({
    userId: actorId,
    userName: actorName,
    action: 'ACCOUNT_DELETED',
    targetId: targetUserId,
    targetName: targetUser.name,
    detail: `Akun ${targetUser.name} (NIP: ${targetUser.nip}) dihapus`,
    ipAddress,
  });

  return { success: true };
}

/**
 * Change a user's role.
 * Cannot change superadmin's role, and cannot set role to superadmin.
 */
export async function changeUserRole(
  targetUserId: string,
  newRole: 'user' | 'admin',
  actorId: string,
  actorName: string,
  ipAddress?: string
) {
  // Prevent setting superadmin role
  if ((newRole as string) === 'superadmin') {
    throw new ForbiddenError('Tidak dapat mengatur role superadmin.');
  }

  const [targetUser] = await db
    .select({ id: user.id, name: user.name, nip: user.nip, role: user.role })
    .from(user)
    .where(eq(user.id, targetUserId));

  if (!targetUser) throw new NotFoundError('Akun');

  // Prevent changing superadmin's role
  if (targetUser.role === 'superadmin') {
    throw new ForbiddenError('Tidak dapat mengubah role akun superadmin.');
  }

  if (targetUser.role === newRole) {
    throw new ValidationError(`Akun sudah memiliki role ${newRole}.`);
  }

  await db
    .update(user)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(user.id, targetUserId));

  // Invalidate session cache so the user gets the new role on next request
  invalidateUserSessions(targetUserId);

  await logActivity({
    userId: actorId,
    userName: actorName,
    action: 'ACCOUNT_ROLE_CHANGED',
    targetId: targetUserId,
    targetName: targetUser.name,
    detail: `Role ${targetUser.name} diubah dari ${targetUser.role} ke ${newRole}`,
    ipAddress,
  });

  return { success: true, newRole };
}

/**
 * Reset a user's password to the default password.
 * Cannot reset superadmin's password via this endpoint.
 */
export async function resetUserPassword(
  targetUserId: string,
  actorId: string,
  actorName: string,
  ipAddress?: string
) {
  const [targetUser] = await db
    .select({ id: user.id, name: user.name, nip: user.nip, role: user.role })
    .from(user)
    .where(eq(user.id, targetUserId));

  if (!targetUser) throw new NotFoundError('Akun');

  // Prevent resetting superadmin password via this endpoint
  if (targetUser.role === 'superadmin') {
    throw new ForbiddenError('Password superadmin tidak dapat direset melalui endpoint ini.');
  }

  // Use Better Auth's internal API to set password
  // We need to hash the password and update directly
  const bcrypt = await import('better-auth/crypto');
  const hashedPassword = await bcrypt.hashPassword(DEFAULT_PASSWORD);

  await db
    .update(account)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(account.userId, targetUserId));

  // Invalidate all sessions for this user (force re-login)
  await db.delete(session).where(eq(session.userId, targetUserId));

  // Invalidate session cache so stale sessions aren't served
  invalidateUserSessions(targetUserId);

  await logActivity({
    userId: actorId,
    userName: actorName,
    action: 'ACCOUNT_PASSWORD_RESET',
    targetId: targetUserId,
    targetName: targetUser.name,
    detail: `Password ${targetUser.name} (NIP: ${targetUser.nip}) direset ke default`,
    ipAddress,
  });

  return { success: true };
}

// ─── Service Control ───

/**
 * Get current service status.
 * Uses shared cache to avoid redundant DB queries.
 */
export async function getServiceStatus() {
  return getServiceStatusCached();
}

/**
 * Toggle service on/off.
 */
export async function toggleService(
  active: boolean,
  actorId: string,
  actorName: string,
  ipAddress?: string
) {
  // Upsert the setting
  const existing = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, 'service_active'));

  if (existing.length > 0) {
    await db
      .update(systemSettings)
      .set({
        value: String(active),
        updatedAt: new Date(),
        updatedBy: actorId,
      })
      .where(eq(systemSettings.key, 'service_active'));
  } else {
    await db.insert(systemSettings).values({
      key: 'service_active',
      value: String(active),
      updatedAt: new Date(),
      updatedBy: actorId,
    });
  }

  // Invalidate the cached service status (shared cache)
  invalidateServiceStatusCache();

  await logActivity({
    userId: actorId,
    userName: actorName,
    action: 'SERVICE_TOGGLED',
    detail: active
      ? 'Layanan diaktifkan (Service ON)'
      : 'Layanan dinonaktifkan (Service OFF — Maintenance Mode)',
    ipAddress,
  });

  return { active };
}

/**
 * Securely reset bookings, vehicles, or drivers with password verification.
 */
export async function resetData(
  type: 'booking' | 'driver' | 'vehicle',
  superadminPasswordConfirm: string,
  superadminId: string,
  actorName: string,
  ipAddress?: string
) {
  // 1. Retrieve the superadmin's account credentials
  const [saAccount] = await db
    .select({ password: account.password })
    .from(account)
    .where(eq(account.userId, superadminId));

  if (!saAccount || !saAccount.password) {
    throw new ForbiddenError('Akun superadmin tidak terkonfigurasi dengan benar.');
  }

  // 2. Cryptographically verify the superadmin password
  const bcrypt = await import('better-auth/crypto');
  const isValid = await bcrypt.verifyPassword({
    password: superadminPasswordConfirm,
    hash: saAccount.password,
  });

  if (!isValid) {
    throw new ValidationError('Password konfirmasi superadmin salah.');
  }

  // 3. Perform data reset based on type
  if (type === 'booking') {
    // Deleting all bookings will automatically cascade delete all booking reviews in db schema
    await db.delete(booking);
    
    await logActivity({
      userId: superadminId,
      userName: actorName,
      action: 'SERVICE_TOGGLED',
      detail: 'Reset data peminjaman (bookings) berhasil dilakukan oleh Superadmin.',
      ipAddress,
    });
  } else if (type === 'driver') {
    await db.delete(driver);
    
    await logActivity({
      userId: superadminId,
      userName: actorName,
      action: 'SERVICE_TOGGLED',
      detail: 'Reset data pengemudi (drivers) berhasil dilakukan oleh Superadmin.',
      ipAddress,
    });
  } else if (type === 'vehicle') {
    await db.delete(vehicle);
    
    await logActivity({
      userId: superadminId,
      userName: actorName,
      action: 'SERVICE_TOGGLED',
      detail: 'Reset data kendaraan (vehicles) berhasil dilakukan oleh Superadmin.',
      ipAddress,
    });
  }

  return { success: true };
}
