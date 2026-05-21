import { Router, type Request, type Response } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { db } from '../config/db.js';
import { pushSubscription } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { sendPushNotification } from '../services/push.service.js';
import { env } from '../config/env.js';

const router = Router();

// Protect all push routes
router.use(authGuard);

/**
 * POST /api/push/subscribe — Register or update a push subscription
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Data subscription tidak valid.' 
      });
    }

    await db.insert(pushSubscription).values({
      userId: actor.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }).onConflictDoUpdate({
      target: pushSubscription.endpoint,
      set: {
        userId: actor.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        createdAt: new Date(),
      }
    });

    res.json({ success: true, message: 'Berhasil mendaftarkan push notification.' });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message || 'Gagal menyimpan subscription.' });
  }
});

/**
 * POST /api/push/unsubscribe — Remove a push subscription
 */
router.post('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Endpoint tidak boleh kosong.' 
      });
    }

    await db.delete(pushSubscription)
      .where(
        and(
          eq(pushSubscription.endpoint, endpoint),
          eq(pushSubscription.userId, actor.id)
        )
      );

    res.json({ success: true, message: 'Berhasil menghapus push notification.' });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message || 'Gagal menghapus subscription.' });
  }
});

/**
 * POST /api/push/test — Test push notification for the logged in user
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    
    await sendPushNotification(actor.id, {
      title: 'Uji Coba Notifikasi',
      body: 'Ini adalah notifikasi uji coba dari sistem BOOKOLAKA.',
      url: '/user/account',
    });

    res.json({ success: true, message: 'Notifikasi uji coba dikirim.' });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message || 'Gagal mengirim notifikasi uji coba.' });
  }
});

/**
 * GET /api/push/vapid-public-key — Get VAPID public key for frontend subscription
 */
router.get('/vapid-public-key', async (req: Request, res: Response) => {
  try {
    res.json({ publicKey: env.VAPID_PUBLIC_KEY });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve public key' });
  }
});

export default router;
