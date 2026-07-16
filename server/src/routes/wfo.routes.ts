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
    
    let currentSection: 'WFO' | 'WFH' | null = null;
    const wfoLines: string[] = [];
    const wfhLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();

      // Case-insensitive & robust detection of section headers
      if (lower.includes('daftar pegawai wfo') || (lower.includes('pegawai wfo') && lower.includes('tanggal'))) {
        currentSection = 'WFO';
        continue;
      } else if (lower.includes('daftar pegawai wfh') || (lower.includes('pegawai wfh') && lower.includes('tanggal'))) {
        currentSection = 'WFH';
        continue;
      }
      
      if (currentSection === 'WFO') {
        wfoLines.push(line);
      } else if (currentSection === 'WFH') {
        wfhLines.push(line);
      }
    }

    // Now find the users in the DB
    const allUsers = await listAllUsers();
    const wfoIdsSet = new Set<string>();

    // Helper for normalizing string for comparison
    const cleanDigits = (s: string) => s.replace(/[^0-9]/g, '');
    const cleanNameForMatch = (name: string) => {
      // Take base name before comma (e.g. "Budi Santoso, S.Kom" -> "Budi Santoso")
      return name.split(',')[0].toLowerCase().replace(/[^a-z]/g, '');
    };

    // 1. Primary & most accurate match: by 18-digit NIP (nipPanjang) or 9-digit NIP (nip) extracted from WFO lines
    const combinedWfoText = wfoLines.join('\n');
    const extracted18Nips = combinedWfoText.match(/\b\d{18}\b/g) || [];
    const extracted9Nips = combinedWfoText.match(/\b\d{9}\b/g) || [];
    const wfoNipsSet = new Set([...extracted18Nips, ...extracted9Nips]);

    for (const user of allUsers) {
      const nipPendekClean = user.nip ? cleanDigits(user.nip) : '';
      const nipPanjangClean = user.nipPanjang ? cleanDigits(user.nipPanjang) : '';

      if ((nipPanjangClean && nipPanjangClean.length === 18 && wfoNipsSet.has(nipPanjangClean)) ||
          (nipPendekClean && nipPendekClean.length === 9 && wfoNipsSet.has(nipPendekClean)) ||
          (nipPendekClean && nipPendekClean.length === 18 && wfoNipsSet.has(nipPendekClean))) {
        wfoIdsSet.add(user.id);
      }
    }

    // 2. Secondary fallback match: by normalized Name for rows/users missed by NIP
    for (const user of allUsers) {
      if (wfoIdsSet.has(user.id)) continue;

      const userCleanName = cleanNameForMatch(user.name);
      if (userCleanName.length < 3) continue;

      for (const line of wfoLines) {
        // Strip out any NIP numbers (18 or 9 digits) and leading row numbering before checking names
        const lineWithoutNipOrNumber = line
          .replace(/\b\d{18}\b/g, '')
          .replace(/\b\d{9}\b/g, '')
          .replace(/^\d+[\.\)\s]*/, '')
          .trim();
        const lineCleanName = cleanNameForMatch(lineWithoutNipOrNumber);

        if (lineCleanName && (
          lineCleanName === userCleanName ||
          (userCleanName.length >= 5 && lineCleanName.includes(userCleanName)) ||
          (lineCleanName.length >= 5 && userCleanName.includes(lineCleanName))
        )) {
          wfoIdsSet.add(user.id);
          break;
        }
      }
    }

    const wfoIds = Array.from(wfoIdsSet);
    console.log(`[WFO Import] Found WFO section: ${wfoLines.length > 0}, Extracted NIPs: ${wfoNipsSet.size}, Total matched DB users: ${wfoIds.length}`);

    res.json({ data: { wfoIds } });
  } catch (err: any) {
    console.error('[WFO] Error parsing PDF:', err.message);
    res.status(500).json({ error: 'Gagal memproses file PDF.' });
  }
});

export default router;
