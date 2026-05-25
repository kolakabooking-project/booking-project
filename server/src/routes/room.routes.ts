import { Router, type Request, type Response } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';
import * as roomService from '../services/room.service.js';
import { upload, deleteUploadedFile, validateImageSignature } from '../utils/upload.js';
import { AppError } from '../utils/errors.js';
import { logActivity } from '../services/activity.service.js';

const router = Router();

// All room routes require authentication
router.use(authGuard);

/**
 * GET /api/rooms — List all rooms with computed status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const rooms = await roomService.getAllRooms();
    res.json({ data: rooms });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/rooms/available?start=ISO&end=ISO — Available rooms for time range
 */
router.get('/available', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      res.status(400).json({ error: 'Parameter start dan end wajib diisi.' });
      return;
    }
    const rooms = await roomService.getAvailableRooms(
      new Date(start as string),
      new Date(end as string)
    );
    res.json({ data: rooms });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/rooms/:id — Single room
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const room = await roomService.getRoomById(req.params.id as string);
    res.json({ data: room });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/rooms — Create room (admin only)
 */
router.post('/', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const room = await roomService.createRoom(req.body);
    res.status(201).json({ data: room });

    // Log activity
    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'ROOM_CREATED',
      targetId: room.id,
      targetName: room.name,
      detail: `Ruangan baru ditambahkan: ${room.name} di ${room.lokasi}`,
      ipAddress: (Array.isArray(req.ip) ? req.ip[0] : req.ip) || undefined,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * PUT /api/rooms/:id — Update room (admin only)
 */
router.put('/:id', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const room = await roomService.updateRoom(req.params.id as string, req.body);
    res.json({ data: room });

    // Log activity
    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'ROOM_UPDATED',
      targetId: room.id,
      targetName: room.name,
      detail: `Data ruangan diperbarui: ${room.name}`,
      ipAddress: (Array.isArray(req.ip) ? req.ip[0] : req.ip) || undefined,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * DELETE /api/rooms/:id — Delete room (admin only)
 */
router.delete('/:id', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const room = await roomService.getRoomById(req.params.id as string);

    await roomService.deleteRoom(req.params.id as string);
    res.json({ message: 'Ruangan berhasil dihapus.' });

    // Log activity
    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'ROOM_DELETED',
      targetId: req.params.id as string,
      targetName: room.name,
      detail: `Ruangan dihapus: ${room.name}`,
      ipAddress: (Array.isArray(req.ip) ? req.ip[0] : req.ip) || undefined,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/rooms/:id/photo — Upload room photo (admin only)
 */
router.post(
  '/:id/photo',
  roleGuard('admin'),
  upload.single('photo'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'File foto wajib diupload.' });
        return;
      }

      if (!validateImageSignature(req.file.path)) {
        deleteUploadedFile(req.file.filename);
        res.status(400).json({ error: 'Format berkas tidak valid. Harap unggah gambar JPEG, PNG, atau WebP asli.' });
        return;
      }

      const existing = await roomService.getRoomById(req.params.id as string);
      if (existing.foto && !existing.foto.startsWith('http')) {
        deleteUploadedFile(existing.foto);
      }

      const photoPath = req.file.filename;
      const room = await roomService.updateRoom(req.params.id as string, { foto: photoPath });
      res.json({ data: room, photoUrl: `/uploads/${photoPath}` });

      const actor = (req as any).user;
      logActivity({
        userId: actor.id,
        userName: actor.name,
        action: 'ROOM_UPDATED',
        targetId: room.id,
        targetName: room.name,
        detail: `Foto ruangan diperbarui: ${room.name}`,
        ipAddress: (Array.isArray(req.ip) ? req.ip[0] : req.ip) || undefined,
      });
    } catch (err: any) {
      const status = err instanceof AppError ? err.statusCode : 500;
      res.status(status).json({ error: err.message });
    }
  }
);

export default router;
