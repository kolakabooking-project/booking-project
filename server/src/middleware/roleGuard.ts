import type { Request, Response, NextFunction } from 'express';

/**
 * Role-based access control middleware.
 * Must be used AFTER authGuard so that req.user is available.
 *
 * Usage: roleGuard('admin') or roleGuard('admin', 'user')
 */
export function roleGuard(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Sesi tidak ditemukan.',
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Anda tidak memiliki akses untuk operasi ini.',
      });
      return;
    }

    next();
  };
}
