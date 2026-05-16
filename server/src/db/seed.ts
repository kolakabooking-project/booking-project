import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { inArray } from 'drizzle-orm';
import { vehicle, driver, booking, bookingReview, user, account } from './schema.js';
import { auth } from '../auth/auth.js';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

// ─── Helper ───
// To support hardcoded dates
function createMayDate(day: number, hours: number, minutes = 0): Date {
  // Format: 2026-05-xxTyy:mm:00.000+08:00
  const d = new Date(2026, 4, day, hours, minutes, 0, 0); // Month is 0-indexed (4 = May)
  return d;
}

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ── 0. CLEANUP (Drop Existing Data) ──
  console.log('🧹 Clearing existing data...');
  await db.delete(bookingReview);
  await db.delete(booking);
  await db.delete(driver);
  await db.delete(vehicle);
  
  console.log('🧹 Deleting old dummy users...');
  const dummyNips = ['198001011001', '198002021002', '198501012010011001', '199003152012012002'];
  await db.delete(user).where(inArray(user.nip, dummyNips));

  console.log('  ✅ Cleared bookingReview, booking, driver, vehicle tables, and dummy users');

  // ── 1. Fetch Users ──
  console.log('\n👥 Fetching users for dummy bookings...');
  
  const dbUsers = await db.select().from(user);
  const userMap = new Map(dbUsers.map((u) => [u.nip, u.id]));

  // Use real NIPs from the 76 employees seeded earlier
  const u1 = userMap.get('958390856'); // AHMAD FIKRI RAFIUDDIN
  const u2 = userMap.get('958390459'); // FIRSTA RAHADATUL `AISY
  const u3 = userMap.get('60106722');  // TESAR ADITYA SAPUTRA
  const u4 = userMap.get('958636620'); // PARMENAS OBAJA PAGULING

  if (!u1 || !u2 || !u3 || !u4) {
    console.error('❌ Could not find all required users. Ensure seed-pegawai.ts has been run.');
    await client.end();
    process.exit(1);
  }

  // ── 2. Seed Vehicles ──
  console.log('\n🚗 Creating vehicles...');

  const vehiclesData = [
    { id: 'v1', platNomor: 'DT 1111 AA', merek: 'Toyota Innova Zenix', tipe: 'Mobil' as const, tahun: 2024, kapasitas: 7, status: 'Tersedia' as const, odometer: 15230, jadwalPajak: '2027-01-15', jadwalServis: '2026-07-20', warna: 'Hitam', foto: null },
    { id: 'v2', platNomor: 'DT 2222 BB', merek: 'Mitsubishi Xpander', tipe: 'Mobil' as const, tahun: 2023, kapasitas: 7, status: 'Tersedia' as const, odometer: 28150, jadwalPajak: '2026-09-10', jadwalServis: '2026-08-15', warna: 'Silver', foto: null },
    { id: 'v3', platNomor: 'DT 3333 CC', merek: 'Toyota Avanza Veloz', tipe: 'Mobil' as const, tahun: 2022, kapasitas: 7, status: 'Tersedia' as const, odometer: 56890, jadwalPajak: '2026-04-20', jadwalServis: '2026-06-01', warna: 'Putih', foto: null },
    { id: 'v4', platNomor: 'DT 4444 DD', merek: 'Honda Vario 160', tipe: 'Motor' as const, tahun: 2023, kapasitas: 2, status: 'Tersedia' as const, odometer: 12450, jadwalPajak: '2026-11-05', jadwalServis: '2026-09-25', warna: 'Merah', foto: null },
    { id: 'v5', platNomor: 'DT 5555 EE', merek: 'Yamaha NMAX Connected', tipe: 'Motor' as const, tahun: 2024, kapasitas: 2, status: 'Tersedia' as const, odometer: 5230, jadwalPajak: '2027-01-15', jadwalServis: '2026-05-10', warna: 'Biru', foto: null },
  ];

  await db.insert(vehicle).values(vehiclesData);
  console.log(`  ✅ ${vehiclesData.length} kendaraan berhasil dibuat`);

  // ── 3. Seed Drivers ──
  console.log('\n🧑‍✈️ Creating drivers...');

  const driversData = [
    { id: 'd1', name: 'Pak Budi Santoso', noHP: '08111111111', status: 'Tersedia' as const, simJenis: 'SIM A', simExpiry: '2027-03-15', foto: null },
    { id: 'd2', name: 'Pak Arif Rahman', noHP: '08222222222', status: 'Bertugas' as const, simJenis: 'SIM A', simExpiry: '2026-12-20', foto: null },
    { id: 'd3', name: 'Pak Yudi Haryanto', noHP: '08333333333', status: 'Libur' as const, simJenis: 'SIM A & C', simExpiry: '2027-06-10', foto: null },
  ];

  await db.insert(driver).values(driversData);
  console.log(`  ✅ ${driversData.length} pengemudi berhasil dibuat`);

  // ── 4. Seed Bookings (1 - 15 Mei 2026) ──
  console.log('\n📋 Creating bookings (1 - 15 Mei 2026)...');

  const bookingsData = [
    // Completed (1-8 May)
    {
      id: 'b1', userId: u1, vehicleId: 'v3', driverId: 'd1', jenisKendaraan: 'Mobil' as const,
      startTime: createMayDate(2, 8), endTime: createMayDate(2, 16),
      keperluan: 'Penyampaian SP2DK ke PT Sawit Mandiri', jumlahPenumpang: 3,
      perluSopir: true, status: 'Selesai' as const, odometerStart: 56000, odometerEnd: 56120,
      kondisiBBM: 'Penuh', kondisiKebersihan: 'Bersih', catatan: 'Perjalanan aman'
    },
    {
      id: 'b2', userId: u4, vehicleId: 'v4', jenisKendaraan: 'Motor' as const,
      startTime: createMayDate(5, 9), endTime: createMayDate(5, 11),
      keperluan: 'Antar Surat Paksa ke WP perorangan', jumlahPenumpang: 1,
      perluSopir: false, status: 'Selesai' as const, odometerStart: 12000, odometerEnd: 12015,
      kondisiBBM: '1/2', kondisiKebersihan: 'Bersih',
    },
    {
      id: 'b3', userId: u3, vehicleId: 'v1', jenisKendaraan: 'Mobil' as const,
      startTime: createMayDate(7, 8), endTime: createMayDate(7, 17),
      keperluan: 'Kunjungan Lapangan Penilaian Aset', jumlahPenumpang: 4,
      perluSopir: false, status: 'Selesai' as const, odometerStart: 15100, odometerEnd: 15200,
    },
    // Completed With Notes
    {
      id: 'b4', userId: u1, vehicleId: 'v2', driverId: 'd2', jenisKendaraan: 'Mobil' as const,
      startTime: createMayDate(8, 8), endTime: createMayDate(8, 15),
      keperluan: 'Edukasi Perpajakan di Desa Binaan', jumlahPenumpang: 5,
      perluSopir: true, status: 'Selesai dengan Catatan' as const, odometerStart: 28000, odometerEnd: 28100,
    },
    // Cancelled / Rejected (Past)
    {
      id: 'b5', userId: u4, vehicleId: 'v1', jenisKendaraan: 'Mobil' as const,
      startTime: createMayDate(9, 10), endTime: createMayDate(9, 12),
      keperluan: 'Meeting dengan Pemda', jumlahPenumpang: 2,
      perluSopir: false, status: 'Ditolak' as const, alasanPenolakan: 'Kendaraan sudah dipakai AR lain'
    },

    // Ongoing (10 May - Today! Assuming script runs exactly on May 10th)
    {
      id: 'b6', userId: u3, vehicleId: 'v1', driverId: 'd2', jenisKendaraan: 'Mobil' as const,
      startTime: createMayDate(10, 8), endTime: createMayDate(10, 14), 
      keperluan: 'Pemeriksaan Lapangan PT Agro Nusantara', jumlahPenumpang: 3,
      perluSopir: true, status: 'Berlangsung' as const, odometerStart: 15230,
    },

    // Approved
    {
      id: 'b7', userId: u1, vehicleId: 'v2', jenisKendaraan: 'Mobil' as const,
      startTime: createMayDate(10, 15), endTime: createMayDate(10, 17),
      keperluan: 'Ke Bank Setor Tunai Penerimaan', jumlahPenumpang: 2,
      perluSopir: false, status: 'Disetujui' as const,
    },
    {
      id: 'b8', userId: u4, vehicleId: 'v3', jenisKendaraan: 'Mobil' as const,
      startTime: createMayDate(11, 8), endTime: createMayDate(11, 16),
      keperluan: 'Konsultasi Wajib Pajak di Wundulako', jumlahPenumpang: 4,
      perluSopir: false, status: 'Disetujui' as const,
    },
    {
      id: 'b9', userId: u1, vehicleId: 'v5', jenisKendaraan: 'Motor' as const,
      startTime: createMayDate(12, 9), endTime: createMayDate(12, 11),
      keperluan: 'Koordinasi ke KPPN', jumlahPenumpang: 1,
      perluSopir: false, status: 'Disetujui' as const,
    },

    // Pending
    {
      id: 'b10', userId: u3, vehicleId: 'v2', jenisKendaraan: 'Mobil' as const,
      startTime: createMayDate(13, 8), endTime: createMayDate(14, 17),
      keperluan: 'Dinas Luar Kota Kendari (Kanwil)', jumlahPenumpang: 2,
      perluSopir: false, status: 'Pending' as const, catatan: 'Mohon persetujuan 2 hari'
    },
    {
      id: 'b11', userId: u4, jenisKendaraan: 'Mobil' as const, 
      startTime: createMayDate(15, 10), endTime: createMayDate(15, 14),
      keperluan: 'Kegiatan Sita Aset', jumlahPenumpang: 3,
      perluSopir: false, status: 'Pending' as const,
    },

    // Dibatalkan
    {
      id: 'b12', userId: u2, vehicleId: 'v2', jenisKendaraan: 'Mobil' as const,
      startTime: createMayDate(14, 8), endTime: createMayDate(14, 12),
      keperluan: 'Sosialisasi PPS Batal', jumlahPenumpang: 1,
      perluSopir: false, status: 'Dibatalkan' as const, catatan: 'Saya batalkan karena jadwal sosialisasi ditunda'
    },
  ];

  await db.insert(booking).values(bookingsData);
  console.log(`  ✅ ${bookingsData.length} peminjaman dummy berhasil dibuat`);

  // ── 5. Seed Review ──
  console.log('\n📝 Creating reviews...');

  await db.insert(bookingReview).values({
    bookingId: 'b4',
    reviewNotes: 'Bodi kiri agak tergores karena ranting pohon, perlu dipoles.',
    isNew: true,
  });

  console.log('  ✅ 1 review berhasil dibuat');

  console.log('\n✨ Seeding complete!\n');
  
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
