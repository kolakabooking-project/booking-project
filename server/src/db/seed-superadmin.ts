/**
 * Superadmin Seed Script
 * 
 * Creates the single superadmin account and initializes system settings.
 * 
 * NIP: 000
 * Password: Superadmin2026!
 * Role: superadmin
 * 
 * Usage: npx tsx src/db/seed-superadmin.ts
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { auth } from '../auth/auth.js';
import { systemSettings, user } from './schema.js';

const connectionString = process.env.DATABASE_URL!;

// Strip unsupported parameters
const cleanConnectionString = connectionString
  .replace(/[&?]channel_binding=[^&]*/g, '')
  .replace(/\?&/, '?')
  .replace(/\?$/, '');

const client = postgres(cleanConnectionString, {
  ssl: connectionString.includes('neon.tech') ? 'require' : undefined,
  prepare: false,
});
const db = drizzle(client);

const SUPERADMIN = {
  nip: '000',
  name: 'SUPER ADMIN',
  email: 'superadmin@kpp-kolaka.internal',
  password: 'Superadmin2026!',
  role: 'superadmin' as const,
  jabatan: 'Super Administrator Sistem',
};

async function seedSuperadmin() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   🛡️  BOOKOLAKA — Superadmin Account Setup       ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // ── 1. Check if superadmin already exists ──
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.nip, SUPERADMIN.nip));

  if (existing.length > 0) {
    console.log('⏭️  Superadmin account already exists. Skipping creation.');
  } else {
    try {
      const result = await auth.api.signUpEmail({
        body: {
          name: SUPERADMIN.name,
          email: SUPERADMIN.email,
          password: SUPERADMIN.password,
          username: SUPERADMIN.nip,
          nip: SUPERADMIN.nip,
          role: SUPERADMIN.role,
          jabatan: SUPERADMIN.jabatan,
        },
      });

      if (result?.user) {
        console.log(`🛡️  Superadmin account created successfully!`);
        console.log(`   NIP: ${SUPERADMIN.nip}`);
        console.log(`   Password: ${SUPERADMIN.password}`);
        console.log(`   Role: ${SUPERADMIN.role}`);
      }
    } catch (err: any) {
      if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
        console.log('⏭️  Superadmin account already exists (caught on creation). Skipping.');
      } else {
        console.error('❌ Failed to create superadmin:', err.message);
        await client.end();
        process.exit(1);
      }
    }
  }

  // ── 2. Initialize system settings ──
  console.log('');
  console.log('⚙️  Initializing system settings...');

  const existingSetting = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, 'service_active'));

  if (existingSetting.length === 0) {
    await db.insert(systemSettings).values({
      key: 'service_active',
      value: 'true',
      updatedAt: new Date(),
    });
    console.log('   ✅ service_active = true (default)');
  } else {
    console.log(`   ⏭️  service_active already set to: ${existingSetting[0].value}`);
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   ✅ Superadmin setup complete!                  ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log('⚠️  IMPORTANT: Change the default password immediately!');
  console.log('');

  await client.end();
  process.exit(0);
}

seedSuperadmin().catch((err) => {
  console.error('❌ Fatal error during superadmin setup:', err);
  process.exit(1);
});
