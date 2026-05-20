import { Router, type Request, type Response, type NextFunction } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../auth/auth.js';
import { logActivity } from '../services/activity.service.js';
import { invalidateUserSessions } from '../middleware/authGuard.js';
import { db } from '../config/db.js';
import { user } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';

const router = Router();

/** Safely extract client IP */
function getIp(req: Request): string | undefined {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
}

/**
 * Middleware to capture session before auth endpoints destroy it (for logout/password-change).
 */
async function captureSessionPreAuth(req: Request, _res: Response, next: NextFunction) {
  const url = req.originalUrl || req.url;

  if (req.method === 'POST' && (url.includes('/sign-out') || url.includes('/change-password'))) {
    try {
      const sessionCookie = req.headers.cookie;
      if (sessionCookie) {
        const session = await auth.api.getSession({
          headers: new Headers({ cookie: sessionCookie }),
        });
        if (session?.user) {
          (req as any).__preAuthUser = session.user;
        }
      }
    } catch { /* silent */ }
  }
  next();
}

/**
 * Pre-auth middleware: Account Lockout Guard.
 * Checks if the account is currently locked out before running Better Auth logic.
 * Returns dynamic remaining lockout time in minutes & seconds.
 */
async function lockoutGuard(req: Request, res: Response, next: NextFunction) {
  const url = req.originalUrl || req.url;
  if (req.method === 'POST' && (url.includes('/sign-in/username') || url.includes('/sign-in/email'))) {
    const { username, email } = req.body;
    const loginIdentifier = username || email;

    if (loginIdentifier) {
      try {
        const [foundUser] = await db
          .select()
          .from(user)
          .where(
            or(
              eq(user.nip, loginIdentifier),
              eq(user.username, loginIdentifier),
              eq(user.email, loginIdentifier)
            )
          );

        if (foundUser && foundUser.lockoutUntil) {
          const lockoutUntil = new Date(foundUser.lockoutUntil);
          const now = new Date();

          if (lockoutUntil > now) {
            const diffMs = lockoutUntil.getTime() - now.getTime();
            const minutes = Math.floor(diffMs / 60000);
            const seconds = Math.floor((diffMs % 60000) / 1000);

            res.status(400).json({
              error: 'AccountLocked',
              message: `Akun Anda terkunci sementara akibat terlalu banyak percobaan login yang gagal. Silakan coba lagi dalam ${minutes} menit ${seconds} detik.`,
            });
            return;
          }
        }
      } catch (err) {
        console.error('[LockoutGuard Error]', err);
      }
    }
  }
  next();
}

/**
 * Middleware to intercept raw HTTP response body from Better Auth's toNodeHandler.
 * Better Auth writes directly via res.end(), bypassing Express's res.json/send.
 * We capture the body by overriding res.write() and res.end().
 */
function authResponseInterceptor(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'POST') return next();

  const url = req.originalUrl || req.url;
  const isSignIn = url.includes('/sign-in/username') || url.includes('/sign-in/email');
  const isSignOut = url.includes('/sign-out');
  const isChangePassword = url.includes('/change-password');

  if (!isSignIn && !isSignOut && !isChangePassword) return next();

  const ip = getIp(req);
  const chunks: Buffer[] = [];

  // Capture response body chunks
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  // Override write to capture chunks
  (res as any).write = function (chunk: any, ...args: any[]) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return originalWrite(chunk, ...args);
  };

  // Override end to capture final chunk and log
  (res as any).end = function (chunk: any, ...args: any[]) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    // Parse the captured response body
    try {
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode < 300) {
        const body = Buffer.concat(chunks).toString('utf8');
        let data: any = null;
        try { data = JSON.parse(body); } catch { /* not JSON */ }

        if (isSignIn && data?.user?.id) {
          // Reset failed attempts on successful login
          db.update(user)
            .set({ failedLoginAttempts: 0, lockoutUntil: null })
            .where(eq(user.id, data.user.id))
            .catch((err) => console.error('[Lockout Reset Error]', err));

          logActivity({
            userId: data.user.id,
            userName: data.user.name || 'Unknown',
            action: 'LOGIN',
            detail: `Login berhasil (NIP: ${data.user.nip || data.user.username || '-'})`,
            ipAddress: ip,
          });
        }

        if (isSignOut) {
          const capturedUser = (req as any).__preAuthUser;
          if (capturedUser?.id) {
            // Invalidate session cache for this user
            invalidateUserSessions(capturedUser.id);

            logActivity({
              userId: capturedUser.id,
              userName: capturedUser.name || 'Unknown',
              action: 'LOGOUT',
              detail: 'Logout berhasil',
              ipAddress: ip,
            });
          }
        }

        if (isChangePassword) {
          const capturedUser = (req as any).__preAuthUser;
          if (capturedUser?.id) {
            // Invalidate session cache so re-auth uses fresh credentials
            invalidateUserSessions(capturedUser.id);

            logActivity({
              userId: capturedUser.id,
              userName: capturedUser.name || 'Unknown',
              action: 'PASSWORD_CHANGED',
              detail: 'Password berhasil diubah (detail password tidak dicatat)',
              ipAddress: ip,
            });
          }
        }
      } else if (statusCode >= 400 && isSignIn) {
        // Increment failed attempts on failed login
        const { username, email } = req.body;
        const loginIdentifier = username || email;

        if (loginIdentifier) {
          (async () => {
            const [foundUser] = await db
              .select()
              .from(user)
              .where(
                or(
                  eq(user.nip, loginIdentifier),
                  eq(user.username, loginIdentifier),
                  eq(user.email, loginIdentifier)
                )
              );

            if (foundUser) {
              const newAttempts = foundUser.failedLoginAttempts + 1;
              const updates: any = { failedLoginAttempts: newAttempts };

              if (newAttempts >= 5) {
                updates.lockoutUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes lockout

                logActivity({
                  userId: foundUser.id,
                  userName: foundUser.name,
                  action: 'LOGIN',
                  detail: `Akun terkunci otomatis selama 5 menit karena 5 kali gagal login berturut-turut.`,
                  ipAddress: ip,
                }).catch(() => {});
              }

              await db.update(user).set(updates).where(eq(user.id, foundUser.id));
            }
          })().catch((err) => console.error('[Lockout Increment Error]', err));
        }
      }
    } catch { /* silent — never break auth flow */ }

    return originalEnd(chunk, ...args);
  };

  next();
}

/**
 * Mount all Better Auth routes at /api/auth/*
 * Handles: sign-up, sign-in, sign-out, session, change-password, etc.
 *
 * Middleware pipeline:
 * 1. captureSessionPreAuth — saves user data before session is destroyed
 * 2. authResponseInterceptor — captures raw response body for login/logout/password logging
 * 3. Better Auth handler
 */
router.all(
  '/api/auth/*splat',
  captureSessionPreAuth,
  lockoutGuard,
  authResponseInterceptor,
  toNodeHandler(auth)
);

export default router;
