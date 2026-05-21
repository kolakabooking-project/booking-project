import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import crypto from 'crypto';
import { env } from './config/env.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import driverRoutes from './routes/driver.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import reportRoutes from './routes/report.routes.js';
import chatRoutes from './routes/chat.js';
import superadminRoutes from './routes/superadmin.routes.js';
import pushRoutes from './routes/push.routes.js';

// Middleware
import { authGuard } from './middleware/authGuard.js';
import { roleGuard } from './middleware/roleGuard.js';
import { maintenanceGuard } from './middleware/maintenanceGuard.js';



export function createApp() {
  const app = express();
  const isProd = env.NODE_ENV === 'production';

  // ─── Trust Proxy (Vercel terminates TLS and forwards via x-forwarded-for) ───
  if (isProd) {
    app.set('trust proxy', 1);
  }

  // ─── Request ID for tracing ───
  app.use((req, _res, next) => {
    (req as any).requestId = crypto.randomUUID();
    next();
  });

  // ─── Security Headers ───
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
              connectSrc: ["'self'", 'https://*.ably.io', 'wss://*.ably.io', 'https://*.ably-realtime.com', 'wss://*.ably-realtime.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              objectSrc: ["'none'"],
              frameSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
            },
          }
        : false, // Disable CSP in development for easier debugging
      hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // ─── CORS ───
  const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (isProd) {
          // In production: Allow same-origin (undefined) or explicitly allowed origins
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
          }
        } else {
          // In development: Allow requests with no origin (curl, Postman, etc.)
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
          }
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    })
  );

  // ─── Rate Limiting ───

  // Auth limiter — only for /api/auth/* routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProd ? 20 : 50, // Stricter in production
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
    },
    // Use x-forwarded-for in production (Vercel proxy)
    ...(isProd && { keyGenerator: (req) => req.ip || 'unknown' }),
  });

  // CRUD / API limiter — for data routes
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProd ? 300 : 1000, // Stricter in production
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.',
    },
    ...(isProd && { keyGenerator: (req) => req.ip || 'unknown' }),
  });

  // Export limiter — very strict to prevent CU spikes from data exports
  const exportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 exports per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Terlalu banyak permintaan export. Coba lagi dalam 15 menit.',
    },
    ...(isProd && { keyGenerator: (req) => req.ip || 'unknown' }),
  });

  // ─── Body Parsers ───
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // ─── Static File Serving (uploads — only in development) ───
  if (!isProd) {
    const uploadsDir = path.resolve(env.UPLOAD_DIR);
    app.use('/uploads', express.static(uploadsDir));
  }

  // ─── Auth Routes (Better Auth) — with separate rate limit ───
  app.use('/api/auth', authLimiter);
  app.use(authRoutes);

  // ─── Authenticated Profile Route ───
  app.get('/api/me', authGuard, (req, res) => {
    const user = (req as any).user;
    res.json({
      data: {
        id: user.id,
        name: user.name,
        nip: user.nip,
        role: user.role,
        jabatan: user.jabatan,
        image: user.image,
        email: user.email,
      },
    });
  });

  // ─── Ably Auth Token Endpoint ───
  app.get('/api/ably/auth', authGuard, async (req, res) => {
    try {
      const user = (req as any).user;
      // Dynamically import ably to avoid circular dependency or initialization issues if env is missing
      const { default: ably } = await import('./lib/ably.js');
      const tokenRequestData = await ably.auth.createTokenRequest({ clientId: user.id });
      res.json(tokenRequestData);
    } catch (err: any) {
      console.error('[ABLY AUTH ERROR]', err.message); // Don't log full error object (may contain keys)
      res.status(500).json({ error: 'Failed to generate Ably token' });
    }
  });


  // ─── Service Status Check (public, for frontend maintenance page) ───
  // Uses shared cache to avoid redundant DB queries
  app.get('/api/service-status', async (_req, res) => {
    try {
      const { isServiceActive } = await import('./lib/serviceStatusCache.js');
      const active = await isServiceActive();
      res.json({ data: { active } });
    } catch {
      res.json({ data: { active: true } }); // Default to active on error
    }
  });

  // ─── Superadmin Routes — strict access control ───
  app.use('/api/superadmin', apiLimiter, authGuard, roleGuard('superadmin'), superadminRoutes);

  // ─── API Routes — with standard rate limit + maintenance guard ───
  app.use('/api/vehicles', apiLimiter, authGuard, maintenanceGuard, vehicleRoutes);
  app.use('/api/drivers', apiLimiter, authGuard, maintenanceGuard, driverRoutes);
  app.use('/api/bookings', apiLimiter, maintenanceGuard, bookingRoutes);
  app.use('/api/reports', apiLimiter, authGuard, maintenanceGuard, reportRoutes);
  app.use('/api/chat', apiLimiter, authGuard, maintenanceGuard, chatRoutes);
  app.use('/api/push', apiLimiter, authGuard, maintenanceGuard, pushRoutes);

  // ─── Health Check ───
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // ─── Global Error Handler ───
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // Log errors but sanitize sensitive data
    if (isProd) {
      console.error('[ERROR]', err.message, err.code || '');
    } else {
      console.error('[ERROR]', err);
    }

    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        error: `Ukuran file melebihi batas maksimum ${env.MAX_FILE_SIZE_MB}MB.`,
      });
      return;
    }

    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
      error: isProd ? (statusCode < 500 ? err.message : 'Internal Server Error') : err.message || 'Internal Server Error',
      // Only expose stack traces in development
      ...((!isProd) && { stack: err.stack }),
    });
  });

  // ─── 404 Handler ───
  app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
  });

  return app;
}
