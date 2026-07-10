import { Router, type Request, type Response } from 'express';
import { roleGuard } from '../middleware/roleGuard.js';
import * as wfoService from '../services/wfo.service.js';
import { listAllUsers } from '../services/superadmin.service.js';
import multer from 'multer';
// @ts-ignore
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const upload = multer({ storage: multer.memoryStorage() });

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

    // Check if this date has been configured before by looking at activity logs
    // If it hasn't been configured, we default everyone to WFO
    const { db } = await import('../config/db.js');
    const { activityLog } = await import('../db/schema.js');
    const { eq, and, ilike } = await import('drizzle-orm');
    
    const configLog = await db.select({ id: activityLog.id }).from(activityLog).where(
      and(
        eq(activityLog.action, 'WFO_SCHEDULE_UPDATED'),
        ilike(activityLog.detail, `%${date}%`)
      )
    ).limit(1);
    
    const isConfigured = wfoRecords.length > 0 || configLog.length > 0;

    // Get all users to determine WFH (everyone not WFO is WFH), excluding superadmin
    const allUsers = (await listAllUsers()).filter((u: any) => u.role !== 'superadmin');

    const schedule = allUsers.map((user: any) => {
      let isWfo;
      if (!isConfigured) {
        // Default to WFH (not WFO) if not configured
        isWfo = false;
      } else {
        isWfo = wfoUserIds.has(user.id);
      }
      
      return {
        id: user.id,
        namaPegawai: user.name,
        nip: user.nip,
        jabatan: user.jabatan,
        tipe: isWfo ? 'WFO' : 'WFH',
      };
    });

    res.json({ data: schedule, isConfigured });
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

// ─── POST /api/wfo/import-pdf ───
// Extracts WFO names from PDF and returns their IDs
router.post('/import-pdf', roleGuard('admin'), upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Tidak ada file PDF yang diupload.' });
      return;
    }

    const data = await pdfParse(req.file.buffer);
    const text = data.text;
    
    // Process text
    const lines = text.split('\n').map((line: string) => line.trim()).filter((line: string) => line);
    
    let currentSection: string | null = null;
    const wfoNames: string[] = [];
    
    // Regex for NIP (18 digits)
    const nipRegex = /'?(\d{18})/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('Daftar Pegawai WFO')) {
        currentSection = 'WFO';
        continue;
      } else if (line.includes('Daftar Pegawai WFH')) {
        currentSection = 'WFH';
        continue;
      }
      
      if (currentSection === 'WFO') {
        const nipMatch = line.match(nipRegex);
        if (nipMatch) {
          // line format is roughly: "1 Nama Pegawai '197..."
          // Let's extract the name by taking everything before the NIP and stripping the leading number.
          const beforeNip = line.split(nipMatch[0])[0].trim();
          // Remove the leading number (e.g., "1 ")
          const nameMatch = beforeNip.match(/^\d+\s+(.*)$/);
          if (nameMatch && nameMatch[1]) {
            wfoNames.push(nameMatch[1].trim());
          }
        }
      }
    }

    // Now find the users in the DB
    const allUsers = await listAllUsers();
    const wfoIds: string[] = [];
    const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const dbUsers = allUsers.map((u: any) => ({ ...u, normalized: normalizeName(u.name) }));

    for (const pdfName of wfoNames) {
      const normalized = normalizeName(pdfName);
      const match = dbUsers.find((u: any) => u.normalized === normalized);
      if (match) {
        wfoIds.push(match.id);
      }
    }

    res.json({ data: { wfoIds } });
  } catch (err: any) {
    console.error('[WFO] Error parsing PDF:', err.message);
    res.status(500).json({ error: 'Gagal memproses file PDF.' });
  }
});

export default router;
