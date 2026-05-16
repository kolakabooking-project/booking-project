import type { Request, Response, NextFunction } from 'express';
import { auth } from '../auth/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

/**
 * Auth guard middleware — validates session and attaches user to request.
 * Returns 401 if no valid session exists.
 */
export async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Sesi tidak valid. Silakan login kembali.',
      });
      return;
    }

    // Attach session data to request for downstream use
    (req as any).user = session.user;
    (req as any).session = session.session;

    next();
  } catch (error) {
    console.error('[AuthGuard] Error validating session:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Gagal memvalidasi sesi.',
    });
  }
}
