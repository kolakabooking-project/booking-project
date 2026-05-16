import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env.js';
import * as schema from '../db/schema.js';

// Connection pool — tuned for serverless (NeonDB) in production
const connectionString = env.DATABASE_URL;

// Auto-detect NeonDB from connection string
const isNeonDB = connectionString.includes('neon.tech');

// Strip unsupported parameters (channel_binding is not supported by postgres.js)
const cleanConnectionString = connectionString
  .replace(/[&?]channel_binding=[^&]*/g, '')
  .replace(/\?&/, '?')      // Fix dangling ?& after removal
  .replace(/\?$/, '');       // Fix trailing ? if it was the only param

const queryClient = postgres(cleanConnectionString, {
  // Serverless environments share connection pools across invocations
  // NeonDB free tier supports ~100 concurrent connections
  max: env.NODE_ENV === 'production' ? 5 : 10,
  idle_timeout: 20,
  connect_timeout: 10,
  // SSL required for NeonDB (always, regardless of NODE_ENV)
  ssl: isNeonDB ? 'require' : (env.NODE_ENV === 'production' ? 'require' : undefined),
  // Required for NeonDB pooler — disables prepared statements
  // which aren't compatible with pgBouncer connection pooling
  prepare: false,
});

export const db = drizzle(queryClient, { schema });
export { queryClient };
