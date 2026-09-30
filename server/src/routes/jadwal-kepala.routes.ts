import { Router, type Request, type Response } from 'express';
import { AppError } from '../utils/errors.js';
import * as jadwalService from '../services/jadwal-kepala.service.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = Router();

function getClientIp(req: Request): string | undefined {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
}

function handleError(err: any, res: Response) {
  const status = err instanceof AppError ? err.statusCode : 500;
  const message = status === 500 ? 'Terjadi kesalahan internal pada server' : err.message;
  if (status === 500) {
    console.error('[Jadwal Kepala Route Error]', err);
  }
  res.status(status).json({ error: message });
}

// ─── Calendar Aggregated Endpoint ───
// Accessible by kepala_kantor, sekretaris, admin (and superadmin via bypass)
router.get('/calendar', roleGuard('kepala_kantor', 'sekretaris', 'admin'), async (req: Request, res: Response) => {
  try {
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

    const data = await jadwalService.getCalendarData(month, year);
    res.json({ data });
  } catch (err: any) {
    handleError(err, res);
  }
});

// ─── Pimpinan / Kepala Kantor Info Endpoint ───
router.get('/pimpinan', roleGuard('kepala_kantor', 'sekretaris', 'admin'), async (req: Request, res: Response) => {
  try {
    const data = await jadwalService.getKepalaKantorInfo();
    res.json({ data });
  } catch (err: any) {
    handleError(err, res);
  }
});

// ─── Kegiatan Endpoints ───

// List kegiatan
router.get('/kegiatan', roleGuard('kepala_kantor', 'sekretaris', 'admin'), async (req: Request, res: Response) => {
  try {
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const search = req.query.search as string | undefined;

    const data = await jadwalService.listKegiatan({ month, year, search });
    res.json({ data });
  } catch (err: any) {
    handleError(err, res);
  }
});

// Get detail kegiatan
router.get('/kegiatan/:id', roleGuard('kepala_kantor', 'sekretaris', 'admin'), async (req: Request, res: Response) => {
  try {
    const data = await jadwalService.getKegiatanById(req.params.id as string);
    res.json({ data });
  } catch (err: any) {
    handleError(err, res);
  }
});

// Create kegiatan (Sekretaris only)
router.post('/kegiatan', roleGuard('sekretaris'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { tanggal, waktuMulai, waktuSelesai, agenda, tempat } = req.body;

    const created = await jadwalService.createKegiatan(
      { tanggal, waktuMulai, waktuSelesai, agenda, tempat },
      actor.id,
      actor.name,
      getClientIp(req)
    );

    res.status(201).json({ data: created });
  } catch (err: any) {
    handleError(err, res);
  }
});

// Update kegiatan (Sekretaris only)
router.put('/kegiatan/:id', roleGuard('sekretaris'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { tanggal, waktuMulai, waktuSelesai, agenda, tempat } = req.body;

    const updated = await jadwalService.updateKegiatan(
      req.params.id as string,
      { tanggal, waktuMulai, waktuSelesai, agenda, tempat },
      actor.id,
      actor.name,
      getClientIp(req)
    );

    res.json({ data: updated });
  } catch (err: any) {
    handleError(err, res);
  }
});

// Delete kegiatan (Sekretaris only)
router.delete('/kegiatan/:id', roleGuard('sekretaris'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const result = await jadwalService.deleteKegiatan(
      req.params.id as string,
      actor.id,
      actor.name,
      getClientIp(req)
    );

    res.json({ data: result });
  } catch (err: any) {
    handleError(err, res);
  }
});

// ─── Surat Tugas (ST) Endpoints ───

// List ST
router.get('/st', roleGuard('kepala_kantor', 'sekretaris', 'admin'), async (req: Request, res: Response) => {
  try {
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const search = req.query.search as string | undefined;

    const data = await jadwalService.listST({ month, year, search });
    res.json({ data });
  } catch (err: any) {
    handleError(err, res);
  }
});

// Get detail ST
router.get('/st/:id', roleGuard('kepala_kantor', 'sekretaris', 'admin'), async (req: Request, res: Response) => {
  try {
    const data = await jadwalService.getSTById(req.params.id as string);
    res.json({ data });
  } catch (err: any) {
    handleError(err, res);
  }
});

// Create ST (Sekretaris only)
router.post('/st', roleGuard('sekretaris'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { tentang, tempat, tanggal, tanggalSelesai } = req.body;

    const created = await jadwalService.createST(
      { tentang, tempat, tanggal, tanggalSelesai },
      actor.id,
      actor.name,
      getClientIp(req)
    );

    res.status(201).json({ data: created });
  } catch (err: any) {
    handleError(err, res);
  }
});

// Update ST (Sekretaris only)
router.put('/st/:id', roleGuard('sekretaris'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const { tentang, tempat, tanggal, tanggalSelesai } = req.body;

    const updated = await jadwalService.updateST(
      req.params.id as string,
      { tentang, tempat, tanggal, tanggalSelesai },
      actor.id,
      actor.name,
      getClientIp(req)
    );

    res.json({ data: updated });
  } catch (err: any) {
    handleError(err, res);
  }
});

// Delete ST (Sekretaris only)
router.delete('/st/:id', roleGuard('sekretaris'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const result = await jadwalService.deleteST(
      req.params.id as string,
      actor.id,
      actor.name,
      getClientIp(req)
    );

    res.json({ data: result });
  } catch (err: any) {
    handleError(err, res);
  }
});

export default router;
