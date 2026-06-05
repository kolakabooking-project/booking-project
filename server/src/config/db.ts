import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env.js';
import * as schema from '../db/schema.js';

// Connection string
const connectionString = env.DATABASE_URL;

// Auto-detect NeonDB from connection string
const isNeonDB = connectionString.includes('neon.tech');

// Strip unsupported parameters (channel_binding is not supported by postgres.js)
const cleanConnectionString = connectionString
  .replace(/[&?]channel_binding=[^&]*/g, '')
  .replace(/\?&/, '?')      // Fix dangling ?& after removal
  .replace(/\?$/, '');       // Fix trailing ? if it was the only param

let db: any;
let queryClient: any;

if (isNeonDB) {
  // Use Neon HTTP driver for Serverless (no persistent TCP connections)
  // This allows the Vercel serverless function to exit immediately and Neon to suspend
  queryClient = neon(cleanConnectionString);
  db = drizzleNeon(queryClient, { schema });
} else {
  // Use postgres.js for local development
  queryClient = postgres(cleanConnectionString, {
    max: env.NODE_ENV === 'production' ? 5 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: env.NODE_ENV === 'production' ? 'require' : undefined,
    prepare: false,
  });
  db = drizzlePg(queryClient, { schema });
}

export { db, queryClient };
