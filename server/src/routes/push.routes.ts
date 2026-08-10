import { Router, type Request, type Response } from 'express';
import { db } from '../config/db.js';
import { pushSubscription, user } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { sendPushNotification, sendBroadcast } from '../services/push.service.js';
import { env } from '../config/env.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = Router();

// authGuard sudah diterapkan di app.ts saat mounting router ini

/**
 * GET /api/push/subscriptions — List all active push subscriptions in DB
 * For superadmin / admin diagnostic.
 */
router.get('/subscriptions', roleGuard('admin'), async (_req: Request, res: Response) => {
  try {
    const subs = await db
      .select({
        id: pushSubscription.id,
        userId: pushSubscription.userId,
        userName: user.name,
        userRole: user.role,
        userNip: user.nip,
        endpoint: pushSubscription.endpoint,
        createdAt: pushSubscription.createdAt,
      })
      .from(pushSubscription)
      .leftJoin(user, eq(pushSubscription.userId, user.id));

    res.json({ success: true, data: subs });
  } catch (err: any) {
    console.error('[PushSubscriptions] Error:', err);
    res.status(500).json({ error: 'Gagal mengambil daftar subscription dari database.' });
  }
});

/**
 * DELETE /api/push/subscriptions/all — Delete all push subscriptions from DB
 * Allows superadmin to reset database table cleanly to test from scratch.
 */
router.delete('/subscriptions/all', roleGuard('admin'), async (_req: Request, res: Response) => {
  try {
    await db.delete(pushSubscription);
    console.log('[PushSubscriptions] All subscriptions reset from database.');
    res.json({ success: true, message: 'Berhasil mereset dan menghapus seluruh data perangkat dari database.' });
  } catch (err: any) {
    console.error('[PushSubscriptions] Reset error:', err);
    res.status(500).json({ error: 'Gagal mereset data perangkat dari database.' });
  }
});

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
 * POST /api/push/test — Test push notification
 * For superadmin, can send to a specific userId.
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const targetUserId = (actor.role === 'superadmin' && req.body.userId) ? req.body.userId : actor.id;
    
    const payload = {
      title: 'Uji Coba Notifikasi',
      body: 'Ini adalah notifikasi uji coba dari sistem BOOKOLAKA.',
      url: '/user/account',
    };

    // Send Web Push
    const pushStats = await sendPushNotification(targetUserId, payload);

    // Send Ably Real-time Push
    try {
      const { default: ably } = await import('../lib/ably.js');
      await ably.channels.get(`notifications:user_${targetUserId}`).publish('new_notification', payload);
    } catch (ablyErr) {
      console.error('[PushTest] Failed to send Ably notification:', ablyErr);
    }

    let message = `Notifikasi uji coba dikirim. (Berhasil: ${pushStats.success}, Gagal: ${pushStats.failed} dari total ${pushStats.total} perangkat terdaftar)`;
    if (pushStats.total === 0) {
      message = `Perhatian: User ini belum mengaktifkan notifikasi di perangkat manapun (0 perangkat di database). Silakan login di HP user tersebut dan klik tombol 'Aktifkan Notifikasi' di menu Akun.`;
    } else if (pushStats.success === 0 && pushStats.failed > 0) {
      const errReason = pushStats.lastError ? ` (${pushStats.lastError})` : ' (token lama/VAPID tidak cocok)';
      message = `Gagal: ${pushStats.failed} perangkat terdaftar ditolak oleh server Google/Apple${errReason}. Silakan cek kesesuaian pasangan VAPID_PUBLIC_KEY dan VAPID_PRIVATE_KEY di Vercel.`;
    }

    res.json({ success: pushStats.success > 0 || pushStats.total === 0, message, stats: pushStats });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message || 'Gagal mengirim notifikasi uji coba.' });
  }
});

// GET /api/push/vapid-public-key or /api/push/vapidPublicKey — Get VAPID public key for frontend subscription
router.get(['/vapid-public-key', '/vapidPublicKey'], async (req: Request, res: Response) => {
  try {
    res.json({ publicKey: env.VAPID_PUBLIC_KEY });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve public key' });
  }
});

/**
 * POST /api/push/broadcast — Broadcast push notification to all users
 * For admin and superadmin.
 */
router.post('/broadcast', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const { title, body, url } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Title dan body tidak boleh kosong.',
      });
    }

    const payload = {
      title,
      body,
      url: url || '/',
    };

    // Fire and Forget broadcast
    sendBroadcast(payload).then((stats) => {
      console.log("[Broadcast] Stats:", stats);
    });

    res.json({ success: true, message: 'Broadcast sedang dikirim ke seluruh pengguna di latar belakang.' });
  } catch (err: any) {
    console.error('[PushBroadcast] Error:', err);
    res.status(500).json({ error: 'Gagal memicu broadcast.' });
  }
});

export default router;
