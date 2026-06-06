import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

const connectionString =
  process.env.NODE_ENV === 'development' && process.env.LOCAL_DATABASE_URL
    ? process.env.LOCAL_DATABASE_URL
    : process.env.DATABASE_URL!;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: true,
});
