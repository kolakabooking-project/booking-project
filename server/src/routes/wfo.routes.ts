import { Router, type Request, type Response } from 'express';
import { roleGuard } from '../middleware/roleGuard.js';
import * as wfoService from '../services/wfo.service.js';
import { listAllUsers } from '../services/superadmin.service.js'; // to get all users

const router = Router();

/** Safely extract client IP */
function getClientIp(req: Request): string | undefined {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
}

// ─── GET /api/wfo/:date ───
// Returns schedule for a given date, determining WFO and WFH automatically.
router.get('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    // Get all WFO scheduled for this date
    const wfoRecords = await wfoService.getWfoSchedulesByDate(date as string);
    const wfoUserIds = new Set(wfoRecords.map((r: any) => r.userId));

    // Get all users to determine WFH (everyone not WFO is WFH)
    const allUsers = await listAllUsers();

    const schedule = allUsers.map((user: any) => {
      const isWfo = wfoUserIds.has(user.id);
      return {
        id: user.id,
        namaPegawai: user.name,
        nip: user.nip,
        jabatan: user.jabatan,
        tipe: isWfo ? 'WFO' : 'WFH',
      };
    });

    res.json({ data: schedule });
  } catch (err: any) {
    console.error('[WFO] Error fetching WFO schedule:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data jadwal WFO.' });
  }
});

// ─── POST /api/wfo ───
// Save/Update WFO Schedule
router.post('/', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { date, userIds } = req.body;

    if (!date) {
      res.status(400).json({ error: 'Parameter date wajib diisi.' });
      return;
    }
    
    if (!Array.isArray(userIds)) {
      res.status(400).json({ error: 'Parameter userIds harus berupa array.' });
      return;
    }

    const result = await wfoService.saveWfoSchedule(
      date,
      userIds,
      actor.id,
      actor.name,
      getClientIp(req)
    );

    res.json({ message: 'Jadwal WFO berhasil disimpan.', data: result });
  } catch (err: any) {
    console.error('[WFO] Error saving WFO schedule:', err.message);
    res.status(500).json({ error: 'Gagal menyimpan jadwal WFO.' });
  }
});

export default router;
