import { Router, type Request, type Response } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';
import * as roomReportService from '../services/room-report.service.js';
import { AppError } from '../utils/errors.js';

const router = Router();

// All report routes require admin role
router.use(authGuard);
router.use(roleGuard('admin'));

/**
 * GET /api/room-reports/summary — Get aggregated statistics
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      roomId: req.query.roomId as string,
    };
    
    const summary = await roomReportService.getRoomReportSummary(filters);
    res.json({ data: summary });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/room-reports/export — Get filtered raw data for export
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      roomId: req.query.roomId as string,
    };
    
    const exportData = await roomReportService.getRoomExportData(filters);
    res.json({ data: exportData });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;
