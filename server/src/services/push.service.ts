import webpush from 'web-push';
import { db } from '../config/db.js';
import { pushSubscription } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { env } from '../config/env.js';

// Configure VAPID details safely with fallback and try-catch to prevent server startup crash if env vars are malformed
let isVapidInitialized = false;
try {
  if (env.VAPID_SUBJECT && env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
    isVapidInitialized = true;
  }
} catch (error) {
  console.error('[PushService] Warning: Failed to initialize VAPID details at startup:', error);
}

interface PushPayload {
  title: string;
  body: string;
  url: string;
}

/**
 * Send a push notification to a specific user.
 * It will send to all active subscriptions of that user.
 */
export async function sendPushNotification(userId: string, payload: PushPayload): Promise<{ success: number; failed: number; total: number }> {
  if (!isVapidInitialized) {
    console.warn('[PushService] Cannot send push notification: VAPID is not initialized.');
    return { success: 0, failed: 0, total: 0 };
  }
  try {
    const subscriptions = await db
      .select()
      .from(pushSubscription)
      .where(eq(pushSubscription.userId, userId));

    if (subscriptions.length === 0) {
      console.log(`[PushService] No subscriptions found in DB for user ${userId}`);
      return { success: 0, failed: 0, total: 0 };
    }

    const payloadString = JSON.stringify(payload);
    const expiredIds: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    const results = await Promise.allSettled(
      subscriptions.map((sub: any) => {
        const subscriptionObj = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };
        return webpush.sendNotification(subscriptionObj, payloadString);
      })
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        failedCount++;
        const err = result.reason as { statusCode?: number; message?: string };
        const sub = subscriptions[i];
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[PushService] Removing expired subscription for user ${userId}: ${sub.endpoint}`);
          expiredIds.push(sub.id);
        } else {
          console.error(`[PushService] Error sending to endpoint ${sub.endpoint} (status ${err.statusCode}):`, err.message || err);
        }
      }
    }

    if (expiredIds.length > 0) {
      await db.delete(pushSubscription).where(inArray(pushSubscription.id, expiredIds));
    }

    console.log(`[PushService] Sent to user ${userId}: ${successCount} success, ${failedCount} failed out of ${subscriptions.length} devices.`);
    return { success: successCount, failed: failedCount, total: subscriptions.length };
  } catch (error) {
    console.error(`[PushService] Failed to send push notification to user ${userId}:`, error);
    return { success: 0, failed: 0, total: 0 };
  }
}

/**
 * Send push notifications to multiple users in a single batch.
 * Fetches ALL subscriptions for all target users in ONE query (instead of N queries).
 * This eliminates the N+1 pattern when notifying many users (e.g., WFO schedule updates).
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (userIds.length === 0 || !isVapidInitialized) return;

  try {
    // Single query for ALL users' subscriptions
    const subscriptions = await db
      .select()
      .from(pushSubscription)
      .where(inArray(pushSubscription.userId, userIds));

    if (subscriptions.length === 0) return;

    const payloadString = JSON.stringify(payload);
    const expiredIds: string[] = [];

    const BATCH_SIZE = 100;
    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.allSettled(
        batch.map((sub: any) => {
          const subscriptionObj = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          };
          return webpush.sendNotification(subscriptionObj, payloadString);
        })
      );

      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'rejected') {
          const err = (results[j] as PromiseRejectedResult).reason as { statusCode?: number };
          if (err.statusCode === 410 || err.statusCode === 404) {
            expiredIds.push(batch[j].id);
          }
        }
      }
    }

    // Batch delete expired subscriptions
    if (expiredIds.length > 0) {
      await db.delete(pushSubscription).where(inArray(pushSubscription.id, expiredIds));
    }

    console.log(`[PushService] Batch sent to ${subscriptions.length} devices for ${userIds.length} users`);
  } catch (error) {
    console.error('[PushService] Batch push failed:', error);
  }
}

/**
 * Send a push notification broadcast to all registered devices.
 * Uses batch processing and Promise.allSettled for optimal performance.
 */
export async function sendBroadcast(payload: PushPayload): Promise<{ success: number; failed: number }> {
  if (!isVapidInitialized) {
    console.warn('[BROADCAST] Cannot send broadcast: VAPID is not initialized.');
    return { success: 0, failed: 0 };
  }
  console.log('[BROADCAST] Memulai pengiriman broadcast...');
  
  try {
    const allSubs = await db.select().from(pushSubscription);
    
    if (allSubs.length === 0) return { success: 0, failed: 0 };

    console.log(`[BROADCAST] Ditemukan ${allSubs.length} perangkat. Memulai pengiriman...`);

    const BATCH_SIZE = 100;
    let successCount = 0;
    let failedCount = 0;
    const payloadString = JSON.stringify(payload);
    const expiredIds: string[] = [];

    for (let i = 0; i < allSubs.length; i += BATCH_SIZE) {
      const batch = allSubs.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.allSettled(
        batch.map((sub: any) => {
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
            expiredIds.push(batch[j].id);
          }
        }
      }
    }

    // Batch delete expired subscriptions (1 query instead of N)
    if (expiredIds.length > 0) {
      await db.delete(pushSubscription).where(inArray(pushSubscription.id, expiredIds));
    }

    console.log(`[BROADCAST] Selesai. Berhasil: ${successCount}, Gagal/Dihapus: ${failedCount}`);
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error('[BROADCAST] Error selama broadcast:', error);
    return { success: 0, failed: 0 };
  }
}
