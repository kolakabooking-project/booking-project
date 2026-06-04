import { google } from 'googleapis';
import { Redis } from '@upstash/redis';
import { env } from '../config/env.js';

// ─── Upstash Redis Cache (persistent across serverless cold starts) ───
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('[Cache] Upstash Redis not configured — falling back to in-memory cache');
    return null;
  }
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return redis;
}

// ─── Fallback In-Memory Cache (for local dev without Redis) ───
interface CacheEntry {
  data: string[][];
  fetchedAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

// ─── Lazy-initialized Sheets client ───
let sheetsClient: ReturnType<typeof google.sheets> | null = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  if (!env.GOOGLE_SHEETS_ID || !env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
    throw new Error(
      '[Google Sheets] Missing configuration. Set GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in environment variables.'
    );
  }

  // Handle escaped newlines in private key (common in .env files)
  const privateKey = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

// ─── Cache Key Prefix ───
const CACHE_PREFIX = 'sheets:';

/**
 * Fetch data from a Google Sheets tab with persistent Redis caching.
 * Cache persists indefinitely until manually invalidated via refresh.
 * Falls back to in-memory cache if Redis is not configured.
 *
 * @param sheetName - The tab/sheet name (e.g., 'Agenda Surat Tugas', 'Rekap SPD')
 * @param range - Optional cell range (e.g., 'A3:S'). Defaults to 'A:Z'.
 * @returns 2D array of string values
 */
export async function getSheetData(sheetName: string, range?: string): Promise<string[][]> {
  const cacheKey = `${CACHE_PREFIX}${sheetName}:${range || 'all'}`;
  const redisClient = getRedis();

  // ── Try Redis cache first ──
  if (redisClient) {
    try {
      const cached = await redisClient.get<CacheEntry>(cacheKey);
      if (cached && cached.data) {
        return cached.data;
      }
    } catch (err: any) {
      console.warn('[Cache] Redis read error, falling through to API:', err.message);
    }
  } else {
    // Fallback: in-memory cache (useful for local dev)
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return cached.data;
    }
  }

  // ── Fetch from Google Sheets API ──
  try {
    const sheets = getSheetsClient();
    const fullRange = range ? `'${sheetName}'!${range}` : `'${sheetName}'!A:Z`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: env.GOOGLE_SHEETS_ID!,
      range: fullRange,
      valueRenderOption: 'FORMATTED_VALUE',
    });

    const data = (response.data.values as string[][]) || [];

    // ── Store in cache ──
    const entry: CacheEntry = { data, fetchedAt: Date.now() };

    if (redisClient) {
      try {
        // No TTL — cache persists until manual invalidation
        await redisClient.set(cacheKey, entry);
      } catch (err: any) {
        console.warn('[Cache] Redis write error:', err.message);
      }
    }
    // Always update memory cache as backup
    memoryCache.set(cacheKey, entry);

    return data;
  } catch (error: any) {
    // On quota exceeded or network error, try returning any cached data
    if (error?.code === 429 || error?.message?.includes('QUOTA_EXCEEDED') ||
        error?.code === 'ENOTFOUND' || error?.code === 'ETIMEDOUT') {
      console.warn(`[Google Sheets] Error (${error.code || 'unknown'}), trying cached data`);

      // Try Redis stale cache
      if (redisClient) {
        try {
          const stale = await redisClient.get<CacheEntry>(cacheKey);
          if (stale?.data) return stale.data;
        } catch { /* ignore */ }
      }

      // Try memory stale cache
      const memCached = memoryCache.get(cacheKey);
      if (memCached) return memCached.data;
    }

    console.error(`[Google Sheets] Error fetching "${sheetName}":`, error.message);
    throw error;
  }
}

/**
 * Invalidate cached sheet data.
 * Clears both Redis and in-memory caches.
 * @param sheetName - Optional: clear only a specific sheet's cache. If omitted, clears all.
 */
export async function invalidateCache(sheetName?: string): Promise<void> {
  const redisClient = getRedis();

  if (sheetName) {
    // Clear specific sheet from memory cache
    for (const key of memoryCache.keys()) {
      if (key.startsWith(`${CACHE_PREFIX}${sheetName}:`)) {
        memoryCache.delete(key);
      }
    }

    // Clear specific sheet from Redis
    if (redisClient) {
      try {
        const keys = await scanKeys(redisClient, `${CACHE_PREFIX}${sheetName}:*`);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } catch (err: any) {
        console.warn('[Cache] Redis invalidation error:', err.message);
      }
    }
  } else {
    // Clear all from memory
    memoryCache.clear();

    // Clear all from Redis
    if (redisClient) {
      try {
        const keys = await scanKeys(redisClient, `${CACHE_PREFIX}*`);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } catch (err: any) {
        console.warn('[Cache] Redis invalidation error:', err.message);
      }
    }
  }
}

/**
 * Scan Redis for keys matching a pattern.
 * Uses SCAN command for production safety (non-blocking).
 */
async function scanKeys(client: Redis, pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor: number = 0;
  do {
    const [nextCursor, batch] = await client.scan(cursor, { match: pattern, count: 100 });
    cursor = Number(nextCursor);
    keys.push(...batch);
  } while (cursor !== 0);
  return keys;
}
