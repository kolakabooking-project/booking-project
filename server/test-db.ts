import { db } from './src/config/db.js';
import { jadwalWfo } from './src/db/schema.js';

async function test() {
  const records = await db.select().from(jadwalWfo);
  console.log('Total records in jadwalWfo:', records.length);
  process.exit(0);
}
test().catch(console.error);
