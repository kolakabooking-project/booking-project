import { db } from '../config/db.js';
import { jadwalWfo, user, activityLog } from '../db/schema.js';
import { eq, and, inArray, ilike } from 'drizzle-orm';
import { sendPushToUsers } from './push.service.js';
import { createNotificationsBatch } from './notification.service.js';

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

  // 4. Send notifications using BATCH operations (eliminates N+1 pattern)
  // Skip notifications if updating historical schedule (past dates)
  const todayStr = new Date().toISOString().split('T')[0];
  const isPastDate = date < todayStr;

  if (!isPastDate) {
    let newlyWfhUserIds: string[] = [];
    
    // Check if this date has been configured before by looking at activityLog
    const [previousLog] = await db
      .select({ id: activityLog.id })
      .from(activityLog)
      .where(
        and(
          eq(activityLog.action, 'WFO_SCHEDULE_UPDATED'),
          // Check if there is ANY previous log containing this date
          ilike(activityLog.detail, `%${date}%`)
        )
      )
      .limit(1);

    // If this is the FIRST TIME saving for this date, notify everyone who is WFH
    if (!previousLog && existingUserIds.length === 0) {
      // Get all users who are not superadmin
      const allUsers = await db.select({ id: user.id }).from(user).where(inArray(user.role, ['user', 'admin']));
      newlyWfhUserIds = allUsers.map((u: any) => u.id).filter((id: any) => !userIds.includes(id));
    } else {
      // If it's an update, only notify those whose status changed from WFO to WFH
      newlyWfhUserIds = existingUserIds.filter((id: string) => !userIds.includes(id));
    }

    // Batch create notifications (1 INSERT instead of N)
    const notificationPayloads = [
      ...newlyAddedUserIds.map((userId) => ({
        userId,
        title: 'Jadwal WFO Diperbarui',
        body: `Anda dijadwalkan untuk Work From Office (WFO) pada hari Jumat, ${date}.`,
        url: '/shared/tracking/jadwal-jumat',
      })),
      ...newlyWfhUserIds.map((userId) => ({
        userId,
        title: 'Jadwal WFH Diperbarui',
        body: `Anda dijadwalkan untuk Work From Home (WFH) pada hari Jumat, ${date}.`,
        url: '/shared/tracking/jadwal-jumat',
      })),
    ];

    // Execute batch operations concurrently (2 queries instead of 2N)
    const allNotifyUserIds = [...newlyAddedUserIds, ...newlyWfhUserIds];
    
    await Promise.allSettled([
      notificationPayloads.length > 0
        ? createNotificationsBatch(notificationPayloads)
        : Promise.resolve(),
      newlyAddedUserIds.length > 0
        ? sendPushToUsers(newlyAddedUserIds, {
            title: 'Jadwal WFO Diperbarui',
            body: `Anda dijadwalkan untuk Work From Office (WFO) pada hari Jumat, ${date}.`,
            url: '/shared/tracking/jadwal-jumat',
          })
        : Promise.resolve(),
      newlyWfhUserIds.length > 0
        ? sendPushToUsers(newlyWfhUserIds, {
            title: 'Jadwal WFH Diperbarui',
            body: `Anda dijadwalkan untuk Work From Home (WFH) pada hari Jumat, ${date}.`,
            url: '/shared/tracking/jadwal-jumat',
          })
        : Promise.resolve(),
    ]);
  }

  return { success: true, count: userIds.length, date };
}
