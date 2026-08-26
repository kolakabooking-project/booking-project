import { Router, type Request } from 'express';
import { roleGuard } from '../middleware/roleGuard.js';
import * as sheetsService from '../services/sheets.service.js';
import { logActivity } from '../services/activity.service.js';

function getIp(req: Request): string | undefined {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
}

const router = Router();

// ─── GET /api/sheets/agenda-st ───
// Admin: all data | User: filtered by user (name & NIP)
router.get('/agenda-st', async (req, res) => {
  try {
    const user = (req as any).user;
    const activeRole = req.header('x-active-role') || user.role;
    const isAdmin = activeRole === 'admin' || activeRole === 'superadmin';
    const { search, wilayah, page = '1', limit = '20' } = req.query;

    const result = await sheetsService.getAgendaSuratTugas({
      user: isAdmin ? undefined : { name: user.name, nip: user.nip, nipPanjang: user.nipPanjang },
      search: typeof search === 'string' ? search : undefined,
      wilayah: typeof wilayah === 'string' ? wilayah : undefined,
      page: Math.max(1, parseInt(page as string, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20)),
    });

    res.json(result);
  } catch (err: any) {
    console.error('[SHEETS] Error fetching agenda ST:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data Agenda Surat Tugas' });
  }
});

// ─── GET /api/sheets/rekap-spd ───
// Admin: all data | User: filtered by user (name & NIP)
router.get('/rekap-spd', async (req, res) => {
  try {
    const user = (req as any).user;
    const activeRole = req.header('x-active-role') || user.role;
    const isAdmin = activeRole === 'admin' || activeRole === 'superadmin';
    const { search, wilayah, page = '1', limit = '20' } = req.query;

    const result = await sheetsService.getRekapSPD({
      user: isAdmin ? undefined : { name: user.name, nip: user.nip, nipPanjang: user.nipPanjang },
      search: typeof search === 'string' ? search : undefined,
      wilayah: typeof wilayah === 'string' ? wilayah : undefined,
      page: Math.max(1, parseInt(page as string, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20)),
    });

    res.json(result);
  } catch (err: any) {
    console.error('[SHEETS] Error fetching rekap SPD:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data Rekap SPD' });
  }
});

// ─── GET /api/sheets/spd-summary ───
// Admin: all | User: personal summary
router.get('/spd-summary', async (req, res) => {
  try {
    const user = (req as any).user;
    const activeRole = req.header('x-active-role') || user.role;
    const isAdmin = activeRole === 'admin' || activeRole === 'superadmin';

    const result = await sheetsService.getSPDSummary(
      isAdmin ? undefined : { name: user.name, nip: user.nip, nipPanjang: user.nipPanjang }
    );
    res.json(result);
  } catch (err: any) {
    console.error('[SHEETS] Error fetching SPD summary:', err.message);
    res.status(500).json({ error: 'Gagal mengambil ringkasan SPD' });
  }
});

// ─── GET /api/sheets/dashboard ───
// Consolidated dashboard: summary + recent SPD + recent perjadin in ONE call
router.get('/dashboard', async (req, res) => {
  try {
    const user = (req as any).user;
    const activeRole = req.header('x-active-role') || user.role;
    const isAdmin = activeRole === 'admin' || activeRole === 'superadmin';

    const result = await sheetsService.getTrackingDashboard(
      isAdmin ? undefined : { name: user.name, nip: user.nip, nipPanjang: user.nipPanjang }
    );
    res.json(result);
  } catch (err: any) {
    console.error('[SHEETS] Error fetching dashboard:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data dashboard tracking' });
  }
});

// ─── GET /api/sheets/jadwal-jumat ───
// Accessible by all users, shows full WFO/WFH schedule
router.get('/jadwal-jumat', async (req, res) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;

    const result = await sheetsService.getJadwalJumat({
      search: typeof search === 'string' ? search : undefined,
      page: Math.max(1, parseInt(page as string, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20)),
    });

    res.json(result);
  } catch (err: any) {
    console.error('[SHEETS] Error fetching Jadwal Jumat:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data Jadwal Jumat' });
  }
});

// ─── GET /api/sheets/pegawai-cuti ───
// Accessible by all users, shows employee leave records
router.get('/pegawai-cuti', async (req, res) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;

    const result = await sheetsService.getPegawaiCuti({
      search: typeof search === 'string' ? search : undefined,
      page: Math.max(1, parseInt(page as string, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20)),
    });

    res.json(result);
  } catch (err: any) {
    console.error('[SHEETS] Error fetching Pegawai Cuti:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data Pegawai Cuti' });
  }
});

// ─── GET /api/sheets/spd-rankings ───
// Admin: Top SPD employee rankings with month range and year filtering
router.get('/spd-rankings', roleGuard('admin'), async (req, res) => {
  try {
    const { startMonth, endMonth, year } = req.query;

    const result = await sheetsService.getSPDRankings({
      startMonth: startMonth ? parseInt(startMonth as string, 10) : undefined,
      endMonth: endMonth ? parseInt(endMonth as string, 10) : undefined,
      year: year ? parseInt(year as string, 10) : undefined,
    });

    res.json(result);
  } catch (err: any) {
    console.error('[SHEETS] Error fetching SPD rankings:', err.message);
    res.status(500).json({ error: 'Gagal mengambil peringkat SPD pegawai' });
  }
});

// ─── POST /api/sheets/cache/refresh ───
// Admin-only: force refresh all cached sheet data
router.post('/cache/refresh', roleGuard('admin'), async (req, res) => {
  try {
    const user = (req as any).user;
    await sheetsService.refreshCache();

    logActivity({
      userId: user?.id || null,
      userName: user?.name || 'Administrator',
      action: 'SPD_CACHE_REFRESHED',
      detail: 'Melakukan refresh seluruh data spreadsheet dari Google Sheets (SPD, Perjadin, Pegawai Cuti)',
      ipAddress: getIp(req),
    });

    res.json({ message: 'Semua cache data spreadsheet berhasil di-refresh' });
  } catch (err: any) {
    console.error('[SHEETS] Error refreshing cache:', err.message);
    res.status(500).json({ error: 'Gagal me-refresh cache data spreadsheet' });
  }
});

export default router;
