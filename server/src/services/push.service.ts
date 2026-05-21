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
