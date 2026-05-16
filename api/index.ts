/**
 * Vercel Serverless Function entry point.
 * Wraps the Express app as a single serverless function.
 * All /api/* requests are routed here via vercel.json rewrites.
 */
import 'dotenv/config';
import { createApp } from '../server/src/app.js';

const app = createApp();

export default app;
