import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { DashboardService } from '../services/dashboard.service';
import { UnauthorizedError } from '../utils/errors';

export class DashboardController {
  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const data = await DashboardService.getDashboardQueues(req.user);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
