import { Role, Status, Priority, Prisma } from '@prisma/client';
import prisma from '../utils/db';
import { AuthUser } from '../types';

export class DashboardService {
  static async getDashboardQueues(user: AuthUser) {
    const teamFilter: Prisma.WorkItemWhereInput = user.role === Role.ADMIN
      ? {}
      : { teamId: user.teamId as string };

    // 1. Assigned to Me (current user's active work items)
    const assignedToMePromise = prisma.workItem.findMany({
      where: {
        assigneeId: user.id,
        status: { in: [Status.OPEN, Status.IN_PROGRESS, Status.IN_REVIEW] },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { updatedAt: 'desc' }],
      take: 10,
      include: {
        team: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
    });

    // 2. Unassigned Urgent (URGENT or HIGH priority without an assignee in the user's permitted team)
    const unassignedUrgentPromise = prisma.workItem.findMany({
      where: {
        ...teamFilter,
        assigneeId: null,
        priority: { in: [Priority.URGENT, Priority.HIGH] },
        status: { in: [Status.OPEN, Status.IN_PROGRESS] },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 10,
      include: {
        team: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
    });

    // 3. Awaiting My Approval (Items in IN_REVIEW status)
    // If user is LEAD or ADMIN, items in IN_REVIEW in their team require their approval
    const awaitingMyApprovalPromise = (user.role === Role.LEAD || user.role === Role.ADMIN)
      ? prisma.workItem.findMany({
          where: {
            ...teamFilter,
            status: Status.IN_REVIEW,
          },
          orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
          take: 10,
          include: {
            team: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true, email: true } },
            reporter: { select: { id: true, name: true, email: true } },
          },
        })
      : Promise.resolve([]);

    // Metrics counts
    const [
      assignedToMe,
      unassignedUrgent,
      awaitingApproval,
      totalOpen,
      totalPendingApproval,
      totalUrgent,
      totalCompleted,
    ] = await Promise.all([
      assignedToMePromise,
      unassignedUrgentPromise,
      awaitingMyApprovalPromise,
      prisma.workItem.count({
        where: {
          ...teamFilter,
          status: { in: [Status.OPEN, Status.IN_PROGRESS] },
        },
      }),
      prisma.workItem.count({
        where: {
          ...teamFilter,
          status: Status.IN_REVIEW,
        },
      }),
      prisma.workItem.count({
        where: {
          ...teamFilter,
          priority: Priority.URGENT,
          status: { in: [Status.OPEN, Status.IN_PROGRESS, Status.IN_REVIEW] },
        },
      }),
      prisma.workItem.count({
        where: {
          ...teamFilter,
          status: { in: [Status.RESOLVED, Status.CLOSED] },
        },
      }),
    ]);

    return {
      metrics: {
        totalOpen,
        totalPendingApproval,
        totalUrgent,
        totalCompleted,
        assignedToMeCount: assignedToMe.length,
      },
      queues: {
        assignedToMe,
        unassignedUrgent,
        awaitingMyApproval: awaitingApproval,
      },
    };
  }
}
