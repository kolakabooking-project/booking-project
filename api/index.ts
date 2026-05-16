/**
 * Vercel Serverless Function entry point.
 * Wraps the Express app as a single serverless function.
 * All /api/* requests are routed here via vercel.json rewrites.
 * 
 * NOTE: Do NOT import 'dotenv/config' here.
 * - In production (Vercel): env vars are injected by Vercel Dashboard
 * - In development: dotenv is loaded by server/src/config/env.ts
 * - This file resolves from /api/ (root), but dotenv is in /server/node_modules/
 */
import { createApp } from '../server/src/app.js';

const app = createApp();

export default app;
