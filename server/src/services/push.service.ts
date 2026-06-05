import webpush from 'web-push';
import { db } from '../config/db.js';
import { pushSubscription } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { env } from '../config/env.js';

// Configure VAPID details
webpush.setVapidDetails(
  env.VAPID_SUBJECT,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY
);

interface PushPayload {
  title: string;
  body: string;
  url: string;
}

/**
 * Send a push notification to a specific user.
 * It will send to all active subscriptions of that user.
 */
export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  try {
    const subscriptions = await db
      .select()
      .from(pushSubscription)
      .where(eq(pushSubscription.userId, userId));

    if (subscriptions.length === 0) {
      return;
    }

    const payloadString = JSON.stringify(payload);

    const promises = subscriptions.map((sub) => {
      const subscriptionObj = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      return webpush.sendNotification(subscriptionObj, payloadString).catch(async (err) => {
        // If subscription is expired or invalid (410 Gone / 404 Not Found), delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[PushService] Removing expired subscription for user ${userId}: ${sub.endpoint}`);
          await db
            .delete(pushSubscription)
            .where(eq(pushSubscription.id, sub.id));
        } else {
          console.error(`[PushService] Error sending to endpoint ${sub.endpoint}:`, err);
        }
      });
    });

    // Run concurrently without blocking the main event loop
    // Since this is in serverless context, we await Promise.all to ensure requests finish,
    // but we catch individual errors inside the map so one failure doesn't reject the whole promise.
    await Promise.all(promises);
  } catch (error) {
    console.error(`[PushService] Failed to send push notification to user ${userId}:`, error);
  }
}

/**
 * Send a push notification broadcast to all registered devices.
 * Uses batch processing and Promise.allSettled for optimal performance.
 */
export async function sendBroadcast(payload: PushPayload): Promise<{ success: number; failed: number }> {
  console.log('[BROADCAST] Memulai pengiriman broadcast...');
  
  try {
    const allSubs = await db.select().from(pushSubscription);
    
    if (allSubs.length === 0) return { success: 0, failed: 0 };

    console.log(`[BROADCAST] Ditemukan ${allSubs.length} perangkat. Memulai pengiriman...`);

    const BATCH_SIZE = 100;
    let successCount = 0;
    let failedCount = 0;
    const payloadString = JSON.stringify(payload);

    for (let i = 0; i < allSubs.length; i += BATCH_SIZE) {
      const batch = allSubs.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.allSettled(
        batch.map(sub => {
          const subscriptionObj = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          };
          return webpush.sendNotification(subscriptionObj, payloadString);
        })
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          failedCount++;
          const err = result.reason as { statusCode?: number };
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db.delete(pushSubscription).where(eq(pushSubscription.id, batch[j].id));
          }
        }
      }
    }

    console.log(`[BROADCAST] Selesai. Berhasil: ${successCount}, Gagal/Dihapus: ${failedCount}`);
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error('[BROADCAST] Error selama broadcast:', error);
    return { success: 0, failed: 0 };
  }
}
