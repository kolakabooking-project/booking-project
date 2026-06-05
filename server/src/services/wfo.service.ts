import { db } from '../config/db.js';
import { jadwalWfo, user, activityLog } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { sendPushNotification } from './push.service.js';

export async function getWfoSchedulesByDate(date: string) {
  // Return all users who are scheduled for WFO on the given date
  const records = await db
    .select({
      id: jadwalWfo.id,
      date: jadwalWfo.date,
      userId: jadwalWfo.userId,
      user: {
        id: user.id,
        name: user.name,
        nip: user.nip,
        jabatan: user.jabatan,
      }
    })
    .from(jadwalWfo)
    .innerJoin(user, eq(jadwalWfo.userId, user.id))
    .where(eq(jadwalWfo.date, date));
  
  return records;
}

export async function saveWfoSchedule(
  date: string, 
  userIds: string[], 
  actorId: string, 
  actorName: string, 
  ipAddress?: string
) {
  // Fetch existing schedules for this date to determine who is newly added
  const existingSchedules = await getWfoSchedulesByDate(date);
  const existingUserIds = existingSchedules.map((s: any) => s.userId);

  const newlyAddedUserIds = userIds.filter((id) => !existingUserIds.includes(id));

  // Perform updates sequentially since Neon HTTP driver doesn't support interactive transactions
  // 1. Delete existing schedules for this date
  await db.delete(jadwalWfo).where(eq(jadwalWfo.date, date));

  // 2. Insert new schedules if any
  if (userIds.length > 0) {
    const insertData = userIds.map((userId) => ({
      date,
      userId,
    }));
    await db.insert(jadwalWfo).values(insertData);
  }

  // 3. Log activity
  await db.insert(activityLog).values({
    userId: actorId,
    userName: actorName,
    action: 'WFO_SCHEDULE_UPDATED',
    detail: `Memperbarui jadwal WFO untuk tanggal ${date} (${userIds.length} pegawai)`,
    ipAddress,
  });

  // 4. Send push notifications to newly added users
  // Run this outside transaction to avoid blocking it
  if (newlyAddedUserIds.length > 0) {
    const notifyPromises = newlyAddedUserIds.map((userId) =>
      sendPushNotification(userId, {
        title: 'Jadwal WFO Diperbarui',
        body: `Anda dijadwalkan untuk Work From Office (WFO) pada hari Jumat, ${date}.`,
        url: '/shared/tracking/jadwal-jumat'
      })
    );
    // Don't await on promises so the response is fast, or await it if we want to log failures
    await Promise.allSettled(notifyPromises);
  }

  return { success: true, count: userIds.length, date };
}
