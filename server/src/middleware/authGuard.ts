import type { Request, Response, NextFunction } from 'express';
import { auth } from '../auth/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

/**
 * In-memory session cache to avoid redundant DB lookups.
 *
 * Problem: Every API request triggers `auth.api.getSession()` which queries the DB.
 * When the frontend fires 4 parallel requests (e.g., dashboard load), that's
 * 4 identical session validations hitting NeonDB — each with ~100-300ms latency.
 *
 * Solution: Cache validated sessions by token for 60 seconds.
 * First request validates via DB, subsequent requests within the TTL use cache.
 * Cache is invalidated on logout/password-change via `invalidateSessionCache()`.
 */

interface CachedSession {
  user: any;
  session: any;
  expiresAt: number;
}

const sessionCache = new Map<string, CachedSession>();
const SESSION_CACHE_TTL_MS = 60_000; // 60 seconds

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of sessionCache) {
    if (now >= value.expiresAt) {
      sessionCache.delete(key);
    }
  }
}, 5 * 60_000);

/**
 * Extract the session token from request cookies.
 * Better Auth uses "better-auth.session_token" cookie by default.
 */
function extractSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  // Parse cookies manually for speed (avoid full cookie-parser dependency)
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name === 'better-auth.session_token' || name === 'better-auth.session_token.sig') {
      if (name === 'better-auth.session_token') {
        return valueParts.join('='); // Rejoin in case value contains '='
      }
    }
  }
  return null;
}

/**
 * Invalidate a specific session from cache (called on logout/password-change).
 */
export function invalidateSessionCache(token?: string): void {
  if (token) {
    sessionCache.delete(token);
  } else {
    // If no token provided, clear entire cache (nuclear option)
    sessionCache.clear();
  }
}

/**
 * Invalidate all cached sessions for a specific user ID.
 * Used when user role changes or password is reset.
 */
export function invalidateUserSessions(userId: string): void {
  for (const [key, value] of sessionCache) {
    if (value.user?.id === userId) {
      sessionCache.delete(key);
    }
  }
}

/**
 * Auth guard middleware — validates session and attaches user to request.
 * Returns 401 if no valid session exists.
 *
 * Uses in-memory caching to avoid redundant DB queries for the same session token.
 */
export async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractSessionToken(req);

    // Check cache first
    if (token) {
      const cached = sessionCache.get(token);
      if (cached && Date.now() < cached.expiresAt) {
        (req as any).user = cached.user;
        (req as any).session = cached.session;
        return next();
      }
    }

    // Cache miss — validate via DB
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      // Clean up stale cache entry if exists
      if (token) sessionCache.delete(token);

      res.status(401).json({
        error: 'Unauthorized',
        message: 'Sesi tidak valid. Silakan login kembali.',
      });
      return;
    }

    // Cache the validated session
    if (token) {
      sessionCache.set(token, {
        user: session.user,
        session: session.session,
        expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
      });
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
