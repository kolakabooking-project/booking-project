import { getSheetData, invalidateCache } from '../lib/google-sheets.js';
import { db } from '../config/db.js';
import { user } from '../db/schema.js';
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

export interface UserIdentifier {
  name?: string;
  nip?: string;
  nipPanjang?: string;
}

export interface PegawaiCuti {
  no: number;
  namaPegawai: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  lamaCuti: number;
}

export interface ActiveCuti {
  namaPegawai: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  lamaCuti: number;
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
 * Clean up name for fuzzy/normalized comparison:
 * 1. Takes the base name before commas or titles (e.g., "Mita Widyastuti, S.E." -> "Mita Widyastuti")
 * 2. Removes common Indonesian prefixes (e.g. Drs., Dra., Ir., H., Hj.)
 * 3. Removes all non-alphanumeric characters and converts to lowercase.
 */
export function cleanNameForMatch(name: string): string {
  if (!name) return '';
  let base = name.split(',')[0].trim();
  base = base.replace(/^(drs\.|dra\.|ir\.|h\.|hj\.)\s+/i, '');
  base = base.toLowerCase().replace(/[^a-z0-9]/g, '');
  // Normalize known spelling variations across sheets and DB
  base = base.replace(/iswahyudi/g, 'iswayudi');
  return base;
}

function cleanDigits(s: string | undefined): string {
  if (!s) return '';
  return s.replace(/[^0-9]/g, '');
}

/**
 * Checks if a sheet row belongs to the given user by matching:
 * 1. Normalized Name (handles titles, punctuation, substrings)
 * 2. NIP (9-digit nip or 18-digit nipPanjang if present in any row cell)
 */
export function isUserMatch(
  rowNamaPegawai: string,
  user?: UserIdentifier | string,
  extraRowContent?: string
): boolean {
  if (!user) return true; // If no user filter, match all

  const userObj: UserIdentifier = typeof user === 'string' ? { name: user } : user;
  const userClean = cleanNameForMatch(userObj.name || '');
  const rowClean = cleanNameForMatch(rowNamaPegawai);

  // 1. Name Match
  if (userClean && rowClean) {
    if (
      userClean === rowClean ||
      (userClean.length >= 4 && rowClean.includes(userClean)) ||
      (rowClean.length >= 4 && userClean.includes(rowClean))
    ) {
      return true;
    }
  }

  // 2. NIP Match (checks if user's NIP / NIP Panjang appears in rowNamaPegawai or extra row text)
  const userNip = cleanDigits(userObj.nip);
  const userNipPanjang = cleanDigits(userObj.nipPanjang);

  const fullRowStr = `${rowNamaPegawai} ${extraRowContent || ''}`;
  const rowDigits = cleanDigits(fullRowStr);

  if (userNip && userNip.length >= 8 && rowDigits.includes(userNip)) {
    return true;
  }
  if (userNipPanjang && userNipPanjang.length >= 15 && rowDigits.includes(userNipPanjang)) {
    return true;
  }

  return false;
}

/**
 * Normalizes a Surat Tugas number for comparison across sheets.
 * Strips whitespace, punctuation, and converts to lowercase.
 */
export function cleanNomorST(st: string | undefined): string {
  if (!st) return '';
  return st.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Builds a date resolver function from 'Agenda Surat Tugas' data.
 * Maps 'Tanggal Surat' (column F / index 5) so that Rekap SPD's 'tanggalDitetapkan'
 * is sourced directly from Agenda Surat Tugas instead of the outdated column in Rekap SPD.
 */
export function createAgendaSTDateResolver(agendaRows: string[][]) {
  // Map by normalized nomorST -> tanggalSurat
  const dateByST = new Map<string, string>();
  // Map by (normalized nomorST + normalized namaPegawai) -> tanggalSurat
  const dateBySTAndName = new Map<string, string>();
  // Map by (nomorSpd + normalized namaPegawai) -> tanggalSurat
  const dateBySpdAndName = new Map<string, string>();

  for (const row of agendaRows) {
    const nomorSpd = safeInt(row[0]);
    const namaPegawai = safeStr(row[3]);
    const nomorST = safeStr(row[4]);
    const tanggalSurat = safeStr(row[5]);

    // Validate that tanggalSurat is not empty or placeholder
    if (
      !tanggalSurat ||
      tanggalSurat === '-' ||
      tanggalSurat === '0' ||
      tanggalSurat.startsWith('#') ||
      tanggalSurat.includes('1900')
    ) {
      continue;
    }

    const stKey = cleanNomorST(nomorST);
    const nameKey = cleanNameForMatch(namaPegawai);

    if (stKey && stKey.length > 2 && stKey !== '0') {
      if (!dateByST.has(stKey)) {
        dateByST.set(stKey, tanggalSurat);
      }
    }

    if (stKey && nameKey) {
      dateBySTAndName.set(`${stKey}_${nameKey}`, tanggalSurat);
    }

    if (nomorSpd > 0 && nameKey) {
      dateBySpdAndName.set(`${nomorSpd}_${nameKey}`, tanggalSurat);
    }
  }

  return (nomorSpd: number, namaPegawai: string, nomorST: string, fallbackDate: string): string => {
    const stKey = cleanNomorST(nomorST);
    const nameKey = cleanNameForMatch(namaPegawai);

    // 1. Try matching by ST number and employee name
    if (stKey && nameKey) {
      const match = dateBySTAndName.get(`${stKey}_${nameKey}`);
      if (match) return match;
    }

    // 2. Try matching by ST number alone (all employees on the same ST share the same ST date)
    if (stKey && stKey.length > 2 && stKey !== '0') {
      const match = dateByST.get(stKey);
      if (match) return match;
    }

    // 3. Try matching by nomorSpd + employee name
    if (nomorSpd > 0 && nameKey) {
      const match = dateBySpdAndName.get(`${nomorSpd}_${nameKey}`);
      if (match) return match;
    }

    // Fallback to original Rekap SPD row[10] value (cleaning any placeholder values)
    if (fallbackDate.includes('1900') || fallbackDate.startsWith('#')) {
      return '';
    }
    return fallbackDate;
  };
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
  user?: UserIdentifier;
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
  const { user, userName, search, wilayah, page = 1, limit = 20 } = filters;

  // Read from row 3 onwards (skip 2 header rows)
  const rawData = await getSheetData('Agenda Surat Tugas', 'A3:S');

  // Transform and filter
  let records: AgendaST[] = rawData
    .filter((row) => isValidRow(row[3])) // col D = namaPegawai must be valid
    .map((row) => ({
      nomorSpd: safeInt(row[0]),
      noUrut: safeInt(row[1]),
      tanggalPembuatan: safeStr(row[2]),
      nip: '', // NIP column deleted
      namaPegawai: safeStr(row[3]),
      nomorST: safeStr(row[4]),
      tanggalSurat: safeStr(row[5]),
      perihalSurat: safeStr(row[6]),
      perihalKegiatan: safeStr(row[7]),
      berangkatDari: safeStr(row[8]),
      wilayahTugas: safeStr(row[9]),
      jumlahHariST: safeInt(row[10]),
      jumlahHariSPD: safeInt(row[11]),
      tanggalAkhir: safeStr(row[12]),
      tanggalBerangkat: safeStr(row[13]),
      tanggalKembali: safeStr(row[14]),
      keterangan: safeStr(row[15]),
      spdStatus: safeStr(row[16]),
      inputSikka: safeStr(row[17]),
    }))
    .reverse(); // Sort from newest to oldest

  // Apply user filter (user-specific data matching by name and NIP)
  const targetUser = user || (userName ? { name: userName } : undefined);
  if (targetUser) {
    records = records.filter((r) => isUserMatch(r.namaPegawai, targetUser, `${r.nomorST} ${r.nip} ${r.perihalKegiatan}`));
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
  const { user, userName, search, wilayah, page = 1, limit = 20 } = filters;

  // Read Rekap SPD (data starts row 2) and Agenda Surat Tugas (data starts row 3) concurrently
  const [rawData, agendaRawData] = await Promise.all([
    getSheetData('Rekap SPD', 'A2:M'),
    getSheetData('Agenda Surat Tugas', 'A3:S').catch((err) => {
      console.error('[SHEETS] Error loading Agenda Surat Tugas for date mapping in getRekapSPD:', err);
      return [] as string[][];
    }),
  ]);

  const resolveTanggalDitetapkan = createAgendaSTDateResolver(agendaRawData);

  // Transform and filter
  let records: RekapSPD[] = rawData
    .filter((row) => {
      if (!isValidRow(row[2])) return false; // col C = namaPegawai
      // Filter out placeholder dates
      if (row[8]?.includes('00 Januari 1900')) return false;
      return true;
    })
    .map((row) => {
      const spdNum = safeInt(row[0]);
      const namaPegawai = safeStr(row[2]);
      const nomorST = safeStr(row[4]);
      const fallbackDate = safeStr(row[10]);

      return {
        nomorSpd: spdNum,
        nomorPegawai: safeInt(row[1]),
        nip: '', // NIP column deleted
        namaPegawai,
        wilayahTugas: safeStr(row[3]),
        nomorST,
        tanggalST: safeStr(row[5]),
        perihalTugas: safeStr(row[6]),
        jumlahHariSpd: safeStr(row[7]),
        jumlahHariSpdNumeric: parseInt(row[7] || '0', 10) || 0, // "5 (lima) hari" → 5
        tanggalMulai: safeStr(row[8]),
        tanggalAkhir: safeStr(row[9]),
        tanggalDitetapkan: resolveTanggalDitetapkan(spdNum, namaPegawai, nomorST, fallbackDate),
      };
    })
    .reverse(); // Sort from newest to oldest

  // Apply user filter (matching by name and NIP)
  const targetUser = user || (userName ? { name: userName } : undefined);
  if (targetUser) {
    records = records.filter((r) => isUserMatch(r.namaPegawai, targetUser, `${r.nomorST} ${r.nip} ${r.nomorPegawai}`));
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
 * Optionally filtered by user for user-specific summaries.
 */
export async function getSPDSummary(user?: UserIdentifier | string): Promise<SPDSummary> {
  const targetUser = typeof user === 'string' ? { name: user } : user;

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
    if (!isValidRow(row[2])) continue; // col C = namaPegawai
    if (row[8]?.includes('00 Januari 1900')) continue; // placeholder date
    if (targetUser && !isUserMatch(row[2], targetUser, `${row[0]} ${row[1]} ${row[4]}`)) continue;

    totalSpd++;
    totalHari += parseInt(row[7] || '0', 10) || 0;
    const wilayah = row[3]?.trim();
    if (wilayah) wilayahSet.add(wilayah);
    if (isCurrentMonth(row[8]?.trim() || '')) spdBulanIni++;
  }

  let sikkaSelesai = 0;
  for (const row of rawAgenda) {
    if (!isValidRow(row[3])) continue; // col D = namaPegawai
    if (targetUser && !isUserMatch(row[3], targetUser, `${row[0]} ${row[4]}`)) continue;
    if (row[17]?.trim() === 'SUDAH') sikkaSelesai++;
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
 * Fetch and transform Pegawai Cuti data with smart status & chronological sorting.
 * Priority order:
 * 1. Sedang Cuti (active today) -> ending soonest first
 * 2. Akan Datang (upcoming leave) -> starting soonest first
 * 3. Selesai (past leave) -> most recently ended first
 */
export async function getPegawaiCuti(filters: SheetFilters = {}): Promise<PaginatedResult<PegawaiCuti>> {
  const { user, userName, search, page = 1, limit = 20 } = filters;

  const rawData = await getSheetData('Pegawai Cuti', 'A2:E').catch(() => [] as string[][]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let records: PegawaiCuti[] = rawData
    .filter((row) => isValidRow(row[1])) // col B = Nama Pegawai must be valid
    .map((row) => ({
      no: safeInt(row[0]),
      namaPegawai: safeStr(row[1]),
      tanggalMulai: safeStr(row[2]),
      tanggalSelesai: safeStr(row[3]),
      lamaCuti: safeInt(row[4]),
    }));

  // Apply user filter (user-specific data matching by name and NIP)
  const targetUser = user || (userName ? { name: userName } : undefined);
  if (targetUser) {
    records = records.filter((r) => isUserMatch(r.namaPegawai, targetUser));
  }

  // Smart sort by status and chronology
  records.sort((a, b) => {
    const startA = parseIndonesianDate(a.tanggalMulai);
    const endA = parseIndonesianDate(a.tanggalSelesai);
    const startB = parseIndonesianDate(b.tanggalMulai);
    const endB = parseIndonesianDate(b.tanggalSelesai);

    if (startA) startA.setHours(0, 0, 0, 0);
    if (endA) endA.setHours(0, 0, 0, 0);
    if (startB) startB.setHours(0, 0, 0, 0);
    if (endB) endB.setHours(0, 0, 0, 0);

    const getPriority = (start: Date | null, end: Date | null) => {
      if (!start || !end) return { prio: 4, val: 0 };
      if (today >= start && today <= end) {
        return { prio: 1, val: end.getTime() }; // Sedang cuti: ending soonest
      } else if (today < start) {
        return { prio: 2, val: start.getTime() }; // Akan datang: starting soonest
      } else {
        return { prio: 3, val: -end.getTime() }; // Selesai: most recently ended
      }
    };

    const pa = getPriority(startA, endA);
    const pb = getPriority(startB, endB);

    if (pa.prio !== pb.prio) return pa.prio - pb.prio;
    if (pa.val !== pb.val) return pa.val - pb.val;
    return a.namaPegawai.localeCompare(b.namaPegawai);
  });

  // Re-assign sequential number
  records.forEach((r, idx) => {
    r.no = idx + 1;
  });

  // Apply search filter
  if (search) {
    const q = search.toLowerCase();
    records = records.filter(
      (r) =>
        r.namaPegawai.toLowerCase().includes(q) ||
        r.tanggalMulai.toLowerCase().includes(q) ||
        r.tanggalSelesai.toLowerCase().includes(q)
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
    if (!isValidRow(row[2])) continue; // col C = namaPegawai

    const berangkatStr = safeStr(row[8]); // col I = Tgl Mulai
    const kembaliStr = safeStr(row[9]); // col J = Tgl Akhir

    if (!berangkatStr || !kembaliStr) continue;
    if (berangkatStr.includes('1900')) continue; // Skip placeholder dates

    const berangkatDate = parseIndonesianDate(berangkatStr);
    const kembaliDate = parseIndonesianDate(kembaliStr);

    if (!berangkatDate || !kembaliDate) continue;

    berangkatDate.setHours(0, 0, 0, 0);
    kembaliDate.setHours(0, 0, 0, 0);

    const nomorSTStr = safeStr(row[4]); // col E = nomorST
    if (nomorSTStr.toUpperCase().includes('BATAL')) continue;

    if (today >= berangkatDate && today <= kembaliDate) {
      active.push({
        namaPegawai: safeStr(row[2]),
        wilayahTugas: safeStr(row[3]),
        tanggalBerangkat: berangkatStr,
        tanggalKembali: kembaliStr,
      });
    }
  }

  // Sort by namaPegawai alphabetically
  active.sort((a, b) => a.namaPegawai.localeCompare(b.namaPegawai));

  return active;
}

/**
 * Fetch list of users currently on Leave (Cuti) today.
 * Sorted by ending date (ending soonest first), then by employee name.
 */
export async function getActiveCutiToday(): Promise<ActiveCuti[]> {
  const rawData = await getSheetData('Pegawai Cuti', 'A2:E').catch(() => [] as string[][]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const active: ActiveCuti[] = [];

  for (const row of rawData) {
    if (!isValidRow(row[1])) continue; // col B = Nama Pegawai

    const mulaiStr = safeStr(row[2]);
    const selesaiStr = safeStr(row[3]);

    if (!mulaiStr || !selesaiStr) continue;

    const mulaiDate = parseIndonesianDate(mulaiStr);
    const selesaiDate = parseIndonesianDate(selesaiStr);

    if (!mulaiDate || !selesaiDate) continue;

    mulaiDate.setHours(0, 0, 0, 0);
    selesaiDate.setHours(0, 0, 0, 0);

    if (today >= mulaiDate && today <= selesaiDate) {
      active.push({
        namaPegawai: safeStr(row[1]),
        tanggalMulai: mulaiStr,
        tanggalSelesai: selesaiStr,
        lamaCuti: safeInt(row[4]),
      });
    }
  }

  // Sort active leave: ending soonest first, tie-break by name
  active.sort((a, b) => {
    const endA = parseIndonesianDate(a.tanggalSelesai)?.getTime() || 0;
    const endB = parseIndonesianDate(b.tanggalSelesai)?.getTime() || 0;
    if (endA !== endB) return endA - endB;
    return a.namaPegawai.localeCompare(b.namaPegawai);
  });

  return active;
}

/**
 * Consolidated dashboard data — single call replaces multiple separate calls.
 * Returns summary + recent SPD + recent perjadin + active ST today + active cuti today.
 */
export async function getTrackingDashboard(user?: UserIdentifier | string): Promise<{
  summary: SPDSummary;
  recentSPD: RekapSPD[];
  recentPerjadin: AgendaST[];
  activeSTToday: ActiveST[];
  activeCutiToday: ActiveCuti[];
}> {
  const targetUser = typeof user === 'string' ? { name: user } : user;

  const [summary, recentSPDResult, recentPerjadinResult, activeSTToday, activeCutiToday] = await Promise.all([
    getSPDSummary(targetUser),
    getRekapSPD({ user: targetUser, page: 1, limit: 5 }),
    getAgendaSuratTugas({ user: targetUser, page: 1, limit: 5 }),
    getActiveSTToday(), // Always fetches all users
    getActiveCutiToday(), // Always fetches all users
  ]);

  return {
    summary,
    recentSPD: recentSPDResult.data,
    recentPerjadin: recentPerjadinResult.data,
    activeSTToday,
    activeCutiToday,
  };
}

export interface EmployeeSPDRanking {
  rank: number;
  namaPegawai: string;
  totalSpd: number;
  totalHari: number;
  wilayahList: string[];
  spdList: RekapSPD[];
}

export interface SectionEmployeeSummary {
  namaPegawai: string;
  totalSpd: number;
  totalHari: number;
}

export interface SectionSPDRanking {
  rank: number;
  seksi: string;
  totalSpd: number;
  totalHari: number;
  jumlahPegawai: number;
  persentaseSpd: number;
  pegawaiList: SectionEmployeeSummary[];
  spdList: RekapSPD[];
}

export interface SPDRankingsResult {
  rankings: EmployeeSPDRanking[];
  sectionRankings: SectionSPDRanking[];
  totalSpdInPeriod: number;
  availableMonths: { value: number; label: string }[];
  availableYears: number[];
  selectedFilter: {
    startMonth?: number;
    endMonth?: number;
    year?: number;
  };
}

export const CORE_SECTIONS = [
  'Subbagian Umum dan Kepatuhan Internal',
  'Seksi Penjaminan Kualitas Data',
  'Seksi Pelayanan',
  'Seksi Pemeriksaan, Penilaian, dan Penagihan',
  'Seksi Pengawasan I',
  'Seksi Pengawasan II',
  'Seksi Pengawasan III',
  'Seksi Pengawasan IV',
  'Seksi Pengawasan V',
] as const;

export function getSectionFromJabatan(jabatan: string | null | undefined): string {
  if (!jabatan) return 'Lainnya';
  const j = jabatan.toLowerCase();

  // Pengawasan I - V (MUST be split as requested)
  if (j.includes('pengawasan iii') || j.includes('pengawasan 3')) return 'Seksi Pengawasan III';
  if (j.includes('pengawasan ii') || j.includes('pengawasan 2')) return 'Seksi Pengawasan II';
  if (j.includes('pengawasan iv') || j.includes('pengawasan 4')) return 'Seksi Pengawasan IV';
  if (j.includes('pengawasan i') || j.includes('pengawasan 1')) return 'Seksi Pengawasan I';
  if (j.includes('pengawasan v') || j.includes('pengawasan 5')) return 'Seksi Pengawasan V';

  // Other Sections / Units
  if (j.includes('penjamin') || j.includes('kualitas data') || j.includes('pkd')) return 'Seksi Penjaminan Kualitas Data';
  if (j.includes('pelayanan') || j.includes('penyuluh')) return 'Seksi Pelayanan';
  if (j.includes('pemeriksaan') || j.includes('penilaian') || j.includes('penagihan') || j.includes('juru sita')) {
    if (j.includes('pemeriksa pajak') && !j.includes('seksi')) {
      return 'Fungsional Pemeriksa Pajak';
    }
    return 'Seksi Pemeriksaan, Penilaian, dan Penagihan';
  }
  if (j.includes('umum') || j.includes('kepatuhan internal') || j.includes('sekretaris') || j.includes('subbag') || j.includes('bendahara') || j.includes('pengemudi') || j.includes('driver')) {
    return 'Subbagian Umum dan Kepatuhan Internal';
  }
  if (j.includes('pemeriksa pajak')) return 'Fungsional Pemeriksa Pajak';
  if (j.includes('kp2kp')) return 'KP2KP';
  if (j.includes('kepala kantor')) return 'Kepala Kantor';

  return 'Lainnya';
}

const COMMON_STOPWORDS = new Set(['muhammad', 'andi', 'laode', 'abdul', 'putra', 'putri', 'utama', 'seksi', 'pelaksana', 'nur']);

const MASTER_EMPLOYEE_SEKSI: Record<string, string> = {
  'helmyafrul': 'Kepala Kantor',
  'idokrishnatitara': 'Seksi Pelayanan',
  'andihafsah': 'Seksi Penjaminan Kualitas Data',
  'bintartoalimudin': 'Seksi Pemeriksaan, Penilaian, dan Penagihan',
  'andiroslina': 'Seksi Pengawasan I',
  'teguhsulistyo': 'Seksi Pengawasan II',
  'edisucipto': 'Seksi Pengawasan III',
  'naali': 'Seksi Pengawasan IV',
  'suhermawanapriyanto': 'Seksi Pengawasan V',
  'gemiwitsnawan': 'Subbagian Umum dan Kepatuhan Internal',
  'yusrinayadi': 'Seksi Pelayanan',
  'fitriasyafitri': 'Seksi Pelayanan',
  'firstarahadatulaisy': 'Seksi Pelayanan',
  'kristianmnathanaelpasaribu': 'Seksi Pelayanan',
  'reginaldieleazarpratama': 'Seksi Pelayanan',
  'bonifasiustodichrisavero': 'Seksi Pelayanan',
  'sarahnabilasalmahadindaputeri': 'Subbagian Umum dan Kepatuhan Internal',
  'bellasagita': 'Subbagian Umum dan Kepatuhan Internal',
  'nandaefriliani': 'Subbagian Umum dan Kepatuhan Internal',
  'almapratiwi': 'Subbagian Umum dan Kepatuhan Internal',
  'ilhamrusady': 'Subbagian Umum dan Kepatuhan Internal',
  'silfiaetikasafitri': 'Subbagian Umum dan Kepatuhan Internal',
  'sukarsi': 'Seksi Penjaminan Kualitas Data',
  'ahmadfikrirafiuddin': 'Seksi Penjaminan Kualitas Data',
  'tyasalifaardayanti': 'Seksi Penjaminan Kualitas Data',
  'danybudisetyawan': 'Seksi Pemeriksaan, Penilaian, dan Penagihan',
  'keziaoliviavalerine': 'Seksi Pemeriksaan, Penilaian, dan Penagihan',
  'anggawahyudi': 'Seksi Pemeriksaan, Penilaian, dan Penagihan',
  'ghufron': 'Seksi Penjaminan Kualitas Data',
  'ghufronrifai': 'Seksi Penjaminan Kualitas Data',
  'farannisaukkizalats': 'Seksi Pengawasan I',
  'tesaradityasaputra': 'Seksi Pengawasan I',
  'suhendrawahyu': 'Seksi Pengawasan I',
  'evanlestyanmahendra': 'Seksi Pengawasan I',
  'kasnawati': 'Seksi Pengawasan I',
  'ayshabilyintifadhaaprisya': 'Seksi Pengawasan II',
  'muhammadtaufik': 'Seksi Pengawasan II',
  'ninarizkiamelia': 'Seksi Pengawasan II',
  'nurfajriirawan': 'Seksi Pengawasan II',
  'ikarantika': 'Seksi Pengawasan II',
  'fitriyaelytafajarini': 'Seksi Pengawasan III',
  'laodeabdulmalikkarim': 'Seksi Pengawasan III',
  'dwisandilestari': 'Seksi Pengawasan III',
  'alifrahardian': 'Seksi Pengawasan III',
  'rusnah': 'Seksi Pengawasan IV',
  'sonyazorayastkhodijah': 'Seksi Pengawasan IV',
  'mitawidyastuti': 'Seksi Pengawasan IV',
  'rachmatnuryadin': 'Seksi Pengawasan IV',
  'untarimurniyati': 'Seksi Pengawasan IV',
  'laodemazun': 'Seksi Pengawasan V',
  'merlynirmayasaputri': 'Seksi Pengawasan V',
  'estikharohseptianingsih': 'Seksi Pengawasan V',
  'retnorachmawati': 'Seksi Pengawasan V',
  'parmenasobajapaguling': 'Seksi Pemeriksaan, Penilaian, dan Penagihan',
  'kalpataru': 'Seksi Pemeriksaan, Penilaian, dan Penagihan',
  'kalpataruamirultainiswayudi': 'Seksi Pemeriksaan, Penilaian, dan Penagihan',
  'kalpataruamirultainiswahyudi': 'Seksi Pemeriksaan, Penilaian, dan Penagihan',
  'nahdliyyatussholichah': 'Subbagian Umum dan Kepatuhan Internal',
  'teguharifianto': 'Fungsional Pemeriksa Pajak',
  'akhbarbudimanfarsitiantoarmanto': 'Seksi Pelayanan',
  'purnomoadi': 'Fungsional Pemeriksa Pajak',
  'ikaerawati': 'Fungsional Pemeriksa Pajak',
  'nurfajar': 'Seksi Pelayanan',
  'dwiindahnovita': 'Seksi Pelayanan',
  'rivanwibowo': 'Fungsional Pemeriksa Pajak',
  'ekanuryuliana': 'Fungsional Pemeriksa Pajak',
  'dindarizkiparamudita': 'Seksi Pelayanan',
  'biancakanyahaqqulontoh': 'Fungsional Pemeriksa Pajak',
  'ubaidillahhafiluddinfath': 'Fungsional Pemeriksa Pajak',
  'handokosusilo': 'KP2KP',
  'ignatiusrakaradityowisnumurti': 'KP2KP',
  'ilhamsatriagumilar': 'KP2KP',
  'ornasradityandaru': 'KP2KP',
  'fachrul': 'KP2KP',
  'ilhamaqshalramadhan': 'KP2KP',

  // PPNPN / Pegawai Lapangan / Petugas Penugasan Khusus
  'ariefhartono': 'Seksi Pemeriksaan, Penilaian, dan Penagihan',
  'muhammadrafinugroho': 'Seksi Penjaminan Kualitas Data',
  'joisreiyaga': 'Subbagian Umum dan Kepatuhan Internal',
  'jois': 'Subbagian Umum dan Kepatuhan Internal',
  'abdulkasritahir': 'Subbagian Umum dan Kepatuhan Internal',
  'lawandi': 'Subbagian Umum dan Kepatuhan Internal',
  'joni': 'Subbagian Umum dan Kepatuhan Internal',
  'triindahutami': 'Subbagian Umum dan Kepatuhan Internal',
  'nandaasdianto': 'Subbagian Umum dan Kepatuhan Internal',
  'ridwan': 'Subbagian Umum dan Kepatuhan Internal',
  'farhanfadhlurrahman': 'KP2KP',
  'aprianononong': 'KP2KP',
  'andriasmar': 'KP2KP',
  'nasdayanti': 'KP2KP',
  'munadiahmukhlis': 'KP2KP',
  'indrasakti': 'Seksi Pengawasan V',
  'muhammadabdanfadhlissalam': 'Seksi Pelayanan',
  'andiarwin': 'Seksi Pelayanan',
  'nisfun': 'Seksi Pelayanan',
  'isytarnatusbungasumarah': 'Seksi Pelayanan',
  'rizyanaekafebrianti': 'Seksi Pelayanan',
  'bernadamrolloh': 'Seksi Pelayanan',
  'muhammadfaridhabiburrohman': 'Seksi Pelayanan',
  'andinurjannah': 'Seksi Pelayanan',
  'saharahyusnikalara': 'Seksi Pelayanan',
  'firstianlaninaalbachri': 'Seksi Pelayanan',
  'hadrianisupu': 'Seksi Pelayanan',
};

/**
 * Get employee SPD rankings with month range and year filtering.
 */
export async function getSPDRankings(filters: {
  startMonth?: number;
  endMonth?: number;
  year?: number;
} = {}): Promise<SPDRankingsResult> {
  const [rawData, agendaRawData] = await Promise.all([
    getSheetData('Rekap SPD', 'A2:M'),
    getSheetData('Agenda Surat Tugas', 'A3:S').catch((err) => {
      console.error('[SHEETS] Error loading Agenda Surat Tugas for date mapping in getSPDRankings:', err);
      return [] as string[][];
    }),
  ]);

  const resolveTanggalDitetapkan = createAgendaSTDateResolver(agendaRawData);

  const records: RekapSPD[] = rawData
    .filter((row) => {
      if (!isValidRow(row[2])) return false; // col C = namaPegawai
      if (row[8]?.includes('00 Januari 1900')) return false;
      return true;
    })
    .map((row) => {
      const spdNum = safeInt(row[0]);
      const namaPegawai = safeStr(row[2]);
      const nomorST = safeStr(row[4]);
      const fallbackDate = safeStr(row[10]);

      return {
        nomorSpd: spdNum,
        nomorPegawai: safeInt(row[1]),
        nip: '',
        namaPegawai,
        wilayahTugas: safeStr(row[3]),
        nomorST,
        tanggalST: safeStr(row[5]),
        perihalTugas: safeStr(row[6]),
        jumlahHariSpd: safeStr(row[7]),
        jumlahHariSpdNumeric: parseInt(row[7] || '0', 10) || 0,
        tanggalMulai: safeStr(row[8]),
        tanggalAkhir: safeStr(row[9]),
        tanggalDitetapkan: resolveTanggalDitetapkan(spdNum, namaPegawai, nomorST, fallbackDate),
      };
    })
    .reverse();

  // Extract available years and months from parsed dates
  const yearsSet = new Set<number>();
  const monthsSet = new Set<number>();

  const datedRecords: { record: RekapSPD; date: Date | null }[] = records.map((r) => {
    const d = parseIndonesianDate(r.tanggalMulai) || parseIndonesianDate(r.tanggalST);
    if (d) {
      yearsSet.add(d.getFullYear());
      monthsSet.add(d.getMonth() + 1);
    }
    return { record: r, date: d };
  });

  const availableYears = Array.from(yearsSet).sort((a, b) => b - a);
  if (availableYears.length === 0) availableYears.push(new Date().getFullYear());

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const availableMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
    value: m,
    label: monthNames[m - 1],
  }));

  const { startMonth, endMonth, year } = filters;

  // Filter records based on month range & year
  const filteredRecords = datedRecords.filter(({ date }) => {
    if (!date) return true; // Keep records if date cannot be parsed
    if (year && date.getFullYear() !== year) return false;
    
    const m = date.getMonth() + 1; // 1-12
    if (startMonth && endMonth) {
      if (startMonth <= endMonth) {
        if (m < startMonth || m > endMonth) return false;
      } else {
        if (m < startMonth && m > endMonth) return false;
      }
    } else if (startMonth && !endMonth) {
      if (m < startMonth) return false;
    } else if (!startMonth && endMonth) {
      if (m > endMonth) return false;
    }

    return true;
  }).map(({ record }) => record);

  // Load users from DB for dynamic / newly registered users
  const dbUserSectionMap = new Map<string, string>();
  const dbUserTokenMap = new Map<string, string>();
  try {
    const dbUsers = await db.select({ name: user.name, jabatan: user.jabatan }).from(user);
    for (const u of dbUsers) {
      const key = cleanNameForMatch(u.name);
      if (key && u.jabatan) {
        const sec = getSectionFromJabatan(u.jabatan);
        dbUserSectionMap.set(key, sec);
        // Index distinct tokens (words) of employee name
        const tokens = u.name.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 4 && !COMMON_STOPWORDS.has(t));
        for (const t of tokens) {
          if (!dbUserTokenMap.has(t)) {
            dbUserTokenMap.set(t, sec);
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('[SHEETS] Could not load DB users for section mapping, using master fallback:', err.message);
  }

  const resolveSection = (namaPegawai: string): string => {
    const norm = cleanNameForMatch(namaPegawai);
    if (!norm) return 'Lainnya';

    // 1. Direct match from DB users
    if (dbUserSectionMap.has(norm)) {
      return dbUserSectionMap.get(norm)!;
    }

    // 2. Direct match from master static mapping
    if (MASTER_EMPLOYEE_SEKSI[norm]) {
      return MASTER_EMPLOYEE_SEKSI[norm];
    }

    // 3. Substring match from DB users
    for (const [key, seksi] of dbUserSectionMap.entries()) {
      if ((key.length >= 4 && norm.includes(key)) || (norm.length >= 4 && key.includes(norm))) {
        return seksi;
      }
    }

    // 4. Substring match from master mapping
    for (const [key, seksi] of Object.entries(MASTER_EMPLOYEE_SEKSI)) {
      if ((key.length >= 4 && norm.includes(key)) || (norm.length >= 4 && key.includes(norm))) {
        return seksi;
      }
    }

    // 5. Token/Word-level match (e.g. unique single name like 'kalpataru' or 'ghufron')
    const tokens = namaPegawai.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 4 && !COMMON_STOPWORDS.has(t));
    for (const t of tokens) {
      if (dbUserTokenMap.has(t)) {
        return dbUserTokenMap.get(t)!;
      }
      if (MASTER_EMPLOYEE_SEKSI[t]) {
        return MASTER_EMPLOYEE_SEKSI[t];
      }
    }

    return 'Lainnya';
  };

  // Group by employee name
  const employeeMap = new Map<string, {
    namaPegawai: string;
    totalSpd: number;
    totalHari: number;
    wilayahSet: Set<string>;
    spdList: RekapSPD[];
  }>();

  // Initialize sectionMap with all 9 core sections
  const sectionMap = new Map<string, {
    seksi: string;
    totalSpd: number;
    totalHari: number;
    employeeMap: Map<string, { namaPegawai: string; totalSpd: number; totalHari: number }>;
    spdList: RekapSPD[];
  }>();

  for (const cs of CORE_SECTIONS) {
    sectionMap.set(cs, {
      seksi: cs,
      totalSpd: 0,
      totalHari: 0,
      employeeMap: new Map(),
      spdList: [],
    });
  }

  for (const r of filteredRecords) {
    // 1. Aggregate for employee ranking
    const normKey = cleanNameForMatch(r.namaPegawai) || r.namaPegawai.toLowerCase().trim();
    if (normKey) {
      let emp = employeeMap.get(normKey);
      if (!emp) {
        emp = {
          namaPegawai: r.namaPegawai,
          totalSpd: 0,
          totalHari: 0,
          wilayahSet: new Set<string>(),
          spdList: [],
        };
        employeeMap.set(normKey, emp);
      }

      emp.totalSpd += 1;
      emp.totalHari += r.jumlahHariSpdNumeric;
      if (r.wilayahTugas) emp.wilayahSet.add(r.wilayahTugas);
      emp.spdList.push(r);
    }

    // 2. Aggregate for section ranking
    const seksiName = resolveSection(r.namaPegawai);
    let sec = sectionMap.get(seksiName);
    if (!sec) {
      sec = {
        seksi: seksiName,
        totalSpd: 0,
        totalHari: 0,
        employeeMap: new Map(),
        spdList: [],
      };
      sectionMap.set(seksiName, sec);
    }

    sec.totalSpd += 1;
    sec.totalHari += r.jumlahHariSpdNumeric;
    sec.spdList.push(r);

    if (normKey) {
      let empInSec = sec.employeeMap.get(normKey);
      if (!empInSec) {
        empInSec = {
          namaPegawai: r.namaPegawai,
          totalSpd: 0,
          totalHari: 0,
        };
        sec.employeeMap.set(normKey, empInSec);
      }
      empInSec.totalSpd += 1;
      empInSec.totalHari += r.jumlahHariSpdNumeric;
    }
  }

  // Sort descending by totalSpd, then totalHari for employees
  const sortedEmployees = Array.from(employeeMap.values()).sort((a, b) => {
    if (b.totalSpd !== a.totalSpd) return b.totalSpd - a.totalSpd;
    return b.totalHari - a.totalHari;
  });

  const rankings: EmployeeSPDRanking[] = sortedEmployees.map((emp, index) => ({
    rank: index + 1,
    namaPegawai: emp.namaPegawai,
    totalSpd: emp.totalSpd,
    totalHari: emp.totalHari,
    wilayahList: Array.from(emp.wilayahSet),
    spdList: emp.spdList,
  }));

  // Sort descending by totalSpd, then totalHari for sections
  const totalSpdInPeriod = filteredRecords.length;

  const sortedSections = Array.from(sectionMap.values())
    .filter((sec) => {
      // Core sections are ALWAYS included (even if 0 SPD)
      if ((CORE_SECTIONS as readonly string[]).includes(sec.seksi as any)) return true;
      // Non-core sections (Fungsional Pemeriksa Pajak, KP2KP, Kepala Kantor) only if totalSpd > 0
      return sec.totalSpd > 0;
    })
    .sort((a, b) => {
      if (b.totalSpd !== a.totalSpd) return b.totalSpd - a.totalSpd;
      return b.totalHari - a.totalHari;
    });

  const sectionRankings: SectionSPDRanking[] = sortedSections.map((sec, index) => {
    const pegawaiList = Array.from(sec.employeeMap.values()).sort((a, b) => {
      if (b.totalSpd !== a.totalSpd) return b.totalSpd - a.totalSpd;
      return b.totalHari - a.totalHari;
    });

    const persentaseSpd = totalSpdInPeriod > 0
      ? Number(((sec.totalSpd / totalSpdInPeriod) * 100).toFixed(1))
      : 0;

    return {
      rank: index + 1,
      seksi: sec.seksi,
      totalSpd: sec.totalSpd,
      totalHari: sec.totalHari,
      jumlahPegawai: sec.employeeMap.size,
      persentaseSpd,
      pegawaiList,
      spdList: sec.spdList,
    };
  });

  return {
    rankings,
    sectionRankings,
    totalSpdInPeriod,
    availableMonths,
    availableYears,
    selectedFilter: { startMonth, endMonth, year },
  };
}

/**
 * Refresh all cached sheet data.
 * Now async because Redis operations are async.
 */
export async function refreshCache(): Promise<void> {
  await invalidateCache();
}
