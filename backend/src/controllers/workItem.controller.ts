import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { WorkItemService } from '../services/workItem.service';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { z } from 'zod';

const createWorkItemSchema = z.object({
  title: z.string().min(1, 'Title must be at least 1 character'),
  description: z.string().optional().default(''),
  type: z.enum(['TASK', 'INCIDENT']).optional().default('TASK'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  teamId: z.string().optional(),
  targetTeamId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'CLOSED']).optional(),
  dueDate: z.union([z.string(), z.null()]).optional(),
});

const updateWorkItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['TASK', 'INCIDENT']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.union([z.string(), z.null()]).optional(),
  version: z.number({ required_error: 'Work item version is required for concurrency control' }),
});

export class WorkItemController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await WorkItemService.listWorkItems(req.user, req.query as any);
      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const item = await WorkItemService.getWorkItemById(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const validated = createWorkItemSchema.parse(req.body);
      const teamId = validated.teamId || req.user.teamId;

      if (!teamId) {
        throw new BadRequestError('Team ID is required');
      }

      const item = await WorkItemService.createWorkItem(req.user, {
        ...validated,
        teamId,
      });

      return res.status(201).json({
        success: true,
        message: 'Work item created successfully',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const validated = updateWorkItemSchema.parse(req.body);
      const item = await WorkItemService.updateWorkItem(req.params.id, req.user, validated);
      return res.status(200).json({
        success: true,
        message: 'Work item updated successfully',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  static async claim(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const version = Number(req.body.version);
      if (isNaN(version)) {
        throw new BadRequestError('Current version is required to claim a work item');
      }

      const item = await WorkItemService.claimWorkItem(req.params.id, req.user, version);
      return res.status(200).json({
        success: true,
        message: 'Work item claimed successfully',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  static async transitionStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { targetStatus, version, claimForSelf, comment } = req.body;
      if (!targetStatus) {
        throw new BadRequestError('targetStatus is required');
      }
      if (typeof version !== 'number') {
        throw new BadRequestError('Current version is required for status transition');
      }

      const item = await WorkItemService.transitionStatus(
        req.params.id,
        targetStatus,
        req.user,
        version,
        Boolean(claimForSelf),
        comment ? String(comment) : undefined
      );

      return res.status(200).json({
        success: true,
        message: `Status transitioned to ${targetStatus}`,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { content } = req.body;
      const comment = await WorkItemService.addComment(req.params.id, content, req.user);
      return res.status(201).json({
        success: true,
        message: 'Comment added',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      await WorkItemService.deleteWorkItem(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        message: 'Work item successfully deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}
