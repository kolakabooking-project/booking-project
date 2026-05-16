import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';
import { db } from '../config/db.js';
import { env } from '../config/env.js';
import * as schema from '../db/schema.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: any = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireCurrentPasswordOnUpdate: true,
  },
  user: {
    additionalFields: {
      nip: {
        type: 'string',
        required: true,
        input: true,
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: true,
      },
      jabatan: {
        type: 'string',
        required: false,
        input: true,
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day — refresh session daily
  },
  plugins: [username()],
  trustedOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
});
