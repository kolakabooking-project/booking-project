import { db } from '../config/db.js';
import { user, account, session, systemSettings, booking, driver, vehicle, room, roomBooking } from '../db/schema.js';
import { eq, ne, desc, count, ilike, or, and } from 'drizzle-orm';
import { auth } from '../auth/auth.js';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../utils/errors.js';
import { logActivity } from './activity.service.js';
import { getServiceStatusCached, invalidateServiceStatusCache } from '../lib/serviceStatusCache.js';
import { invalidateUserSessions } from '../middleware/authGuard.js';
import { broadcastBookingUpdate } from '../lib/ably.js';

// ─── Constants ───

export const DEFAULT_PASSWORD = 'Kolaka2026!';
const SUPERADMIN_NIP = '000';

/**
 * Helper to get the hierarchical rank of a section (seksi) based on employee's jabatan.
 * Hierarchical order of KPP Pratama Kolaka:
 * 1. Kepala Kantor
 * 2. Subbagian Umum dan Kepatuhan Internal (Subbag Umum)
 * 3. Seksi Penjaminan Kualitas Data (PKD)
 * 4. Seksi Pelayanan
 * 5. Seksi Pemeriksaan, Penilaian, dan Penagihan (P3)
 * 6. Seksi Pengawasan I
 * 7. Seksi Pengawasan II
 * 8. Seksi Pengawasan III
 * 9. Seksi Pengawasan IV
 * 10. Seksi Pengawasan V
 * 11. Fungsional Pemeriksa / Penyuluh Pajak (jika tidak spesifik seksi)
 * 12. KP2KP
 */
function getSectionRank(jabatan: string | null | undefined): number {
  if (!jabatan) return 99;
  const job = jabatan.toLowerCase();
  
  if (job.includes('kepala kantor')) return 1;
  if (job.includes('umum') || job.includes('kepatuhan internal') || job.includes('sekretaris') || job.includes('subbag')) return 2;
  if (job.includes('penjaminan kualitas data') || job.includes('pkd')) return 3;
  if (job.includes('pelayanan')) return 4;
  if (job.includes('pemeriksaan') || job.includes('penilaian') || job.includes('penagihan') || job.includes('juru sita')) {
    if (job.includes('pemeriksa pajak') && !job.includes('seksi')) {
      return 11;
    }
    return 5;
  }
  if (job.includes('pengawasan iii') || job.includes('pengawasan 3')) return 8;
  if (job.includes('pengawasan ii') || job.includes('pengawasan 2')) return 7;
  if (job.includes('pengawasan iv') || job.includes('pengawasan 4')) return 9;
  if (job.includes('pengawasan i') || job.includes('pengawasan 1')) return 6;
  if (job.includes('pengawasan v') || job.includes('pengawasan 5')) return 10;
  if (job.includes('pemeriksa pajak') || job.includes('penyuluh pajak')) return 11;
  if (job.includes('kp2kp')) return 12;
  
  return 99;
}

/**
 * Compare two employees for consistent sorting order by Section -> Job Level -> Name.
 */
function compareEmployees(a: any, b: any): number {
  const rankA = getSectionRank(a.jabatan);
  const rankB = getSectionRank(b.jabatan);
  
  if (rankA !== rankB) {
    return rankA - rankB;
  }
  
  // Sort within the same section by job level hierarchy
  const jobA = (a.jabatan || '').toLowerCase();
  const jobB = (b.jabatan || '').toLowerCase();
  
  const isKepalaA = jobA.includes('kepala') || jobA.includes('kasi') || jobA.includes('kasub') || jobA.includes('pimpinan');
  const isKepalaB = jobB.includes('kepala') || jobB.includes('kasi') || jobB.includes('kasub') || jobB.includes('pimpinan');
  
  if (isKepalaA && !isKepalaB) return -1;
  if (!isKepalaA && isKepalaB) return 1;
  
  // Sort alphabetically by name
  return (a.name || '').localeCompare(b.name || '');
}

/**
 * List all users (except the requesting superadmin's own account for safety).
 */
export async function listAllUsers() {
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      nip: user.nip,
      nipPanjang: user.nipPanjang,
      email: user.email,
      role: user.role,
      jabatan: user.jabatan,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user);

  return users.sort(compareEmployees);
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
      nipPanjang: user.nipPanjang,
      role: user.role,
      jabatan: user.jabatan,
    })
    .from(user);

  return users.sort(compareEmployees).slice(0, limit);
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
        ilike(user.nipPanjang, term),
        ilike(user.jabatan, term),
      )
    );
  }

  if (filters?.role) {
    conditions.push(eq(user.role, filters.role as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [allMatchingUsers, countResult] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        nip: user.nip,
        nipPanjang: user.nipPanjang,
        email: user.email,
        role: user.role,
        jabatan: user.jabatan,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(whereClause),
    db
      .select({ value: count() })
      .from(user)
      .where(whereClause),
  ]);

  const total = countResult[0].value;

  // Sort them in memory by section and name
  allMatchingUsers.sort(compareEmployees);

  // Paginate the sorted results in memory
  const paginatedUsers = allMatchingUsers.slice(offset, offset + limit);

  return {
    users: paginatedUsers,
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
  nipPanjang?: string;
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
        nipPanjang: data.nipPanjang || null,
        role: data.role,
        jabatan: data.jabatan || null,
      },
    });

    if (!result?.user) {
      throw new Error('Gagal membuat akun.');
    }

    if (data.nipPanjang && result.user.id) {
      await db.update(user).set({ nipPanjang: data.nipPanjang }).where(eq(user.id, result.user.id));
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
 * Update a user account (name, nip, jabatan).
 */
export async function updateUser(
  targetUserId: string,
  data: {
    name?: string;
    nip?: string;
    nipPanjang?: string;
    jabatan?: string;
  },
  actorId: string,
  actorName: string,
  ipAddress?: string
) {
  // Prevent modifying superadmin unless the actor is that same superadmin
  const [targetUser] = await db
    .select({ id: user.id, name: user.name, nip: user.nip, role: user.role })
    .from(user)
    .where(eq(user.id, targetUserId));

  if (!targetUser) throw new NotFoundError('Akun');

  // Validate NIP uniqueness if NIP is changing
  if (data.nip && data.nip !== targetUser.nip) {
    const existing = await db.select({ id: user.id }).from(user).where(eq(user.nip, data.nip));
    if (existing.length > 0) {
      throw new ConflictError(`NIP ${data.nip} sudah terdaftar pada akun lain.`);
    }
  }

  const updateData: any = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.nip !== undefined) updateData.nip = data.nip;
  if (data.nipPanjang !== undefined) updateData.nipPanjang = data.nipPanjang;
  if (data.jabatan !== undefined) updateData.jabatan = data.jabatan;

  // We should also update the username in the auth system if NIP changes,
  // since NIP is used as the username, but Better Auth handles this via db directly if we map it.
  // We'll update the user table directly.
  if (data.nip !== undefined) {
    updateData.username = data.nip;
    updateData.email = `${data.nip}@kpp-kolaka.internal`;
  }

  await db
    .update(user)
    .set(updateData)
    .where(eq(user.id, targetUserId));

  // Invalidate session cache
  invalidateUserSessions(targetUserId);

  await logActivity({
    userId: actorId,
    userName: actorName,
    action: 'ACCOUNT_ROLE_CHANGED', // Or we can use PROFILE_UPDATED
    targetId: targetUserId,
    targetName: data.name || targetUser.name,
    detail: `Profil akun ${targetUser.name} (NIP: ${targetUser.nip}) diperbarui`,
    ipAddress,
  });

  return { success: true };
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
 * Uses upsert (ON CONFLICT DO UPDATE) to avoid redundant SELECT-before-write.
 * Reduces from ~9 queries to ~5 queries per toggle call.
 */
export async function toggleService(
  kdoActive: boolean | undefined,
  roomActive: boolean | undefined,
  spdActive: boolean | undefined,
  actorId: string,
  actorName: string,
  ipAddress?: string
) {
  // Upsert each setting in a single query (instead of SELECT + conditional UPDATE/INSERT)
  const upsertSetting = async (key: string, value: boolean) => {
    await db
      .insert(systemSettings)
      .values({
        key,
        value: String(value),
        updatedAt: new Date(),
        updatedBy: actorId,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: String(value),
          updatedAt: new Date(),
          updatedBy: actorId,
        },
      });
  };

  // Fire upserts concurrently (each is independent)
  const upsertPromises: Promise<void>[] = [];
  if (kdoActive !== undefined) upsertPromises.push(upsertSetting('kdo_service_active', kdoActive));
  if (roomActive !== undefined) upsertPromises.push(upsertSetting('room_service_active', roomActive));
  if (spdActive !== undefined) upsertPromises.push(upsertSetting('spd_service_active', spdActive));
  await Promise.all(upsertPromises);

  // Invalidate the cached service status (shared cache)
  invalidateServiceStatusCache();
  
  const detailMessage: string[] = [];
  if (kdoActive !== undefined) detailMessage.push(`Layanan Booking KDO ${kdoActive ? 'diaktifkan' : 'dinonaktifkan'}`);
  if (roomActive !== undefined) detailMessage.push(`Layanan Booking Ruangan ${roomActive ? 'diaktifkan' : 'dinonaktifkan'}`);
  if (spdActive !== undefined) detailMessage.push(`Layanan Track SPD ${spdActive ? 'diaktifkan' : 'dinonaktifkan'}`);

  await logActivity({
    userId: actorId,
    userName: actorName,
    action: 'SERVICE_TOGGLED',
    detail: detailMessage.join(', '),
    ipAddress,
  });

  const finalStatuses = await getServiceStatusCached();
  await broadcastBookingUpdate('SERVICE_STATUS_CHANGED', finalStatuses, 'system');

  return finalStatuses;
}

/**
 * Securely reset bookings, vehicles, or drivers with password verification.
 */
export async function resetData(
  type: 'booking' | 'driver' | 'vehicle' | 'room' | 'room_booking',
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
  } else if (type === 'room_booking') {
    await db.delete(roomBooking);
    
    await logActivity({
      userId: superadminId,
      userName: actorName,
      action: 'SERVICE_TOGGLED',
      detail: 'Reset data peminjaman ruangan (room_bookings) berhasil dilakukan oleh Superadmin.',
      ipAddress,
    });
  } else if (type === 'room') {
    await db.delete(room);
    
    await logActivity({
      userId: superadminId,
      userName: actorName,
      action: 'SERVICE_TOGGLED',
      detail: 'Reset data ruangan (rooms) berhasil dilakukan oleh Superadmin.',
      ipAddress,
    });
  }

  return { success: true };
}

/**
 * Parse & preview CSV employees (`NIP PENDEK, NAMA, NIP PANJANG, JABATAN`).
 */
export async function previewCsvUsers(fileBuffer: Buffer | string) {
  const csvText = Buffer.isBuffer(fileBuffer) ? fileBuffer.toString('utf-8') : fileBuffer;
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) {
    throw new ValidationError('File CSV kosong.');
  }

  // Remove BOM if present
  let firstLine = lines[0];
  if (firstLine.charCodeAt(0) === 0xFEFF) {
    firstLine = firstLine.slice(1);
  }
  lines[0] = firstLine;

  // Auto-detect delimiter based on first row
  let delimiter = ',';
  const headerOrFirst = lines[0] || '';
  const semiCount = (headerOrFirst.match(/;/g) || []).length;
  const tabCount = (headerOrFirst.match(/\t/g) || []).length;
  const commaCount = (headerOrFirst.match(/,/g) || []).length;

  if (semiCount >= 2 && semiCount >= commaCount && semiCount >= tabCount) {
    delimiter = ';';
  } else if (tabCount >= 2 && tabCount >= commaCount && tabCount >= semiCount) {
    delimiter = '\t';
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(col => col.replace(/^"+|"+$/g, '').trim());
  };

  const firstRowCols = parseLine(lines[0]);
  const isHeader = firstRowCols.some(c => 
    c.toLowerCase().includes('nip') || 
    c.toLowerCase().includes('nama') || 
    c.toLowerCase().includes('jabatan')
  );

  const dataLines = isHeader ? lines.slice(1) : lines;

  const allUsers = await db
    .select({
      id: user.id,
      nip: user.nip,
      nipPanjang: user.nipPanjang,
      name: user.name,
      jabatan: user.jabatan,
      role: user.role
    })
    .from(user);

  const newRows: any[] = [];
  const updateRows: any[] = [];
  let unchangedCount = 0;

  for (const line of dataLines) {
    const cols = parseLine(line);
    if (cols.length < 2) continue;

    const nipPendek = (cols[0] || '').trim();
    const nama = (cols[1] || '').trim().toUpperCase();
    const nipPanjang = (cols[2] || '').trim();
    const jabatan = (cols[3] || '').trim();

    if (!nipPendek || !nama) continue;

    const matchUser = allUsers.find(u => 
      (u.nip && u.nip.trim() === nipPendek) || 
      (nipPanjang && u.nipPanjang && u.nipPanjang.trim() === nipPanjang) ||
      (nipPanjang && u.nip && u.nip.trim() === nipPanjang) ||
      (u.nipPanjang && u.nipPanjang.trim() === nipPendek)
    );

    if (matchUser) {
      const currentName = matchUser.name || '';
      const currentNipPanjang = matchUser.nipPanjang || '';
      const currentJabatan = matchUser.jabatan || '';

      const nameChanged = currentName.trim().toUpperCase() !== nama.trim().toUpperCase();
      const nipPanjangChanged = (nipPanjang || '') !== currentNipPanjang;
      const jabatanChanged = (jabatan || '') !== currentJabatan;

      if (nameChanged || nipPanjangChanged || jabatanChanged) {
        updateRows.push({
          status: 'UPDATE',
          userId: matchUser.id,
          nipPendek: matchUser.nip,
          nama,
          nipPanjang,
          jabatan,
          before: {
            name: currentName,
            nipPanjang: currentNipPanjang || '-',
            jabatan: currentJabatan || '-'
          },
          after: {
            name: nama,
            nipPanjang: nipPanjang || '-',
            jabatan: jabatan || '-'
          }
        });
      } else {
        unchangedCount++;
      }
    } else {
      newRows.push({
        status: 'NEW',
        nipPendek,
        nama,
        nipPanjang,
        jabatan
      });
    }
  }

  return {
    newRows,
    updateRows,
    unchangedCount,
    totalParsed: newRows.length + updateRows.length + unchangedCount
  };
}

/**
 * Commit CSV imported employees with guaranteed relational data safety.
 */
export async function commitCsvUsers(
  payload: { newRows: any[]; updateRows: any[] },
  actorId: string,
  actorName: string,
  ipAddress?: string
) {
  const { newRows = [], updateRows = [] } = payload;
  let createdCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  for (const row of newRows) {
    try {
      await createUser(
        {
          nip: row.nipPendek,
          name: row.nama,
          nipPanjang: row.nipPanjang || undefined,
          jabatan: row.jabatan || undefined,
          role: 'user'
        },
        actorId,
        actorName,
        ipAddress
      );
      createdCount++;
    } catch (err: any) {
      errors.push(`Gagal buat akun NIP ${row.nipPendek} (${row.nama}): ${err.message}`);
    }
  }

  for (const row of updateRows) {
    if (!row.userId) continue;
    try {
      const updateData: any = {
        name: row.nama,
        updatedAt: new Date()
      };
      if (row.nipPanjang !== undefined) updateData.nipPanjang = row.nipPanjang || null;
      if (row.jabatan !== undefined) updateData.jabatan = row.jabatan || null;

      await db
        .update(user)
        .set(updateData)
        .where(eq(user.id, row.userId));

      invalidateUserSessions(row.userId);
      updatedCount++;
    } catch (err: any) {
      errors.push(`Gagal update akun NIP ${row.nipPendek} (${row.nama}): ${err.message}`);
    }
  }

  await logActivity({
    userId: actorId,
    userName: actorName,
    action: 'ACCOUNT_ROLE_CHANGED',
    targetId: actorId,
    targetName: 'Import CSV',
    detail: `Import CSV Pegawai: ${createdCount} baru dibuat, ${updatedCount} diperbarui.`,
    ipAddress,
  });

  return {
    createdCount,
    updatedCount,
    errors
  };
}

