import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/db';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { Role, Status, Priority } from '@prisma/client';

export class AdminController {
  static async getTeams(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const teams = await prisma.team.findMany();
      return res.status(200).json({ success: true, data: teams });
    } catch (err) {
      next(err);
    }
  }

  static async createTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== Role.ADMIN) {
        throw new ForbiddenError('Only Admins can create new teams');
      }
      const { name, description } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Team name is required' });
      }
      const team = await prisma.team.create({
        data: { name: name.trim(), description: description?.trim() || null },
      });
      return res.status(201).json({ success: true, data: team });
    } catch (err) {
      next(err);
    }
  }

  static async getUsers(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany();
      return res.status(200).json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== Role.ADMIN) {
        throw new ForbiddenError('Only Admins can modify user roles and teams');
      }
      const { id } = req.params;
      const { role, teamId } = req.body;

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(role ? { role } : {}),
          ...(teamId !== undefined ? { teamId } : {}),
        },
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async getWorkView(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { category } = req.params; // 'ongoing' | 'completed' | 'high-priority' | 'approvals' | 'rejections'

      let where: any = {};

      if (category === 'ongoing') {
        where.status = { in: [Status.OPEN, Status.IN_PROGRESS] };
      } else if (category === 'completed') {
        where.status = { in: [Status.RESOLVED, Status.CLOSED] };
      } else if (category === 'high-priority') {
        where.priority = { in: [Priority.HIGH, Priority.URGENT] };
      } else if (category === 'approvals') {
        where.status = Status.IN_REVIEW;
      } else if (category === 'rejections') {
        // Find work items where rework was requested or items returned from review
        where.status = { in: [Status.IN_PROGRESS, Status.OPEN] };
      }

      const items = await prisma.workItem.findMany({
        where,
        include: {
          team: true,
          assignee: true,
          reporter: true,
        },
      });

      return res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }
}
