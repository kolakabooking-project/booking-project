import { getSheetData, invalidateCache } from '../lib/google-sheets.js';
export { invalidateCache };

// ─── Interfaces ───

export interface AgendaST {
  nomorSpd: number;
  noUrut: number;
  tanggalPembuatan: string;
  nip: string;
  namaPegawai: string;
  nomorST: string;
  tanggalSurat: string;
  perihalSurat: string;
  perihalKegiatan: string;
  berangkatDari: string;
  wilayahTugas: string;
  jumlahHariST: number;
  jumlahHariSPD: number;
  tanggalAkhir: string;
  tanggalBerangkat: string;
  tanggalKembali: string;
  keterangan: string;
  spdStatus: string;
  inputSikka: string;
}

export interface RekapSPD {
  nomorSpd: number;
  nomorPegawai: number;
  nip: string;
  namaPegawai: string;
  wilayahTugas: string;
  nomorST: string;
  tanggalST: string;
  perihalTugas: string;
  jumlahHariSpd: string;
  jumlahHariSpdNumeric: number;
  tanggalMulai: string;
  tanggalAkhir: string;
  tanggalDitetapkan: string;
}

export interface JadwalJumat {
  no: number;
  nama: string;
  nip: string;
  pangkatGolongan: string;
  jabatan: string;
  tipe: 'WFO' | 'WFH';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  uniqueWilayah?: string[];
}

export interface SPDSummary {
  totalSpd: number;
  totalHariPerjalanan: number;
  jumlahWilayah: number;
  inputSikkaSelesai: number;
  totalSpdBulanIni: number;
}

export interface ActiveST {
  namaPegawai: string;
  wilayahTugas: string;
  tanggalBerangkat: string;
  tanggalKembali: string;
}

// ─── Helpers ───

function isValidRow(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed !== '' && trimmed !== '#N/A' && trimmed !== '0' && trimmed !== '#REF!';
}

function safeInt(value: string | undefined): number {
  if (!value) return 0;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function safeStr(value: string | undefined): string {
  return value?.trim() || '';
}

/**
 * Parse Indonesian month date strings to check if within current month.
 * Format: "dd mmmm yyyy" (e.g. "05 Januari 2026")
 */
const MONTHS_ID: Record<string, number> = {
  januari: 0, februari: 1, maret: 2, april: 3,
  mei: 4, juni: 5, juli: 6, agustus: 7,
  september: 8, oktober: 9, november: 10, desember: 11,
};

function parseIndonesianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const str = dateStr.trim();
  
  // Try Indonesian format: "05 Januari 2026"
  const parts = str.toLowerCase().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const month = MONTHS_ID[parts[1]];
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Try standard JS format: "4/19/2026", "2026-06-03", etc
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

function isCurrentMonth(dateStr: string): boolean {
  const date = parseIndonesianDate(dateStr);
  if (!date) return false;
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

// ─── Service Functions ───

interface SheetFilters {
  userName?: string;
  search?: string;
  wilayah?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch and transform Agenda Surat Tugas data.
 * Sheet has 2 header rows — data starts at row 3.
 * Columns A-S (19 columns).
 */
export async function getAgendaSuratTugas(filters: SheetFilters = {}): Promise<PaginatedResult<AgendaST>> {
  const { userName, search, wilayah, page = 1, limit = 20 } = filters;

  // Read from row 3 onwards (skip 2 header rows)
  const rawData = await getSheetData('Agenda Surat Tugas', 'A3:S');

  // Transform and filter
  let records: AgendaST[] = rawData
    .filter((row) => isValidRow(row[4])) // col E = namaPegawai must be valid
    .map((row) => ({
      nomorSpd: safeInt(row[0]),
      noUrut: safeInt(row[1]),
      tanggalPembuatan: safeStr(row[2]),
      nip: safeStr(row[3]),
      namaPegawai: safeStr(row[4]),
      nomorST: safeStr(row[5]),
      tanggalSurat: safeStr(row[6]),
      perihalSurat: safeStr(row[7]),
      perihalKegiatan: safeStr(row[8]),
      berangkatDari: safeStr(row[9]),
      wilayahTugas: safeStr(row[10]),
      jumlahHariST: safeInt(row[11]),
      jumlahHariSPD: safeInt(row[12]),
      tanggalAkhir: safeStr(row[13]),
      tanggalBerangkat: safeStr(row[14]),
      tanggalKembali: safeStr(row[15]),
      keterangan: safeStr(row[16]),
      spdStatus: safeStr(row[17]),
      inputSikka: safeStr(row[18]),
    }))
    .reverse(); // Sort from newest to oldest

  // Apply userName filter (user-specific data)
  if (userName) {
    records = records.filter((r) => r.namaPegawai.toLowerCase().includes(userName.toLowerCase()));
  }

  // Apply search filter
  if (search) {
    const q = search.toLowerCase();
    records = records.filter(
      (r) =>
        r.namaPegawai.toLowerCase().includes(q) ||
        r.nomorST.toLowerCase().includes(q) ||
        r.perihalKegiatan.toLowerCase().includes(q) ||
        r.wilayahTugas.toLowerCase().includes(q)
    );
  }

  // Calculate unique wilayah from records before applying wilayah filter
  const uniqueWilayah = Array.from(new Set(records.map((r) => r.wilayahTugas).filter(Boolean))).sort();

  // Apply wilayah filter
  if (wilayah) {
    records = records.filter((r) => r.wilayahTugas.toLowerCase() === wilayah.toLowerCase());
  }

  // Paginate
  const total = records.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = records.slice(start, start + limit);

  return { data, total, page, totalPages, uniqueWilayah };
}

/**
 * Fetch and transform Rekap SPD data.
 * Sheet has 1 header row — data starts at row 2.
 * Columns A-M (13 columns, M is duplicate of A).
 */
export async function getRekapSPD(filters: SheetFilters = {}): Promise<PaginatedResult<RekapSPD>> {
  const { userName, search, wilayah, page = 1, limit = 20 } = filters;

  // Read from row 2 onwards (skip 1 header row)
  const rawData = await getSheetData('Rekap SPD', 'A2:M');

  // Transform and filter
  let records: RekapSPD[] = rawData
    .filter((row) => {
      if (!isValidRow(row[3])) return false; // col D = namaPegawai
      // Filter out placeholder dates
      if (row[9]?.includes('00 Januari 1900')) return false;
      return true;
    })
    .map((row) => ({
      nomorSpd: safeInt(row[0]),
      nomorPegawai: safeInt(row[1]),
      nip: safeStr(row[2]),
      namaPegawai: safeStr(row[3]),
      wilayahTugas: safeStr(row[4]),
      nomorST: safeStr(row[5]),
      tanggalST: safeStr(row[6]),
      perihalTugas: safeStr(row[7]),
      jumlahHariSpd: safeStr(row[8]),
      jumlahHariSpdNumeric: parseInt(row[8] || '0', 10) || 0, // "5 (lima) hari" → 5
      tanggalMulai: safeStr(row[9]),
      tanggalAkhir: safeStr(row[10]),
      tanggalDitetapkan: safeStr(row[11]),
    }))
    .reverse(); // Sort from newest to oldest

  // Apply userName filter
  if (userName) {
    records = records.filter((r) => r.namaPegawai.toLowerCase().includes(userName.toLowerCase()));
  }

  // Apply search filter
  if (search) {
    const q = search.toLowerCase();
    records = records.filter(
      (r) =>
        r.namaPegawai.toLowerCase().includes(q) ||
        r.nomorST.toLowerCase().includes(q) ||
        r.perihalTugas.toLowerCase().includes(q) ||
        r.wilayahTugas.toLowerCase().includes(q) ||
        String(r.nomorSpd).includes(q)
    );
  }

  // Calculate unique wilayah from records before applying wilayah filter
  const uniqueWilayah = Array.from(new Set(records.map((r) => r.wilayahTugas).filter(Boolean))).sort();

  // Apply wilayah filter
  if (wilayah) {
    records = records.filter((r) => r.wilayahTugas.toLowerCase() === wilayah.toLowerCase());
  }

  // Paginate
  const total = records.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = records.slice(start, start + limit);

  return { data, total, page, totalPages, uniqueWilayah };
}

/**
 * Get SPD summary aggregation — optimized to work directly from raw sheet data.
 * Avoids the overhead of full transform + pagination via getRekapSPD/getAgendaSuratTugas.
 * Optionally filtered by userName for user-specific summaries.
 */
export async function getSPDSummary(userName?: string): Promise<SPDSummary> {
  // Fetch raw data directly — skip transform + pagination overhead
  const [rawRekap, rawAgenda] = await Promise.all([
    getSheetData('Rekap SPD', 'A2:M'),
    getSheetData('Agenda Surat Tugas', 'A3:S'),
  ]);

  // Lightweight aggregation directly from raw data
  let totalSpd = 0;
  let totalHari = 0;
  let spdBulanIni = 0;
  const wilayahSet = new Set<string>();

  for (const row of rawRekap) {
    if (!isValidRow(row[3])) continue; // col D = namaPegawai
    if (row[9]?.includes('00 Januari 1900')) continue; // placeholder date
    if (userName && !row[3]?.toLowerCase().includes(userName.toLowerCase())) continue;

    totalSpd++;
    totalHari += parseInt(row[8] || '0', 10) || 0;
    const wilayah = row[4]?.trim();
    if (wilayah) wilayahSet.add(wilayah);
    if (isCurrentMonth(row[9]?.trim() || '')) spdBulanIni++;
  }

  let sikkaSelesai = 0;
  for (const row of rawAgenda) {
    if (!isValidRow(row[4])) continue; // col E = namaPegawai
    if (userName && !row[4]?.toLowerCase().includes(userName.toLowerCase())) continue;
    if (row[18]?.trim() === 'SUDAH') sikkaSelesai++;
  }

  return {
    totalSpd,
    totalHariPerjalanan: totalHari,
    jumlahWilayah: wilayahSet.size,
    inputSikkaSelesai: sikkaSelesai,
    totalSpdBulanIni: spdBulanIni,
  };
}

/**
 * Fetch and transform Jadwal Jumat data (WFO and WFH).
 * Sheets 'WFO' and 'WFH' have 1 header row — data starts at row 2.
 * Columns A-E (5 columns: No, Nama, NIP, Pangkat/Golongan, Jabatan).
 */
export async function getJadwalJumat(filters: SheetFilters = {}): Promise<PaginatedResult<JadwalJumat>> {
  const { search, page = 1, limit = 20 } = filters;

  // Fetch both sheets concurrently
  const [wfoData, wfhData] = await Promise.all([
    getSheetData('WFO', 'A2:E').catch(() => [] as string[][]),
    getSheetData('WFH', 'A2:E').catch(() => [] as string[][]),
  ]);

  // Transform WFO
  const wfoRecords: JadwalJumat[] = wfoData
    .filter((row) => isValidRow(row[1])) // Col B = Nama
    .map((row) => ({
      no: safeInt(row[0]),
      nama: safeStr(row[1]),
      nip: safeStr(row[2]),
      pangkatGolongan: safeStr(row[3]),
      jabatan: safeStr(row[4]),
      tipe: 'WFO',
    }));

  // Transform WFH
  const wfhRecords: JadwalJumat[] = wfhData
    .filter((row) => isValidRow(row[1])) // Col B = Nama
    .map((row) => ({
      no: safeInt(row[0]),
      nama: safeStr(row[1]),
      nip: safeStr(row[2]),
      pangkatGolongan: safeStr(row[3]),
      jabatan: safeStr(row[4]),
      tipe: 'WFH',
    }));

  // Combine
  let records = [...wfoRecords, ...wfhRecords];

  // Apply search filter
  if (search) {
    const q = search.toLowerCase();
    records = records.filter(
      (r) =>
        r.nama.toLowerCase().includes(q) ||
        r.nip.toLowerCase().includes(q) ||
        r.jabatan.toLowerCase().includes(q) ||
        r.tipe.toLowerCase().includes(q)
    );
  }

  // Paginate
  const total = records.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = records.slice(start, start + limit);

  return { data, total, page, totalPages };
}

/**
 * Fetch list of users currently on ST today.
 * Unfiltered by user role so everyone can see who is out of office.
 */
export async function getActiveSTToday(): Promise<ActiveST[]> {
  // Use Rekap SPD instead of Agenda Surat Tugas because it's more up-to-date and matches the Monitoring table
  const rawRekap = await getSheetData('Rekap SPD', 'A2:M');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const active: ActiveST[] = [];

  for (const row of rawRekap) {
    if (!isValidRow(row[3])) continue; // col D = namaPegawai

    const berangkatStr = safeStr(row[9]); // col J = Tgl Mulai
    const kembaliStr = safeStr(row[10]); // col K = Tgl Akhir

    if (!berangkatStr || !kembaliStr) continue;
    if (berangkatStr.includes('1900')) continue; // Skip placeholder dates

    const berangkatDate = parseIndonesianDate(berangkatStr);
    const kembaliDate = parseIndonesianDate(kembaliStr);

    if (!berangkatDate || !kembaliDate) continue;

    berangkatDate.setHours(0, 0, 0, 0);
    kembaliDate.setHours(0, 0, 0, 0);

    if (today >= berangkatDate && today <= kembaliDate) {
      active.push({
        namaPegawai: safeStr(row[3]),
        wilayahTugas: safeStr(row[4]),
        tanggalBerangkat: berangkatStr,
        tanggalKembali: kembaliStr,
      });
    }
  }

  return active;
}

/**
 * Consolidated dashboard data — single call replaces 3-4 separate calls.
 * Returns summary + recent SPD + recent perjadin + active ST today.
 */
export async function getTrackingDashboard(userName?: string): Promise<{
  summary: SPDSummary;
  recentSPD: RekapSPD[];
  recentPerjadin: AgendaST[];
  activeSTToday: ActiveST[];
}> {
  const [summary, recentSPDResult, recentPerjadinResult, activeSTToday] = await Promise.all([
    getSPDSummary(userName),
    getRekapSPD({ userName, page: 1, limit: 5 }),
    getAgendaSuratTugas({ userName, page: 1, limit: 5 }),
    getActiveSTToday(), // Always fetches all users
  ]);

  return {
    summary,
    recentSPD: recentSPDResult.data,
    recentPerjadin: recentPerjadinResult.data,
    activeSTToday,
  };
}

/**
 * Refresh all cached sheet data.
 * Now async because Redis operations are async.
 */
export async function refreshCache(): Promise<void> {
  await invalidateCache();
}
