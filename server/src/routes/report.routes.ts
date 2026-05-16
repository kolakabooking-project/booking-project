import { Router, type Request, type Response } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';
import * as reportService from '../services/report.service.js';
import { AppError } from '../utils/errors.js';

const router = Router();

router.use(authGuard);
router.use(roleGuard('admin'));

/**
 * GET /api/reports/summary — Aggregated booking statistics
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, vehicleId } = req.query;
    const summary = await reportService.getReportSummary({
      startDate: startDate as string,
      endDate: endDate as string,
      vehicleId: vehicleId as string,
    });
    res.json({ data: summary });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/reports/export — Filtered data for export
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, vehicleId } = req.query;
    const data = await reportService.getExportData({
      startDate: startDate as string,
      endDate: endDate as string,
      vehicleId: vehicleId as string,
    });
    res.json({ data });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;
