import { Router, type Request, type Response } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';
import * as driverService from '../services/driver.service.js';
import { upload, deleteUploadedFile } from '../utils/upload.js';
import { AppError } from '../utils/errors.js';

const router = Router();

router.use(authGuard);

/**
 * GET /api/drivers — List all drivers
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const drivers = await driverService.getAllDrivers();
    res.json({ data: drivers });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/drivers/available?start=ISO&end=ISO — Available drivers for time range
 */
router.get('/available', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      res.status(400).json({ error: 'Parameter start dan end wajib diisi.' });
      return;
    }
    const drivers = await driverService.getAvailableDrivers(
      new Date(start as string),
      new Date(end as string)
    );
    res.json({ data: drivers });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/drivers/:id — Single driver
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const driver = await driverService.getDriverById(req.params.id as string);
    res.json({ data: driver });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/drivers — Create driver (admin only)
 */
router.post('/', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const driver = await driverService.createDriver(req.body);
    res.status(201).json({ data: driver });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * PUT /api/drivers/:id — Update driver (admin only)
 */
router.put('/:id', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const driver = await driverService.updateDriver(req.params.id as string, req.body);
    res.json({ data: driver });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * DELETE /api/drivers/:id — Delete driver (admin only)
 */
router.delete('/:id', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    await driverService.deleteDriver(req.params.id as string);
    res.json({ message: 'Pengemudi berhasil dihapus.' });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/drivers/:id/photo — Upload driver photo (admin only)
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

      const existing = await driverService.getDriverById(req.params.id as string);
      if (existing.foto && !existing.foto.startsWith('http')) {
        deleteUploadedFile(existing.foto);
      }

      const photoPath = req.file.filename;
      const driver = await driverService.updateDriver(req.params.id as string, { foto: photoPath });
      res.json({ data: driver, photoUrl: `/uploads/${photoPath}` });
    } catch (err: any) {
      const status = err instanceof AppError ? err.statusCode : 500;
      res.status(status).json({ error: err.message });
    }
  }
);

export default router;
