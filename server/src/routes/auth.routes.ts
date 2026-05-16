import { Router } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../auth/auth.js';

const router = Router();

/**
 * Mount all Better Auth routes at /api/auth/*
 * Handles: sign-up, sign-in, sign-out, session, etc.
 */
router.all('/api/auth/*splat', toNodeHandler(auth));

export default router;
