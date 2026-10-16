import { Role, Status, Priority, WorkItemType, Prisma } from '@prisma/client';
import prisma from '../utils/db';
import { AuthUser, CreateWorkItemInput, UpdateWorkItemInput, WorkItemListQuery } from '../types';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors';
import { canAccessTeam } from '../middleware/rbac.middleware';

// Allowed workflow transitions
const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
  OPEN: [Status.IN_PROGRESS],
  IN_PROGRESS: [Status.IN_REVIEW, Status.OPEN],
  IN_REVIEW: [Status.RESOLVED, Status.IN_PROGRESS], // Moving to RESOLVED requires Lead/Admin approval
  RESOLVED: [Status.CLOSED, Status.IN_PROGRESS],
  CLOSED: [Status.OPEN], // Reopening closed item
};

export class WorkItemService {
  /**
   * List work items with server-side filtering, searching, and pagination.
   * Enforces Team-level RBAC isolation (FR-12).
   */
  static async listWorkItems(user: AuthUser, query: WorkItemListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.WorkItemWhereInput = {};

    // FR-12: Team isolation. Regular users only see their team. Admins see all or filter.
    if (user.role !== Role.ADMIN) {
      if (!user.teamId) {
        throw new ForbiddenError('User has no team assigned');
      }
      where.teamId = user.teamId;
    } else if (query.teamId) {
      where.teamId = query.teamId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.assigneeId) {
      where.assigneeId = query.assigneeId === 'unassigned' ? null : query.assigneeId;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [totalCount, items] = await Promise.all([
      prisma.workItem.count({ where }),
      prisma.workItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          team: { select: { id: true, name: true } },
          reporter: { select: { id: true, name: true, email: true, role: true } },
          assignee: { select: { id: true, name: true, email: true, role: true } },
          _count: { select: { comments: true, activities: true } },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  /**
   * Retrieve single work item with details, comments, and full append-only activity timeline.
   */
  static async getWorkItemById(id: string, user: AuthUser) {
    const item = await prisma.workItem.findUnique({
      where: { id },
      include: {
        team: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true, email: true, role: true } },
        assignee: { select: { id: true, name: true, email: true, role: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundError('Work item not found');
    }

    // FR-12: Enforce team boundary
    if (!canAccessTeam(user.role, user.teamId, item.teamId)) {
      throw new ForbiddenError('Unauthorized: You cannot access work items of another team');
    }

    return item;
  }

  /**
   * Create a new task or incident (FR-03).
   * Appends CREATED to the immutable activity log (FR-08).
   */
  static async createWorkItem(user: AuthUser, input: CreateWorkItemInput) {
    if (user.role === Role.VIEWER) {
      throw new ForbiddenError('Viewers are not permitted to create work items');
    }

    const targetTeamId = user.role === Role.ADMIN ? input.teamId : (user.teamId as string);
    if (!targetTeamId) {
      throw new BadRequestError('Team ID is required to create a work item');
    }

    if (!canAccessTeam(user.role, user.teamId, targetTeamId)) {
      throw new ForbiddenError('Cannot create work item for a team you do not belong to');
    }

    const dueDate = input.dueDate ? new Date(input.dueDate) : null;

    return await prisma.$transaction(async (tx: any) => {
      const workItem = await tx.workItem.create({
        data: {
          title: input.title,
          description: input.description,
          type: input.type,
          priority: input.priority,
          status: Status.OPEN,
          teamId: targetTeamId,
          reporterId: user.id,
          assigneeId: input.assigneeId || null,
          dueDate,
          version: 1,
        },
        include: {
          team: true,
          reporter: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          workItemId: workItem.id,
          userId: user.id,
          action: 'CREATED',
          details: JSON.stringify({
            title: workItem.title,
            type: workItem.type,
            priority: workItem.priority,
            assigneeId: workItem.assigneeId,
          }),
        },
      });

      return workItem;
    });
  }

  /**
   * Update work item details with Optimistic Concurrency Control (FR-04, FR-13).
   */
  static async updateWorkItem(id: string, user: AuthUser, input: UpdateWorkItemInput) {
    if (user.role === Role.VIEWER) {
      throw new ForbiddenError('Viewers do not have permission to edit work items');
    }

    const existing = await prisma.workItem.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Work item not found');
    }

    if (!canAccessTeam(user.role, user.teamId, existing.teamId)) {
      throw new ForbiddenError('Cannot update work item belonging to another team');
    }

    // FR-13: Optimistic Concurrency Control check
    if (existing.version !== input.version) {
      throw new ConflictError(
        'Conflict: This work item has been modified by another user. Please reload the page to get the latest state.'
      );
    }

    const updates: Prisma.WorkItemUpdateInput = {
      version: { increment: 1 },
    };

    const changes: Record<string, { from: any; to: any }> = {};

    if (input.title !== undefined && input.title !== existing.title) {
      updates.title = input.title;
      changes.title = { from: existing.title, to: input.title };
    }

    if (input.description !== undefined && input.description !== existing.description) {
      updates.description = input.description;
      changes.description = { from: existing.description, to: input.description };
    }

    if (input.priority !== undefined && input.priority !== existing.priority) {
      // Only Lead or Admin or assigned user can change priority
      if (user.role === Role.MEMBER && existing.assigneeId !== user.id) {
        throw new ForbiddenError('Only the assigned member or team lead can change task priority');
      }
      updates.priority = input.priority;
      changes.priority = { from: existing.priority, to: input.priority };
    }

    if (input.assigneeId !== undefined && input.assigneeId !== existing.assigneeId) {
      // Only Lead or Admin can freely reassign tasks to other members
      if (user.role === Role.MEMBER && input.assigneeId !== user.id && input.assigneeId !== null) {
        throw new ForbiddenError('Members can only claim for themselves or unassign themselves. Reassigning requires Lead role.');
      }
      updates.assignee = input.assigneeId ? { connect: { id: input.assigneeId } } : { disconnect: true };
      changes.assigneeId = { from: existing.assigneeId, to: input.assigneeId };
    }

    if (input.dueDate !== undefined) {
      const parsedDate = input.dueDate ? new Date(input.dueDate) : null;
      updates.dueDate = parsedDate;
      changes.dueDate = { from: existing.dueDate, to: parsedDate };
    }

    return await prisma.$transaction(async (tx: any) => {
      // Atomic update matching both id and version to guard against concurrent race conditions
      const result = await tx.workItem.updateMany({
        where: {
          id,
          version: input.version,
        },
        data: updates,
      });

      if (result.count === 0) {
        throw new ConflictError(
          'Conflict: Work item was updated concurrently by another request. Please reload.'
        );
      }

      if (Object.keys(changes).length > 0) {
        await tx.activityLog.create({
          data: {
            workItemId: id,
            userId: user.id,
            action: 'UPDATED',
            details: JSON.stringify(changes),
          },
        });
      }

      return await tx.workItem.findUnique({
        where: { id },
        include: {
          team: true,
          reporter: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
    });
  }

  /**
   * Atomic Claim Action (FR-05).
   * Ensures that two concurrent users cannot claim the same unassigned task.
   */
  static async claimWorkItem(id: string, user: AuthUser, currentVersion: number) {
    if (user.role === Role.VIEWER) {
      throw new ForbiddenError('Viewers cannot claim work items');
    }

    const item = await prisma.workItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundError('Work item not found');
    }

    if (!canAccessTeam(user.role, user.teamId, item.teamId)) {
      throw new ForbiddenError('Cannot claim task from another team');
    }

    if (item.assigneeId !== null) {
      throw new BadRequestError('This work item is already assigned or claimed');
    }

    // Atomic OCC conditional update
    const updateResult = await prisma.workItem.updateMany({
      where: {
        id,
        assigneeId: null, // Guard condition: MUST still be unassigned
        version: currentVersion,
      },
      data: {
        assigneeId: user.id,
        version: { increment: 1 },
      },
    });

    if (updateResult.count === 0) {
      // Race condition occurred!
      const freshItem = await prisma.workItem.findUnique({ where: { id } });
      if (freshItem?.assigneeId) {
        throw new ConflictError('Race condition: Task was just claimed by another user!');
      }
      throw new ConflictError('Work item was updated by another user. Please reload.');
    }

    // Record in immutable activity log
    await prisma.activityLog.create({
      data: {
        workItemId: id,
        userId: user.id,
        action: 'CLAIMED',
        details: JSON.stringify({ assignedTo: user.name, userId: user.id }),
      },
    });

    return await prisma.workItem.findUnique({
      where: { id },
      include: {
        team: true,
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Workflow state transition and Lead Approval (FR-06, FR-07).
   */
  static async transitionStatus(
    id: string,
    targetStatus: Status,
    user: AuthUser,
    currentVersion: number
  ) {
    if (user.role === Role.VIEWER) {
      throw new ForbiddenError('Viewers cannot transition status');
    }

    const item = await prisma.workItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundError('Work item not found');
    }

    if (!canAccessTeam(user.role, user.teamId, item.teamId)) {
      throw new ForbiddenError('Cannot modify work items outside your team');
    }

    if (item.version !== currentVersion) {
      throw new ConflictError('Work item was updated by another user. Please reload.');
    }

    // Validate workflow transition sequence
    const allowed = (ALLOWED_TRANSITIONS as any)[item.status] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestError(
        `Invalid status transition from ${item.status} to ${targetStatus}. Allowed: [${allowed.join(', ')}]`
      );
    }

    // FR-07: Lead Approval Check
    // Moving from IN_REVIEW to RESOLVED requires LEAD or ADMIN role!
    if (item.status === Status.IN_REVIEW && targetStatus === Status.RESOLVED) {
      if (user.role !== Role.LEAD && user.role !== Role.ADMIN) {
        throw new ForbiddenError(
          'Approval required: Only an authorized Team Lead or Admin can approve and resolve this work item.'
        );
      }
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const updateResult = await tx.workItem.updateMany({
        where: { id, version: currentVersion },
        data: {
          status: targetStatus,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictError('Status transition failed due to a concurrent update. Please reload.');
      }

      await tx.activityLog.create({
        data: {
          workItemId: id,
          userId: user.id,
          action: targetStatus === Status.RESOLVED && item.status === Status.IN_REVIEW ? 'APPROVED' : 'STATUS_CHANGE',
          details: JSON.stringify({
            fromStatus: item.status,
            toStatus: targetStatus,
            approvedByLead: user.role === Role.LEAD || user.role === Role.ADMIN,
          }),
        },
      });

      return await tx.workItem.findUnique({
        where: { id },
        include: {
          team: true,
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return result;
  }

  /**
   * Add comment to work item (FR-09).
   */
  static async addComment(id: string, content: string, user: AuthUser) {
    if (!content || !content.trim()) {
      throw new BadRequestError('Comment content cannot be empty');
    }

    const item = await prisma.workItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundError('Work item not found');
    }

    if (!canAccessTeam(user.role, user.teamId, item.teamId)) {
      throw new ForbiddenError('Cannot comment on work items from another team');
    }

    return await prisma.$transaction(async (tx: any) => {
      const comment = await tx.comment.create({
        data: {
          workItemId: id,
          userId: user.id,
          content: content.trim(),
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          workItemId: id,
          userId: user.id,
          action: 'COMMENT_ADDED',
          details: JSON.stringify({ commentId: comment.id }),
        },
      });

      return comment;
    });
  }
}
