import { Router, type Request, type Response } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';
import * as vehicleService from '../services/vehicle.service.js';
import { upload, deleteUploadedFile, validateImageSignature } from '../utils/upload.js';
import { AppError } from '../utils/errors.js';
import { logActivity } from '../services/activity.service.js';

const router = Router();

// All vehicle routes require authentication
router.use(authGuard);

/**
 * GET /api/vehicles — List all vehicles with computed status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    res.json({ data: vehicles });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/vehicles/available?start=ISO&end=ISO — Available vehicles for time range
 */
router.get('/available', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      res.status(400).json({ error: 'Parameter start dan end wajib diisi.' });
      return;
    }
    const vehicles = await vehicleService.getAvailableVehicles(
      new Date(start as string),
      new Date(end as string)
    );
    res.json({ data: vehicles });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/vehicles/:id — Single vehicle
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id as string);
    res.json({ data: vehicle });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/vehicles — Create vehicle (admin only)
 */
router.post('/', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const vehicle = await vehicleService.createVehicle(req.body);
    res.status(201).json({ data: vehicle });

    // Log activity
    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'VEHICLE_CREATED',
      targetId: vehicle.id,
      targetName: `${vehicle.merek} (${vehicle.platNomor})`,
      detail: `Kendaraan baru ditambahkan: ${vehicle.merek} - ${vehicle.platNomor}`,
      ipAddress: (Array.isArray(req.ip) ? req.ip[0] : req.ip) || undefined,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * PUT /api/vehicles/:id — Update vehicle (admin only)
 */
router.put('/:id', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const vehicle = await vehicleService.updateVehicle(req.params.id as string, req.body);
    res.json({ data: vehicle });

    // Log activity
    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'VEHICLE_UPDATED',
      targetId: vehicle.id,
      targetName: `${vehicle.merek} (${vehicle.platNomor})`,
      detail: `Data kendaraan diperbarui: ${vehicle.merek} - ${vehicle.platNomor}`,
      ipAddress: (Array.isArray(req.ip) ? req.ip[0] : req.ip) || undefined,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * DELETE /api/vehicles/:id — Delete vehicle (admin only)
 */
router.delete('/:id', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    // Get vehicle info before deleting
    const vehicle = await vehicleService.getVehicleById(req.params.id as string);
    const vehicleName = `${vehicle.merek} (${vehicle.platNomor})`;

    await vehicleService.deleteVehicle(req.params.id as string);
    res.json({ message: 'Kendaraan berhasil dihapus.' });

    // Log activity
    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'VEHICLE_DELETED',
      targetId: req.params.id as string,
      targetName: vehicleName,
      detail: `Kendaraan dihapus: ${vehicleName}`,
      ipAddress: (Array.isArray(req.ip) ? req.ip[0] : req.ip) || undefined,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/vehicles/:id/photo — Upload vehicle photo (admin only)
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

      // Get existing vehicle to delete old photo if exists
      const existing = await vehicleService.getVehicleById(req.params.id as string);
      if (existing.foto && !existing.foto.startsWith('http')) {
        deleteUploadedFile(existing.foto);
      }

      const photoPath = req.file.filename;
      const vehicle = await vehicleService.updateVehicle(req.params.id as string, { foto: photoPath });
      res.json({ data: vehicle, photoUrl: `/uploads/${photoPath}` });

      // Log activity
      const actor = (req as any).user;
      logActivity({
        userId: actor.id,
        userName: actor.name,
        action: 'VEHICLE_UPDATED',
        targetId: vehicle.id,
        targetName: `${vehicle.merek} (${vehicle.platNomor})`,
        detail: `Foto kendaraan diperbarui: ${vehicle.merek} - ${vehicle.platNomor}`,
        ipAddress: (Array.isArray(req.ip) ? req.ip[0] : req.ip) || undefined,
      });
    } catch (err: any) {
      const status = err instanceof AppError ? err.statusCode : 500;
      res.status(status).json({ error: err.message });
    }
  }
);

export default router;
