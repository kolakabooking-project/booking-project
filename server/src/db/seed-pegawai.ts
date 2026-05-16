/**
 * Production User Seed Script for NeonDB
 * 
 * Seeds all 76 employees from KPP Pratama Kolaka with:
 * - Unique NIP as username
 * - Role-based access (admin/user)
 * - Default password: Kolaka2026! (hashed by Better Auth bcrypt)
 * - Proper jabatan with unit organisasi
 * 
 * Usage: DATABASE_URL=<neon-url> npx tsx src/db/seed-pegawai.ts
 */
import 'dotenv/config';
import { auth } from '../auth/auth.js';

// Admin NIPs — users with admin access
const ADMIN_NIPS = new Set(['958634903', '60097600', '958390856']);

// Default password for all users — users should change on first login
const DEFAULT_PASSWORD = 'Kolaka2026!';

const employees = [
  { nip: "60078203", name: "HELMY AFRUL", unit: "KPP Pratama Kolaka", jabatan: "Kepala Kantor" },
  { nip: "60094596", name: "IDO KRISHNA TITARA", unit: "Seksi Pelayanan", jabatan: "Kepala" },
  { nip: "60087318", name: "ANDI HAFSAH", unit: "Seksi Penjaminan Kualitas Data", jabatan: "Kepala" },
  { nip: "60096871", name: "BINTARTO ALIMUDIN", unit: "Seksi Pemeriksaan, Penilaian, dan Penagihan", jabatan: "Kepala" },
  { nip: "60098650", name: "ANDI ROSLINA", unit: "Seksi Pengawasan I", jabatan: "Kepala" },
  { nip: "60079161", name: "TEGUH SULISTYO", unit: "Seksi Pengawasan II", jabatan: "Kepala" },
  { nip: "60094616", name: "EDI SUCIPTO", unit: "Seksi Pengawasan III", jabatan: "Kepala" },
  { nip: "815820860", name: "INDRASAKTI", unit: "Seksi Pengawasan IV", jabatan: "Kepala" },
  { nip: "60080373", name: "SUHERMAWAN APRIYANTO", unit: "Seksi Pengawasan V", jabatan: "Kepala" },
  { nip: "60097600", name: "GEMI WITSNAWAN", unit: "Subbagian Umum dan Kepatuhan Internal", jabatan: "Kepala" },
  { nip: "958390459", name: "FIRSTA RAHADATUL `AISY", unit: "Seksi Pelayanan", jabatan: "Pelaksana" },
  { nip: "60113305", name: "FITRIA SYAFITRI", unit: "Seksi Pelayanan", jabatan: "Pelaksana" },
  { nip: "60113429", name: "YUSRIN A. YADI", unit: "Seksi Pelayanan", jabatan: "Pelaksana" },
  { nip: "958390856", name: "AHMAD FIKRI RAFIUDDIN", unit: "Seksi Penjaminan Kualitas Data", jabatan: "Pelaksana" },
  { nip: "958390489", name: "SARAH NABILA SALMA HADINDA PUTERI", unit: "Seksi Pelayanan", jabatan: "Pelaksana" },
  { nip: "958636464", name: "KRISTIAN M. NATHANAEL PASARIBU", unit: "Seksi Pelayanan", jabatan: "Pelaksana" },
  { nip: "958636517", name: "BELLA SAGITA", unit: "Subbagian Umum dan Kepatuhan Internal", jabatan: "Pelaksana" },
  { nip: "958636624", name: "REGINALDI ELEAZAR PRATAMA", unit: "Seksi Pelayanan", jabatan: "Pelaksana" },
  { nip: "958636608", name: "NANDA EFRI LIANI", unit: "Subbagian Umum dan Kepatuhan Internal", jabatan: "Bendaharawan" },
  { nip: "958631569", name: "BONIFASIUS TODI CHRISAVERO", unit: "Seksi Pelayanan", jabatan: "Pelaksana" },
  { nip: "60108563", name: "NURFAJRI IRAWAN", unit: "Subbagian Umum dan Kepatuhan Internal", jabatan: "Pelaksana" },
  { nip: "958634038", name: "ALMA PRATIWI", unit: "Subbagian Umum dan Kepatuhan Internal", jabatan: "Pelaksana" },
  { nip: "958634903", name: "ILHAM RUSADY", unit: "Subbagian Umum dan Kepatuhan Internal", jabatan: "Pelaksana" },
  { nip: "958633312", name: "SILFIA ETIKA SAFITRI", unit: "Subbagian Umum dan Kepatuhan Internal", jabatan: "Pelaksana" },
  { nip: "60086161", name: "SUKARSI", unit: "Seksi Penjaminan Kualitas Data", jabatan: "Pelaksana" },
  { nip: "958390900", name: "TYAS ALIFA ARDAYANTI", unit: "Seksi Penjaminan Kualitas Data", jabatan: "Pelaksana" },
  { nip: "958636369", name: "MUHAMMAD RAFI NUGROHO", unit: "Seksi Penjaminan Kualitas Data", jabatan: "Pelaksana" },
  { nip: "60116735", name: "DANY BUDI SETYAWAN", unit: "Seksi Pemeriksaan, Penilaian, dan Penagihan", jabatan: "Pelaksana" },
  { nip: "958390715", name: "KEZIA OLIVIA VALERINE", unit: "Seksi Pemeriksaan, Penilaian, dan Penagihan", jabatan: "Pelaksana" },
  { nip: "958636678", name: "ANGGA WAHYUDI", unit: "Seksi Pemeriksaan, Penilaian, dan Penagihan", jabatan: "Pelaksana" },
  { nip: "958633681", name: "GHUFRON RIFA`I", unit: "Seksi Pengawasan I", jabatan: "Pelaksana" },
  { nip: "60106722", name: "TESAR ADITYA SAPUTRA", unit: "Seksi Pengawasan I", jabatan: "Account Representative" },
  { nip: "808320274", name: "SUHENDRA WAHYU", unit: "Seksi Pengawasan I", jabatan: "Account Representative" },
  { nip: "60113302", name: "HADRIANI SUPU", unit: "Seksi Pengawasan I", jabatan: "Account Representative" },
  { nip: "60112235", name: "EVAN LESTYAN MAHENDRA", unit: "Seksi Pengawasan I", jabatan: "Account Representative" },
  { nip: "958630819", name: "KASNAWATI", unit: "Seksi Pengawasan I", jabatan: "Account Representative" },
  { nip: "830351387", name: "AYSHABILY INTIFADHA APRISYA", unit: "Seksi Pengawasan II", jabatan: "Account Representative" },
  { nip: "60115219", name: "MUHAMMAD TAUFIK", unit: "Seksi Pengawasan II", jabatan: "Account Representative" },
  { nip: "60106798", name: "NINA RIZKI AMELIA", unit: "Seksi Pengawasan II", jabatan: "Account Representative" },
  { nip: "958630789", name: "IKA RANTIKA", unit: "Seksi Pengawasan II", jabatan: "Account Representative" },
  { nip: "869010263", name: "FITRIYA ELYTA FAJARINI", unit: "Seksi Pengawasan III", jabatan: "Account Representative" },
  { nip: "60098895", name: "LAODE ABDUL MALIK KARIM", unit: "Seksi Pengawasan III", jabatan: "Account Representative" },
  { nip: "60113457", name: "DWI SANDI LESTARI", unit: "Seksi Pengawasan III", jabatan: "Account Representative" },
  { nip: "910223182", name: "ALIF RAHARDIAN", unit: "Seksi Pengawasan III", jabatan: "Account Representative" },
  { nip: "60091259", name: "RUSNAH", unit: "Seksi Pengawasan IV", jabatan: "Account Representative" },
  { nip: "60105567", name: "SONYA ZORAYA ST KHODIJAH", unit: "Seksi Pengawasan IV", jabatan: "Account Representative" },
  { nip: "830450502", name: "ARIANTI", unit: "Seksi Pengawasan IV", jabatan: "Account Representative" },
  { nip: "830450541", name: "MITA WIDYASTUTI", unit: "Seksi Pengawasan IV", jabatan: "Account Representative" },
  { nip: "830351350", name: "FARANNISA UKKIZALATS", unit: "Seksi Pengawasan IV", jabatan: "Account Representative" },
  { nip: "60113438", name: "NISFUN", unit: "Seksi Pengawasan IV", jabatan: "Account Representative" },
  { nip: "60092439", name: "LA ODE MAZ`UN", unit: "Seksi Pengawasan V", jabatan: "Account Representative" },
  { nip: "830450627", name: "IRIN MALIDA RASULINA", unit: "Seksi Pengawasan V", jabatan: "Account Representative" },
  { nip: "60113448", name: "MERLY NIRMAYA SAPUTRI", unit: "Seksi Pengawasan V", jabatan: "Account Representative" },
  { nip: "820340570", name: "ESTI KHAROH SEPTIANINGSIH", unit: "Seksi Pengawasan V", jabatan: "Account Representative" },
  { nip: "958636620", name: "PARMENAS OBAJA PAGULING", unit: "Seksi Pemeriksaan, Penilaian, dan Penagihan", jabatan: "Juru Sita" },
  { nip: "958634750", name: "KALPATARU AMIRULTA`IN ISWAHYUDI", unit: "Seksi Pemeriksaan, Penilaian, dan Penagihan", jabatan: "Juru Sita" },
  { nip: "958636168", name: "TRI INDAH UTAMI", unit: "Subbagian Umum dan Kepatuhan Internal", jabatan: "Bendaharawan" },
  { nip: "958634218", name: "NAHDLIYYATUS SHOLICHAH", unit: "Subbagian Umum dan Kepatuhan Internal", jabatan: "Sekretaris" },
  { nip: "60096359", name: "TEGUH ARIFIANTO", unit: "", jabatan: "Pemeriksa Pajak Penyelia" },
  { nip: "60099422", name: "AKHBAR BUDIMAN FARSITIANTO ARMANTO", unit: "Seksi Pelayanan", jabatan: "Penyuluh Pajak Ahli Muda" },
  { nip: "60102880", name: "PURNOMO ADI", unit: "", jabatan: "Pemeriksa Pajak Muda" },
  { nip: "60104322", name: "IKA ERAWATI", unit: "", jabatan: "Pemeriksa Pajak Muda" },
  { nip: "60115000", name: "NUR FAJAR", unit: "Seksi Pelayanan", jabatan: "Penyuluh Pajak Ahli Pertama" },
  { nip: "60106297", name: "DWI INDAH NOVITA", unit: "Seksi Pelayanan", jabatan: "Asisten Penyuluh Pajak Mahir" },
  { nip: "958630987", name: "RIVAN WIBOWO", unit: "", jabatan: "Pemeriksa Pajak Pelaksana" },
  { nip: "813300176", name: "EKA NUR YULIANA", unit: "", jabatan: "Pemeriksa Pajak Pelaksana" },
  { nip: "817930809", name: "MUHAMMAD ABDAN FADHLISSALAM", unit: "Seksi Pelayanan", jabatan: "Asisten Penyuluh Pajak Terampil" },
  { nip: "958635641", name: "DINDA RIZKI PARAMUDITA", unit: "Seksi Pelayanan", jabatan: "Asisten Penyuluh Pajak Terampil" },
  { nip: "958635653", name: "BIANCA KANYA HAQQU LONTOH", unit: "", jabatan: "Pemeriksa Pajak Pelaksana" },
  { nip: "810202772", name: "UBAIDILLAH HAFILUDDIN FATH", unit: "", jabatan: "Pemeriksa Pajak Pelaksana" },
  { nip: "60099176", name: "HANDOKO SUSILO", unit: "KP2KP Lasusua", jabatan: "Kepala" },
  { nip: "958390551", name: "IGNATIUS RAKA RADITYO WISNUMURTI", unit: "KP2KP Lasusua", jabatan: "Pelaksana" },
  { nip: "958390738", name: "ILHAM SATRIA GUMILAR", unit: "KP2KP Lasusua", jabatan: "Pelaksana" },
  { nip: "60110861", name: "ORNAS RADITYANDARU", unit: "KP2KP Rumbia", jabatan: "Kepala" },
  { nip: "958390759", name: "ILHAM AQSHAL RAMADHAN", unit: "KP2KP Rumbia", jabatan: "Pelaksana" },
  { nip: "60113433", name: "FACHRUL", unit: "KP2KP Rumbia", jabatan: "Pelaksana" }
];

async function seedPegawai() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   🌱 BOOKOLAKA — Production User Seeding        ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📊 Total employees: ${employees.length}`);
  console.log(`🔑 Default password: ${DEFAULT_PASSWORD}`);
  console.log(`👑 Admin users: ${[...ADMIN_NIPS].join(', ')}`);
  console.log('');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const emp of employees) {
    const role = ADMIN_NIPS.has(emp.nip) ? 'admin' : 'user';
    const email = `${emp.nip}@kpp-kolaka.internal`;
    const jabatanFull = emp.unit ? `${emp.jabatan} ${emp.unit}` : emp.jabatan;

    try {
      const result = await auth.api.signUpEmail({
        body: {
          name: emp.name,
          email: email,
          password: DEFAULT_PASSWORD,
          username: emp.nip,
          nip: emp.nip,
          role: role as 'admin' | 'user',
          jabatan: jabatanFull,
        },
      });
      if (result.user) {
        const icon = role === 'admin' ? '👑' : '👤';
        console.log(`  ${icon} ${emp.name} (${role}) — ${jabatanFull}`);
        successCount++;
      }
    } catch (err: any) {
      if (err.message?.includes('already exists') || err.message?.includes('unique') || err.message?.includes('duplicate')) {
        console.log(`  ⏭️  ${emp.name} — Already exists, skipping`);
        skipCount++;
      } else {
        console.log(`  ❌ ${emp.name} — ${err.message || 'Error creating user'}`);
        errorCount++;
      }
    }
  }
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log(`║   ✅ Created: ${String(successCount).padEnd(35)}║`);
  console.log(`║   ⏭️  Skipped: ${String(skipCount).padEnd(35)}║`);
  console.log(`║   ❌ Errors:  ${String(errorCount).padEnd(35)}║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  
  if (errorCount > 0) {
    console.log('⚠️  Some users failed to seed. Check errors above.');
  }
  
  console.log('🔐 All passwords are hashed with bcrypt by Better Auth.');
  console.log('📝 Remind users to change their password on first login.');
  console.log('');
  
  process.exit(errorCount > 0 ? 1 : 0);
}

seedPegawai().catch((err) => {
  console.error('❌ Fatal error during seeding:', err);
  process.exit(1);
});
