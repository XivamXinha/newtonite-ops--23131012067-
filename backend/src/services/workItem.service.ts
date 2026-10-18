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
  IN_REVIEW: [Status.RESOLVED, Status.IN_PROGRESS, Status.OPEN, Status.CLOSED, Status.IN_REVIEW], // Moving to RESOLVED, accepting cross-team request to OPEN, forwarding to destination lead IN_REVIEW, or REJECTING to CLOSED
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
        return {
          items: [],
          pagination: {
            totalCount: 0,
            page,
            limit,
            totalPages: 1,
          },
        };
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
      const team = await prisma.team.findUnique({ where: { id: item.teamId } });
      const isLeadOrMember = team && (
        team.leadUserId === user.id ||
        team.memberUserIds?.includes(user.id) ||
        team.users?.some((u: any) => u.id === user.id)
      );
      const isReporterOrAssignee = item.reporterId === user.id || item.assigneeId === user.id;
      if (!isLeadOrMember && !isReporterOrAssignee) {
        throw new ForbiddenError('Unauthorized: You cannot access work items of another team');
      }
    }

    // Requirement: When a task is claimed, only the assigned member, task creator, team lead, or admin can access it!
    if (item.assigneeId !== null && user.role === Role.MEMBER) {
      const isOwner = item.assigneeId === user.id;
      const isCreator = item.reporterId === user.id;
      if (!isOwner && !isCreator) {
        throw new ForbiddenError(
          `Access restricted: This task has been claimed by ${item.assignee?.name || 'another member'}. Only the assigned owner, squad lead, or administrator can access it.`
        );
      }
    }

    return item;
  }

  /**
   * Create a new task or incident (FR-03).
   * Appends CREATED to the immutable activity log (FR-08).
   */
  static async createWorkItem(user: AuthUser, input: CreateWorkItemInput & { status?: Status; targetTeamId?: string | null }) {
    if (user.role === Role.VIEWER) {
      throw new ForbiddenError('Viewers are not permitted to create work items');
    }

    const originTeamId = input.teamId || (user.teamId as string);
    if (!originTeamId) {
      throw new BadRequestError('Team ID is required to create a work item');
    }

    const originTeam = await prisma.team.findUnique({ where: { id: originTeamId } });
    if (!originTeam) {
      throw new NotFoundError('Origin team not found');
    }

    const userLeadTeamIds = user.leadTeamIds || [];
    const isUserLead = user.role === Role.ADMIN ||
      user.role === Role.LEAD ||
      Boolean(user.isLead) ||
      (originTeam && (originTeam.leadUserId === user.id || originTeam.users?.some((u: any) => u.id === user.id && u.role === Role.LEAD))) ||
      userLeadTeamIds.includes(originTeamId);

    const isCrossTeam = Boolean(input.targetTeamId && input.targetTeamId !== originTeamId);

    let assignedTeamId = originTeamId;
    let initialStatus = input.status || Status.OPEN;
    let crossTeamStage: string | null = null;
    let flowDescription = 'Flow 1: Same-team assignment';

    if (isCrossTeam) {
      const destTeam = await prisma.team.findUnique({ where: { id: input.targetTeamId! } });
      if (!destTeam) {
        throw new NotFoundError('Destination team not found');
      }

      if (isUserLead) {
        // Flow 2: Cross-team request by lead
        // Team A Lead -> Team B Lead Approval -> Team B Claim Queue -> Team B Member
        assignedTeamId = input.targetTeamId!;
        initialStatus = Status.IN_REVIEW;
        crossTeamStage = 'AWAITING_DEST_LEAD_APPROVAL';
        flowDescription = `Flow 2: Cross-team request by Lead ${user.name} (${originTeam.name} -> ${destTeam.name}). Awaiting ${destTeam.name} Lead approval.`;
      } else {
        // Flow 3: Cross-team request by member
        // Team A Member -> Team A Lead Approval -> Team B Lead Approval -> Team B Claim Queue -> Team B Member
        assignedTeamId = originTeamId; // Stays with origin team first for origin lead sign-off!
        initialStatus = Status.IN_REVIEW;
        crossTeamStage = 'AWAITING_ORIGIN_LEAD_APPROVAL';
        flowDescription = `Flow 3: Cross-team request by Member ${user.name} (${originTeam.name} -> ${destTeam.name}). Awaiting origin Team Lead approval first.`;
      }
    } else {
      // Flow 1: Same-team assignment
      // Team Lead -> Team Member -> Work on Task
      initialStatus = input.assigneeId ? Status.OPEN : Status.OPEN;
      flowDescription = input.assigneeId
        ? `Flow 1: Same-team assignment directly to member.`
        : `Flow 1: Same-team task created in squad claim queue.`;
    }

    const dueDate = input.dueDate ? new Date(input.dueDate) : null;

    return await prisma.$transaction(async (tx: any) => {
      const workItem = await tx.workItem.create({
        data: {
          title: input.title,
          description: input.description,
          type: input.type,
          priority: input.priority,
          status: initialStatus,
          teamId: assignedTeamId,
          targetTeamId: input.targetTeamId || null,
          reporterId: user.id,
          assigneeId: isCrossTeam ? null : (input.assigneeId || null),
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
          action: isCrossTeam
            ? (isUserLead ? 'CROSS_TEAM_REQUEST_BY_LEAD' : 'CROSS_TEAM_REQUEST_BY_MEMBER')
            : 'CREATED',
          details: JSON.stringify({
            title: workItem.title,
            type: workItem.type,
            priority: workItem.priority,
            assigneeId: workItem.assigneeId,
            originTeamId,
            targetTeamId: input.targetTeamId || null,
            crossTeamStage,
            flowDescription,
            pendingApproval: initialStatus === Status.IN_REVIEW,
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

    if (user.role === Role.LEAD) {
      throw new ForbiddenError('Team Leaders are not permitted to claim tasks. Tasks must be claimed by squad members.');
    }

    const item = await prisma.workItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundError('Work item not found');
    }

    const team = await prisma.team.findUnique({ where: { id: item.teamId } });

    // Strict Rule: Team Leaders cannot claim tasks (leaders only create, accept/approve & review)
    const isLeadOfTeam = (user.role as any) === Role.LEAD ||
      (team && team.leadUserId === user.id) ||
      (user.leadTeamIds && user.leadTeamIds.includes(item.teamId));
    if (isLeadOfTeam) {
      throw new ForbiddenError('Team Leaders are not permitted to claim tasks. Tasks must be claimed by squad members.');
    }

    // Task creator cannot claim their own task
    if (item.reporterId === user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenError('Task creators cannot claim their own task. It must be claimed by other squad members.');
    }

    // Strict Rule: Task must be in OPEN status to be claimable!
    // Cannot claim tasks that are IN_REVIEW (cross-team request awaiting lead acceptance)
    if (item.status === Status.IN_REVIEW) {
      throw new BadRequestError('This cross-team request is awaiting Team Lead acceptance and cannot be claimed yet.');
    }
    if (item.status && item.status !== Status.OPEN) {
      throw new BadRequestError(`Cannot claim task in ${item.status} status. Only tasks in OPEN status can be claimed.`);
    }

    if (item.assigneeId !== null) {
      throw new BadRequestError('This work item is already assigned or claimed');
    }

    // Atomic OCC conditional update - ensures strictly ONE member claims even under simultaneous attempts
    const updateResult = await prisma.workItem.updateMany({
      where: {
        id,
        assigneeId: null, // Guard condition: MUST still be unassigned
        status: Status.OPEN, // Guard condition: MUST still be OPEN
        version: currentVersion,
      },
      data: {
        assigneeId: user.id,
        status: Status.IN_PROGRESS,
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
        details: JSON.stringify({
          assignedTo: user.name,
          userId: user.id,
          message: `Task successfully claimed by ${user.name}`,
        }),
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
    currentVersion: number,
    claimForSelf: boolean = false,
    comment?: string
  ) {
    if (user.role === Role.VIEWER) {
      throw new ForbiddenError('Viewers cannot transition status');
    }

    const item = await prisma.workItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundError('Work item not found');
    }

    const team = await prisma.team.findUnique({ where: { id: item.teamId } });

    if (!canAccessTeam(user.role, user.teamId, item.teamId)) {
      const isLeadOrMember = team && (
        team.leadUserId === user.id ||
        team.memberUserIds?.includes(user.id) ||
        team.users?.some((u: any) => u.id === user.id) ||
        (user.leadTeamIds && user.leadTeamIds.includes(item.teamId))
      );
      if (!isLeadOrMember) {
        throw new ForbiddenError('Cannot modify work items outside your team');
      }
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
      const isLead = user.role === Role.ADMIN ||
        user.role === Role.LEAD ||
        (team && (team.leadUserId === user.id || team.users?.some((u: any) => u.id === user.id && u.role === Role.LEAD))) ||
        (user.leadTeamIds && user.leadTeamIds.includes(item.teamId));
      if (!isLead) {
        throw new ForbiddenError(
          'Approval required: Only an authorized Team Lead or Admin can approve and resolve this work item.'
        );
      }
      if (item.assigneeId === user.id && user.role !== Role.ADMIN) {
        throw new ForbiddenError(
          'Self-approval forbidden: You cannot approve and resolve your own task. Approval must be performed by your Team Lead.'
        );
      }
    }

    // Flow 3 Stage 1 check: Is this a member cross-team request awaiting origin lead approval to forward?
    const isOriginLeadForwarding =
      item.status === Status.IN_REVIEW &&
      Boolean((item as any).targetTeamId && (item as any).targetTeamId !== item.teamId) &&
      (targetStatus === Status.IN_REVIEW || targetStatus === Status.OPEN);

    // Accepting, forwarding, returning, or rejecting cross-team request or review item requires Lead or Admin role
    if (item.status === Status.IN_REVIEW && (targetStatus === Status.OPEN || targetStatus === Status.CLOSED || targetStatus === Status.IN_REVIEW || targetStatus === Status.IN_PROGRESS)) {
      const isTeamLead = user.role === Role.ADMIN ||
        (user.role as any) === Role.LEAD ||
        (team && (team.leadUserId === user.id || team.users?.some((u: any) => u.id === user.id && u.role === Role.LEAD))) ||
        (user.leadTeamIds && user.leadTeamIds.includes(item.teamId)) ||
        (user.teamId === item.teamId && ((user.role as any) === Role.LEAD || (team && team.leadUserId === user.id)));
      if (!isTeamLead) {
        throw new ForbiddenError(
          'Approval required: Only the authorized Team Lead or Admin can review, return, reject, or accept tasks under review.'
        );
      }
      if (item.assigneeId && item.assigneeId === user.id && user.role !== Role.ADMIN) {
        throw new ForbiddenError(
          'Self-review forbidden: Only your Team Lead or Admin can review, return, or resolve this task.'
        );
      }
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const updateData: any = {
        status: targetStatus,
        version: { increment: 1 },
      };

      let actionName = 'STATUS_CHANGE';
      let message: string | undefined;

      if (isOriginLeadForwarding) {
        // Flow 3 Stage 1: Origin Team Lead approves -> Forward to destination team for destination Lead approval!
        updateData.teamId = (item as any).targetTeamId;
        updateData.status = Status.IN_REVIEW; // Remains in IN_REVIEW for destination Lead to accept
        actionName = 'APPROVED_BY_ORIGIN_LEAD';
        message = `Flow 3: Cross-team request approved by origin Team Lead ${user.name}. Forwarded to destination Team Lead for acceptance.`;
      } else if (item.status === Status.IN_REVIEW && targetStatus === Status.OPEN) {
        // Flow 2 / Flow 3 Stage 2: Destination Team Lead accepts -> Enters destination squad claim queue!
        updateData.assigneeId = null;
        actionName = 'ACCEPTED';
        message = `Cross-team request accepted by Team Lead ${user.name}. Sent to squad claim queue.`;
      } else if (item.status === Status.IN_REVIEW && targetStatus === Status.CLOSED) {
        actionName = 'REJECTED_BY_LEAD';
        message = `Cross-team request rejected by Team Lead ${user.name}: ${comment || 'No reason provided'}`;
      } else if (claimForSelf && targetStatus === Status.IN_PROGRESS) {
        updateData.assigneeId = user.id;
      } else if (item.status === Status.IN_REVIEW && targetStatus === Status.OPEN) {
        updateData.assigneeId = null;
      }

      const updateResult = await tx.workItem.updateMany({
        where: { id, version: currentVersion },
        data: updateData,
      });

      if (updateResult.count === 0) {
        throw new ConflictError('Status transition failed due to a concurrent update. Please reload.');
      }

      // If a comment was included with this transition, persist it into the task discussion
      if (comment && comment.trim()) {
        await tx.comment.create({
          data: {
            workItemId: id,
            userId: user.id,
            content: comment.trim(),
          },
        });
      }

      let submissionAttempt = 0;

      if (item.status === Status.IN_PROGRESS && targetStatus === Status.IN_REVIEW) {
        actionName = 'SUBMITTED_FOR_APPROVAL';
        const prevCount = await tx.activityLog.count({
          where: { workItemId: id, action: 'SUBMITTED_FOR_APPROVAL' },
        });
        submissionAttempt = prevCount + 1;
      } else if (item.status === Status.IN_REVIEW && targetStatus === Status.IN_PROGRESS) {
        actionName = 'CHANGES_REQUESTED_BY_LEAD';
        message = `Revisions requested by Team Lead ${user.name}: ${comment || 'Please update and resubmit'}`;
      } else if (targetStatus === Status.RESOLVED && item.status === Status.IN_REVIEW) {
        actionName = 'APPROVED';
        message = `Task officially approved and resolved by Team Lead ${user.name}.`;
      } else if (targetStatus === Status.CLOSED && actionName === 'STATUS_CHANGE') {
        actionName = 'CLOSED';
      }

      await tx.activityLog.create({
        data: {
          workItemId: id,
          userId: user.id,
          action: actionName,
          details: JSON.stringify({
            fromStatus: item.status,
            toStatus: updateData.status,
            submissionAttempt: submissionAttempt || undefined,
            userRole: user.role,
            userName: user.name,
            comment: comment ? comment.trim() : undefined,
            forwardedToDestTeam: isOriginLeadForwarding,
            acceptedByLead: targetStatus === Status.OPEN && item.status === Status.IN_REVIEW,
            approvedForMembers: targetStatus === Status.OPEN && item.status === Status.IN_REVIEW,
            rejectedByLead: targetStatus === Status.CLOSED && item.status === Status.IN_REVIEW,
            changesRequested: item.status === Status.IN_REVIEW && targetStatus === Status.IN_PROGRESS,
            approvedByLead: targetStatus === Status.RESOLVED,
            closedOfficially: targetStatus === Status.CLOSED,
            message,
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

  /**
   * Delete work item: Only allowed by the creator (reporter) or Admin.
   */
  static async deleteWorkItem(id: string, user: AuthUser) {
    const item = await prisma.workItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundError('Work item not found');
    }

    if (item.reporterId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenError('Only the creator of this task or an Administrator can delete it.');
    }

    return await prisma.workItem.delete({ where: { id } });
  }
}
