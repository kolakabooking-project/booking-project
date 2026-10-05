import { db } from '../config/db.js';
import { kegiatanKepala, stKepala, user } from '../db/schema.js';
import { eq, desc, asc, and, gte, lte, sql } from 'drizzle-orm';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { logActivity } from './activity.service.js';

// ─────────────────────────────────────────────
//  Helpers: Format Tanggal & Notifikasi Pimpinan
// ─────────────────────────────────────────────

function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${d} ${months[m - 1]} ${y}`;
  } catch {
    return dateStr;
  }
}

async function notifyKepalaKantor(
  title: string,
  body: string,
  url: string = '/kepala-kantor/jadwal',
  actorId?: string
) {
  try {
    const { createNotification } = await import('./notification.service.js');
    const { sendPushNotification } = await import('./push.service.js');

    // 1. Ambil seluruh user dengan role 'kepala_kantor'
    let targets = await db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(eq(user.role, 'kepala_kantor'));

    // 2. Fallback jika belum ada user dengan role kepala_kantor (cari via jabatan atau default)
    if (targets.length === 0) {
      const fallback = await getKepalaKantorInfo();
      if (fallback && fallback.id && fallback.id !== 'default-kepala') {
        targets = [{ id: fallback.id, name: fallback.name }];
      }
    }

    // Hindari mengirim ke penginput sendiri jika penginput adalah kepala kantor
    const filteredTargets = targets.filter(t => !actorId || t.id !== actorId);

    // Kirim notifikasi in-app (Ably real-time) dan Web Push secara awaited
    for (const target of filteredTargets) {
      const payload = {
        userId: target.id,
        title,
        body,
        url,
      };

      try {
        await createNotification(payload);
      } catch (inAppErr) {
        console.error(`[JadwalKepala] In-app notification failed for user ${target.id}:`, inAppErr);
      }

      try {
        await sendPushNotification(target.id, payload);
      } catch (pushErr) {
        console.error(`[JadwalKepala] Push notification failed for user ${target.id}:`, pushErr);
      }
    }
  } catch (err) {
    console.error('[JadwalKepalaService] Failed to notify Kepala Kantor:', err);
  }
}

// ─────────────────────────────────────────────
//  Kegiatan Kepala Kantor
// ─────────────────────────────────────────────

export interface ListKegiatanFilters {
  month?: number; // 1 - 12
  year?: number;  // e.g. 2026
  search?: string;
}

export async function listKegiatan(filters?: ListKegiatanFilters) {
  const conditions: any[] = [];

  if (filters?.year && filters?.month) {
    const monthStr = String(filters.month).padStart(2, '0');
    const startOfMonth = `${filters.year}-${monthStr}-01`;
    // Calculate end of month
    const nextMonth = filters.month === 12 ? 1 : filters.month + 1;
    const nextYear = filters.month === 12 ? filters.year + 1 : filters.year;
    const nextMonthStr = String(nextMonth).padStart(2, '0');
    const startOfNextMonth = `${nextYear}-${nextMonthStr}-01`;

    conditions.push(gte(kegiatanKepala.tanggal, startOfMonth));
    conditions.push(sql`${kegiatanKepala.tanggal} < ${startOfNextMonth}`);
  } else if (filters?.year) {
    conditions.push(gte(kegiatanKepala.tanggal, `${filters.year}-01-01`));
    conditions.push(lte(kegiatanKepala.tanggal, `${filters.year}-12-31`));
  }

  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      sql`(${kegiatanKepala.agenda} ILIKE ${term} OR ${kegiatanKepala.tempat} ILIKE ${term})`
    );
  }

  const query = db
    .select({
      id: kegiatanKepala.id,
      tanggal: kegiatanKepala.tanggal,
      waktuMulai: kegiatanKepala.waktuMulai,
      waktuSelesai: kegiatanKepala.waktuSelesai,
      agenda: kegiatanKepala.agenda,
      tempat: kegiatanKepala.tempat,
      createdBy: kegiatanKepala.createdBy,
      creatorName: user.name,
      createdAt: kegiatanKepala.createdAt,
      updatedAt: kegiatanKepala.updatedAt,
    })
    .from(kegiatanKepala)
    .leftJoin(user, eq(kegiatanKepala.createdBy, user.id))
    .orderBy(asc(kegiatanKepala.tanggal), asc(kegiatanKepala.waktuMulai));

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }

  return query;
}

export async function getKegiatanById(id: string) {
  const [result] = await db
    .select({
      id: kegiatanKepala.id,
      tanggal: kegiatanKepala.tanggal,
      waktuMulai: kegiatanKepala.waktuMulai,
      waktuSelesai: kegiatanKepala.waktuSelesai,
      agenda: kegiatanKepala.agenda,
      tempat: kegiatanKepala.tempat,
      createdBy: kegiatanKepala.createdBy,
      creatorName: user.name,
      createdAt: kegiatanKepala.createdAt,
      updatedAt: kegiatanKepala.updatedAt,
    })
    .from(kegiatanKepala)
    .leftJoin(user, eq(kegiatanKepala.createdBy, user.id))
    .where(eq(kegiatanKepala.id, id));

  if (!result) {
    throw new NotFoundError('Agenda Kegiatan');
  }

  return result;
}

export async function createKegiatan(
  data: {
    tanggal: string;
    waktuMulai: string;
    waktuSelesai?: string;
    agenda: string;
    tempat: string;
  },
  actorId: string,
  actorName: string,
  ipAddress?: string
) {
  if (!data.tanggal || !data.waktuMulai || !data.agenda?.trim() || !data.tempat?.trim()) {
    throw new ValidationError('Tanggal, waktu mulai, agenda, dan tempat wajib diisi.');
  }

  const [created] = await db
    .insert(kegiatanKepala)
    .values({
      tanggal: data.tanggal,
      waktuMulai: data.waktuMulai.trim(),
      waktuSelesai: data.waktuSelesai?.trim() || null,
      agenda: data.agenda.trim(),
      tempat: data.tempat.trim(),
      createdBy: actorId,
    })
    .returning();

  await logActivity({
    userId: actorId,
    userName: actorName,
    action: 'KEGIATAN_CREATED',
    targetId: created.id,
    targetName: created.agenda,
    detail: `Agenda "${created.agenda}" pada ${created.tanggal} pukul ${created.waktuMulai} di ${created.tempat} dibuat.`,
    ipAddress,
  });

  // Notify Kepala Kantor in-app and push (awaited to guarantee delivery before serverless response)
  await notifyKepalaKantor(
    'Agenda Kegiatan Baru',
    `Sekretaris telah menambahkan agenda kegiatan: "${created.agenda}" pada ${formatDateIndo(created.tanggal)} pukul ${created.waktuMulai} di ${created.tempat}.`,
    '/kepala-kantor/jadwal',
    actorId
  );

  return created;
}

export async function updateKegiatan(
  id: string,
  data: {
    tanggal?: string;
    waktuMulai?: string;
    waktuSelesai?: string;
    agenda?: string;
    tempat?: string;
  },
  actorId: string,
  actorName: string,
  ipAddress?: string
) {
  const existing = await getKegiatanById(id);

  const updatePayload: Partial<typeof kegiatanKepala.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.tanggal) updatePayload.tanggal = data.tanggal;
  if (data.waktuMulai !== undefined) updatePayload.waktuMulai = data.waktuMulai.trim();
  if (data.waktuSelesai !== undefined) updatePayload.waktuSelesai = data.waktuSelesai?.trim() || null;
  if (data.agenda !== undefined) updatePayload.agenda = data.agenda.trim();
  if (data.tempat !== undefined) updatePayload.tempat = data.tempat.trim();

  const [updated] = await db
    .update(kegiatanKepala)
    .set(updatePayload)
    .where(eq(kegiatanKepala.id, id))
    .returning();

  await logActivity({
    userId: actorId,
    userName: actorName,
    action: 'KEGIATAN_UPDATED',
    targetId: id,
    targetName: updated.agenda,
    detail: `Agenda "${updated.agenda}" diubah.`,
    ipAddress,
  });

  // Notify Kepala Kantor in-app and push (awaited to guarantee delivery before serverless response)
  await notifyKepalaKantor(
    'Perubahan Agenda Kegiatan',
    `Sekretaris telah memperbarui agenda kegiatan: "${updated.agenda}" pada ${formatDateIndo(updated.tanggal)} pukul ${updated.waktuMulai} di ${updated.tempat}.`,
    '/kepala-kantor/jadwal',
    actorId
  );

  return updated;
}

export async function deleteKegiatan(
  id: string,
  actorId: string,
  actorName: string,
  ipAddress?: string
) {
  const existing = await getKegiatanById(id);

  await db.delete(kegiatanKepala).where(eq(kegiatanKepala.id, id));

  await logActivity({
    userId: actorId,
    userName: actorName,
    action: 'KEGIATAN_DELETED',
    targetId: id,
    targetName: existing.agenda,
    detail: `Agenda "${existing.agenda}" pada ${existing.tanggal} dihapus.`,
    ipAddress,
  });

  // Notify Kepala Kantor in-app and push (awaited to guarantee delivery before serverless response)
  await notifyKepalaKantor(
    'Pembatalan Agenda Kegiatan',
    `Agenda kegiatan: "${existing.agenda}" pada ${formatDateIndo(existing.tanggal)} telah dibatalkan/dihapus oleh Sekretaris.`,
    '/kepala-kantor/jadwal',
    actorId
  );

  return { success: true, id };
}

// ─────────────────────────────────────────────
//  Surat Tugas (ST) Kepala Kantor
// ─────────────────────────────────────────────

export interface ListSTFilters {
  month?: number;
  year?: number;
  search?: string;
}

export async function listST(filters?: ListSTFilters) {
  const conditions: any[] = [];

  if (filters?.year && filters?.month) {
    const monthStr = String(filters.month).padStart(2, '0');
    const startOfMonth = `${filters.year}-${monthStr}-01`;
    const nextMonth = filters.month === 12 ? 1 : filters.month + 1;
    const nextYear = filters.month === 12 ? filters.year + 1 : filters.year;
    const nextMonthStr = String(nextMonth).padStart(2, '0');
    const startOfNextMonth = `${nextYear}-${nextMonthStr}-01`;

    conditions.push(
      sql`(${stKepala.tanggal} < ${startOfNextMonth} AND (COALESCE(${stKepala.tanggalSelesai}, ${stKepala.tanggal}) >= ${startOfMonth}))`
    );
  } else if (filters?.year) {
    conditions.push(gte(stKepala.tanggal, `${filters.year}-01-01`));
    conditions.push(lte(stKepala.tanggal, `${filters.year}-12-31`));
  }

  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      sql`(${stKepala.tentang} ILIKE ${term} OR ${stKepala.tempat} ILIKE ${term})`
    );
  }

  const query = db
    .select({
      id: stKepala.id,
      tentang: stKepala.tentang,
      tempat: stKepala.tempat,
      tanggal: stKepala.tanggal,
      tanggalSelesai: stKepala.tanggalSelesai,
      createdBy: stKepala.createdBy,
      creatorName: user.name,
      createdAt: stKepala.createdAt,
      updatedAt: stKepala.updatedAt,
    })
    .from(stKepala)
    .leftJoin(user, eq(stKepala.createdBy, user.id))
    .orderBy(asc(stKepala.tanggal));

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }

  return query;
}

export async function getSTById(id: string) {
  const [result] = await db
    .select({
      id: stKepala.id,
      tentang: stKepala.tentang,
      tempat: stKepala.tempat,
      tanggal: stKepala.tanggal,
      tanggalSelesai: stKepala.tanggalSelesai,
      createdBy: stKepala.createdBy,
      creatorName: user.name,
      createdAt: stKepala.createdAt,
      updatedAt: stKepala.updatedAt,
    })
    .from(stKepala)
    .leftJoin(user, eq(stKepala.createdBy, user.id))
    .where(eq(stKepala.id, id));

  if (!result) {
    throw new NotFoundError('Surat Tugas');
  }

  return result;
}

export async function createST(
  data: {
    tentang: string;
    tempat: string;
    tanggal: string;
    tanggalSelesai?: string;
  },
  actorId: string,
  actorName: string,
  ipAddress?: string
) {
  if (!data.tentang?.trim() || !data.tempat?.trim() || !data.tanggal) {
    throw new ValidationError('Tentang, tempat, dan tanggal Surat Tugas wajib diisi.');
  }

  const [created] = await db
    .insert(stKepala)
    .values({
      tentang: data.tentang.trim(),
      tempat: data.tempat.trim(),
      tanggal: data.tanggal,
      tanggalSelesai: data.tanggalSelesai || null,
      createdBy: actorId,
    })
    .returning();

  await logActivity({
    userId: actorId,
    userName: actorName,
    action: 'ST_CREATED',
    targetId: created.id,
    targetName: created.tentang,
    detail: `Surat Tugas "${created.tentang}" pada ${created.tanggal} di ${created.tempat} dibuat.`,
    ipAddress,
  });

  const tglText = created.tanggalSelesai && created.tanggalSelesai !== created.tanggal
    ? `${formatDateIndo(created.tanggal)} s.d. ${formatDateIndo(created.tanggalSelesai)}`
    : formatDateIndo(created.tanggal);

  // Notify Kepala Kantor in-app and push (awaited to guarantee delivery before serverless response)
  await notifyKepalaKantor(
    'Surat Tugas (ST) Baru',
    `Sekretaris telah menambahkan Surat Tugas: "${created.tentang}" di ${created.tempat} (${tglText}).`,
    '/kepala-kantor/jadwal',
    actorId
  );

  return created;
}

export async function updateST(
  id: string,
  data: {
    tentang?: string;
    tempat?: string;
    tanggal?: string;
    tanggalSelesai?: string;
  },
  actorId: string,
  actorName: string,
  ipAddress?: string
) {
  const existing = await getSTById(id);

  const updatePayload: Partial<typeof stKepala.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.tentang !== undefined) updatePayload.tentang = data.tentang.trim();
  if (data.tempat !== undefined) updatePayload.tempat = data.tempat.trim();
  if (data.tanggal) updatePayload.tanggal = data.tanggal;
  if (data.tanggalSelesai !== undefined) updatePayload.tanggalSelesai = data.tanggalSelesai || null;

  const [updated] = await db
    .update(stKepala)
    .set(updatePayload)
    .where(eq(stKepala.id, id))
    .returning();

  await logActivity({
    userId: actorId,
    userName: actorName,
    action: 'ST_UPDATED',
    targetId: id,
    targetName: updated.tentang,
    detail: `Surat Tugas "${updated.tentang}" diubah.`,
    ipAddress,
  });

  const tglText = updated.tanggalSelesai && updated.tanggalSelesai !== updated.tanggal
    ? `${formatDateIndo(updated.tanggal)} s.d. ${formatDateIndo(updated.tanggalSelesai)}`
    : formatDateIndo(updated.tanggal);

  // Notify Kepala Kantor in-app and push (awaited to guarantee delivery before serverless response)
  await notifyKepalaKantor(
    'Perubahan Surat Tugas (ST)',
    `Sekretaris telah memperbarui Surat Tugas: "${updated.tentang}" di ${updated.tempat} (${tglText}).`,
    '/kepala-kantor/jadwal',
    actorId
  );

  return updated;
}

export async function deleteST(
  id: string,
  actorId: string,
  actorName: string,
  ipAddress?: string
) {
  const existing = await getSTById(id);

  await db.delete(stKepala).where(eq(stKepala.id, id));

  await logActivity({
    userId: actorId,
    userName: actorName,
    action: 'ST_DELETED',
    targetId: id,
    targetName: existing.tentang,
    detail: `Surat Tugas "${existing.tentang}" pada ${existing.tanggal} dihapus.`,
    ipAddress,
  });

  // Notify Kepala Kantor in-app and push (awaited to guarantee delivery before serverless response)
  await notifyKepalaKantor(
    'Pembatalan Surat Tugas (ST)',
    `Surat Tugas: "${existing.tentang}" pada ${formatDateIndo(existing.tanggal)} telah dibatalkan/dihapus oleh Sekretaris.`,
    '/kepala-kantor/jadwal',
    actorId
  );

  return { success: true, id };
}

// ─────────────────────────────────────────────
//  Pimpinan / Kepala Kantor Info
// ─────────────────────────────────────────────

export async function getKepalaKantorInfo() {
  // 1. First look for user with role 'kepala_kantor'
  let [kepala] = await db
    .select({
      id: user.id,
      name: user.name,
      nip: user.nip,
      nipPanjang: user.nipPanjang,
      jabatan: user.jabatan,
    })
    .from(user)
    .where(eq(user.role, 'kepala_kantor'))
    .limit(1);

  // 2. Fallback to user with jabatan containing 'Kepala Kantor' if role hasn't been switched
  if (!kepala) {
    [kepala] = await db
      .select({
        id: user.id,
        name: user.name,
        nip: user.nip,
        nipPanjang: user.nipPanjang,
        jabatan: user.jabatan,
      })
      .from(user)
      .where(sql`LOWER(${user.jabatan}) LIKE '%kepala kantor%'`)
      .limit(1);
  }

  // 3. Fallback default if not found
  if (!kepala) {
    return {
      id: 'default-kepala',
      name: 'Kepala Kantor',
      nip: '-',
      nipPanjang: '-',
      jabatan: 'Kepala Kantor',
    };
  }

  return kepala;
}

// ─────────────────────────────────────────────
//  Aggregated Calendar View
// ─────────────────────────────────────────────

export async function getCalendarData(month?: number, year?: number) {
  const now = new Date();
  const currentMonth = month || now.getMonth() + 1;
  const currentYear = year || now.getFullYear();

  const [kegiatanList, stList, kepalaKantor] = await Promise.all([
    listKegiatan({ month: currentMonth, year: currentYear }),
    listST({ month: currentMonth, year: currentYear }),
    getKepalaKantorInfo(),
  ]);

  return {
    month: currentMonth,
    year: currentYear,
    kegiatan: kegiatanList,
    st: stList,
    stats: {
      totalKegiatan: kegiatanList.length,
      totalST: stList.length,
      totalEvents: kegiatanList.length + stList.length,
    },
    kepalaKantor,
  };
}
