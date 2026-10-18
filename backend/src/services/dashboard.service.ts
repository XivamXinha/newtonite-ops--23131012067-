import { Role, Status, Priority, Prisma } from '@prisma/client';
import prisma from '../utils/db';
import { AuthUser } from '../types';

export class DashboardService {
  static async getDashboardQueues(user: AuthUser) {
    // 0. Fetch fresh user to reflect any real-time team assignments or role changes made by admin
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    const effectiveRole = freshUser?.role || user.role;
    const effectiveTeamId = freshUser?.teamId || user.teamId;

    // Fetch all teams
    const allTeams = await prisma.team.findMany({
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
        workItems: { select: { id: true, title: true, status: true, priority: true, type: true } },
      },
    });

    // Teams where user is Leader
    const leadTeams = allTeams.filter((t: any) =>
      t.leadUserId === user.id ||
      t.users?.some((u: any) => u.id === user.id && u.role === Role.LEAD) ||
      (effectiveTeamId === t.id && effectiveRole === Role.LEAD)
    );

    // Teams where user is Member
    const memberTeams = allTeams.filter((t: any) =>
      !leadTeams.some((lt: any) => lt.id === t.id) &&
      (t.memberUserIds?.includes(user.id) ||
       t.users?.some((u: any) => u.id === user.id && (u.role === Role.MEMBER || u.role === Role.VIEWER)) ||
       (effectiveTeamId === t.id && (effectiveRole === Role.MEMBER || effectiveRole === Role.VIEWER)))
    );

    const leadTeam = leadTeams[0] || null;
    const memberTeam = memberTeams[0] || null;

    const leadTeamIds = leadTeams.map((t: any) => t.id);
    const memberTeamIds = memberTeams.map((t: any) => t.id);
    const allUserTeamIds = Array.from(new Set([
      ...(effectiveTeamId ? [effectiveTeamId] : []),
      ...leadTeamIds,
      ...memberTeamIds,
    ]));

    const teamFilter: Prisma.WorkItemWhereInput = effectiveRole === Role.ADMIN
      ? {}
      : allUserTeamIds.length > 0
        ? { teamId: { in: allUserTeamIds } }
        : { teamId: 'unassigned-team-filter-none' };

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

    // 2. Priority Tasks (URGENT or HIGH priority in user's teams)
    const unassignedUrgentPromise = prisma.workItem.findMany({
      where: {
        ...teamFilter,
        priority: { in: [Priority.URGENT, Priority.HIGH] },
        status: { in: [Status.OPEN, Status.IN_PROGRESS, Status.IN_REVIEW] },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 20,
      include: {
        team: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
    });

    // 3. Awaiting My Approval (Items in IN_REVIEW status)
    // Destination Team Leads see cross-team task requests sent to their teams!
    const isLeadOrAdmin = effectiveRole === Role.ADMIN || leadTeams.length > 0 || effectiveRole === Role.LEAD;
    const approvalTeamFilter = effectiveRole === Role.ADMIN
      ? {}
      : leadTeamIds.length > 0
        ? { teamId: { in: leadTeamIds } }
        : (effectiveTeamId ? { teamId: effectiveTeamId } : { teamId: 'none' });

    const awaitingMyApprovalPromise = isLeadOrAdmin
      ? prisma.workItem.findMany({
          where: {
            ...approvalTeamFilter,
            status: Status.IN_REVIEW,
          },
          orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
          take: 20,
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
          ...approvalTeamFilter,
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

    // 4. Squad Tasks:
    // Important: cross-team requests that are unassigned and in IN_REVIEW are pending lead approval,
    // so they MUST NOT appear in members' "New Tasks" queue until the destination lead accepts them!
    const newTasks = await prisma.workItem.findMany({
      where: {
        ...teamFilter,
        NOT: [{ status: Status.IN_REVIEW, assigneeId: null }],
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 40,
      include: {
        team: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    const unclaimedCount = newTasks.filter((t: any) => !t.assigneeId).length;

    // 5. Team Activity Log (timeline of all activities in the user's squads and user's cross-team initiatives)
    const teamActivities = await prisma.activityLog.findMany({
      where: effectiveRole === Role.ADMIN
        ? {}
        : {
            OR: [
              { workItem: { ...teamFilter } },
              { userId: user.id },
              ...(allUserTeamIds.length > 0 ? [{ workItem: { teamId: { in: allUserTeamIds } } }] : []),
            ],
          },
      orderBy: [{ createdAt: 'desc' }],
      take: 80,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        workItem: {
          select: {
            id: true,
            title: true,
            status: true,
            teamId: true,
            reporterId: true,
            assigneeId: true,
            team: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      metrics: {
        totalOpen,
        totalPendingApproval,
        totalUrgent,
        totalCompleted,
        assignedToMeCount: assignedToMe.length,
        unclaimedNewTasksCount: unclaimedCount,
      },
      queues: {
        assignedToMe,
        unassignedUrgent,
        awaitingMyApproval: awaitingApproval,
        newTasks,
      },
      teamActivities,
      allTeams: allTeams.map((t: any) => {
        const lead = t.users?.find((u: any) => u.role === Role.LEAD);
        const members = t.users?.filter((u: any) => u.role !== Role.LEAD) || [];
        return {
          id: t.id,
          name: t.name,
          description: t.description,
          leadUserId: lead?.id || null,
          memberUserIds: members.map((m: any) => m.id),
          users: t.users || [],
          workItems: t.workItems || [],
        };
      }),
      myTeam: leadTeam || memberTeam || null,
      leadTeam,
      memberTeam,
      leadTeams,
      memberTeams,
      userRole: effectiveRole,
      userTeamId: effectiveTeamId || null,
    };
  }
}
