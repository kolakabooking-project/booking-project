import { db } from '../config/db.js';
import { user, account, session, systemSettings } from '../db/schema.js';
import { eq, ne, desc, count } from 'drizzle-orm';
import { auth } from '../auth/auth.js';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../utils/errors.js';
import { logActivity } from './activity.service.js';
import { invalidateMaintenanceCache } from '../middleware/maintenanceGuard.js';

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
 * Get summary statistics for dashboard.
 */
export async function getUserStats() {
  const allUsers = await db.select({ id: user.id, role: user.role }).from(user);
  
  return {
    totalUsers: allUsers.length,
    totalAdmins: allUsers.filter(u => u.role === 'admin').length,
    totalSuperadmins: allUsers.filter(u => u.role === 'superadmin').length,
    totalRegularUsers: allUsers.filter(u => u.role === 'user').length,
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
 */
export async function getServiceStatus() {
  const [setting] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, 'service_active'));

  return {
    active: setting?.value !== 'false',
    updatedAt: setting?.updatedAt || null,
  };
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

  // Invalidate the cached maintenance status
  invalidateMaintenanceCache();

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
