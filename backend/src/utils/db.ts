import { PrismaClient, Role, WorkItemType, Priority, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const realPrisma = new PrismaClient({
  log: ['error'],
});

// Seed data template
const SEED_TEAMS = [
  {
    id: 'team-eng',
    name: 'Engineering',
    description: 'Core product development & distributed backend',
    leadUserId: 'u-employ-1',
    memberUserIds: ['u-employ-2', 'u-employ-3', 'u-employ-4', 'u-employ-5'],
  },
  {
    id: 'team-devops',
    name: 'DevOps & IT Support',
    description: 'Cloud infrastructure, CI/CD, and internal IT',
    leadUserId: 'u-employ-6',
    memberUserIds: ['u-employ-7', 'u-employ-8', 'u-employ-9', 'u-employ-10'],
  },
  {
    id: 'team-sec',
    name: 'Security Operations',
    description: 'SecOps, vulnerability mitigation, and compliance',
    leadUserId: 'u-employ-11',
    memberUserIds: ['u-employ-12', 'u-employ-13', 'u-employ-14'],
  },
];

const defaultPasswordHash = bcrypt.hashSync('123456', 10);

// Helper function to build 20 employee users
const buildEmployees = () => {
  const users = [];
  for (let i = 1; i <= 20; i++) {
    const email = `employ${i}@gmail.com`;
    const isAdmin = i === 20;
    const role = isAdmin ? Role.ADMIN : Role.MEMBER;
    // Assign some members to initial teams, others unassigned
    let teamId: string | null = null;
    if (!isAdmin) {
      if (i <= 5) teamId = 'team-eng';
      else if (i <= 10) teamId = 'team-devops';
      else if (i <= 14) teamId = 'team-sec';
      else teamId = null; // employ15 to employ19 unassigned to test empty team member state
    }

    users.push({
      id: `u-employ-${i}`,
      email,
      name: isAdmin ? `Employee 20 (Admin)` : `Employee ${i}`,
      role,
      teamId,
      passwordHash: defaultPasswordHash,
    });
  }
  return users;
};

const SEED_USERS = buildEmployees();

const SEED_WORK_ITEMS = [
  // Flow 1: Same-team assignment: Engineering Lead (u-employ-1) assigned to Employee 2 (u-employ-2)
  {
    id: 'wi-flow1-same-team',
    title: 'Flow 1: OAuth2.0 Token Revocation Protocol',
    description: 'Same-team assignment: Assigned by Engineering Lead to Employee 2. Currently being worked on.',
    type: WorkItemType.TASK,
    priority: Priority.HIGH,
    status: Status.IN_PROGRESS,
    teamId: 'team-eng',
    targetTeamId: null,
    reporterId: 'u-employ-1',
    assigneeId: 'u-employ-2',
    dueDate: new Date(Date.now() + 3 * 86400000),
    version: 1,
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(),
  },
  // Flow 2: Cross-team request by lead: Engineering Lead (u-employ-1) requested DevOps (team-devops)
  // Awaiting DevOps Lead (u-employ-6) approval! Once accepted, enters DevOps claim queue for DevOps members.
  {
    id: 'wi-flow2-lead-cross-team',
    title: 'Flow 2: Cloudflare Edge SSL & WAF Rules Provisioning',
    description: 'Cross-team request created by Engineering Lead (Employee 1) targeting DevOps. Awaiting DevOps Lead acceptance to release to DevOps Claim Queue.',
    type: WorkItemType.TASK,
    priority: Priority.HIGH,
    status: Status.IN_REVIEW,
    teamId: 'team-devops',
    targetTeamId: 'team-devops',
    reporterId: 'u-employ-1',
    assigneeId: null,
    dueDate: new Date(Date.now() + 2 * 86400000),
    version: 1,
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(),
  },
  // Flow 3: Cross-team request by member: Engineering Member (u-employ-3) requested DevOps (team-devops)
  // Awaiting Engineering Lead (u-employ-1) approval first! Once approved, goes to DevOps Lead, then DevOps claim queue.
  {
    id: 'wi-flow3-member-cross-team',
    title: 'Flow 3: CI/CD Docker Cache Optimization for Monorepo',
    description: 'Cross-team request initiated by Engineering Member (Employee 3) targeting DevOps. Awaiting origin Engineering Lead (Employee 1) approval to forward.',
    type: WorkItemType.TASK,
    priority: Priority.MEDIUM,
    status: Status.IN_REVIEW,
    teamId: 'team-eng', // In Engineering awaiting Engineering Lead approval!
    targetTeamId: 'team-devops', // Destination is DevOps!
    reporterId: 'u-employ-3',
    assigneeId: null,
    dueDate: new Date(Date.now() + 4 * 86400000),
    version: 1,
    createdAt: new Date(Date.now() - 1800000),
    updatedAt: new Date(),
  },
  // Flow 1 Unassigned task in DevOps claim queue (ready for DevOps members to claim)
  {
    id: 'wi-flow1-unassigned-claimable',
    title: 'Flow 1: Terraform Staging Environment Drift Remediation',
    description: 'Unassigned squad task in DevOps claim queue. Any DevOps member can claim this task and work on it.',
    type: WorkItemType.TASK,
    priority: Priority.MEDIUM,
    status: Status.OPEN,
    teamId: 'team-devops',
    targetTeamId: null,
    reporterId: 'u-employ-6',
    assigneeId: null,
    dueDate: new Date(Date.now() + 5 * 86400000),
    version: 1,
    createdAt: new Date(Date.now() - 9000000),
    updatedAt: new Date(),
  },
];

let mockTeams = [...SEED_TEAMS];
let mockUsers = [...SEED_USERS];
let mockWorkItems: any[] = [...SEED_WORK_ITEMS];
let mockActivities: any[] = [];
let mockComments: any[] = [];

let mockIdempotency: Record<string, { statusCode: number; responseBody: string; expiresAt: Date }> = {};

let isPostgresAvailable = false;
let checkDone = false;

// Probe PostgreSQL on boot
async function probePostgres(): Promise<boolean> {
  if (checkDone) return isPostgresAvailable;
  try {
    await realPrisma.$connect();
    isPostgresAvailable = true;
    console.log('✅ Connected to live PostgreSQL database via Prisma.');
  } catch (err) {
    isPostgresAvailable = false;
    console.log('ℹ️  PostgreSQL not active locally (localhost:5432).');
    console.log('⚡ Running in High-Fidelity In-Memory Dev Store with seeded demo users & queues.');
    console.log('💡 To use PostgreSQL via Docker: run `docker compose up -d`');
  }
  checkDone = true;
  return isPostgresAvailable;
}

// Memory store operations matching Prisma API exactly
const memoryStore = {
  user: {
    async findUnique(args: { where: { email?: string; id?: string }; include?: any }) {
      const u = mockUsers.find((x) =>
        args.where.email ? x.email.toLowerCase() === args.where.email.toLowerCase() : x.id === args.where.id
      );
      if (!u) return null;
      const team = mockTeams.find((t) => t.id === u.teamId) || null;
      return { ...u, team };
    },
    async findMany(args?: any) {
      return mockUsers.map((u) => ({
        ...u,
        team: mockTeams.find((t) => t.id === u.teamId) || null,
      }));
    },
    async update(args: { where: { id: string }; data: any }) {
      const idx = mockUsers.findIndex((u) => u.id === args.where.id);
      if (idx === -1) return null;
      mockUsers[idx] = { ...mockUsers[idx], ...args.data };
      const team = mockTeams.find((t) => t.id === mockUsers[idx].teamId) || null;
      return { ...mockUsers[idx], team };
    },
  },

  team: {
    async findUnique(args: { where: { id: string }; include?: any }) {
      const t = mockTeams.find((x) => x.id === args.where.id);
      if (!t) return null;
      const teamObj: any = { ...t };
      if (args.include?.users) {
        teamObj.users = mockUsers
          .filter((u) => u.teamId === t.id || t.leadUserId === u.id || t.memberUserIds?.includes(u.id))
          .map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: (t.leadUserId === u.id || (u.teamId === t.id && (u.role as any) === Role.LEAD)) ? Role.LEAD : Role.MEMBER,
          }));
      }
      if (args.include?.workItems) {
        teamObj.workItems = mockWorkItems.filter((w) => w.teamId === t.id).map((w) => enrichWorkItem(w, { assignee: true, reporter: true }));
      }
      return teamObj;
    },
    async findMany() {
      return mockTeams.map((t: any) => {
        const teamUsers = mockUsers.filter((u) => u.teamId === t.id || t.leadUserId === u.id || t.memberUserIds?.includes(u.id));
        const teamItems = mockWorkItems.filter((w) => w.teamId === t.id);
        return {
          ...t,
          users: teamUsers.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: (t.leadUserId === u.id || (u.teamId === t.id && (u.role as any) === Role.LEAD)) ? Role.LEAD : Role.MEMBER,
          })),
          workItems: teamItems.map((w) => enrichWorkItem(w, { assignee: true, reporter: true })),
          _count: {
            users: teamUsers.length,
            workItems: teamItems.length,
          },
        };
      });
    },
    async create(args: { data: any }) {
      const newTeam = {
        id: `team-${Date.now()}`,
        name: args.data.name,
        description: args.data.description || null,
        leadUserId: args.data.leadUserId || null,
        memberUserIds: args.data.memberUserIds || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeams.push(newTeam);
      return newTeam;
    },
    async delete(args: { where: { id: string } }) {
      const idx = mockTeams.findIndex((t) => t.id === args.where.id);
      if (idx === -1) return null;
      const [removed] = mockTeams.splice(idx, 1);
      mockUsers.forEach((u) => {
        if (u.teamId === args.where.id) {
          u.teamId = null;
        }
      });
      mockWorkItems = mockWorkItems.filter((w) => w.teamId !== args.where.id);
      return removed;
    },
  },

  workItem: {
    async count(args: { where?: any }) {
      const filtered = applyFilters(mockWorkItems, args?.where);
      return filtered.length;
    },

    async findMany(args: { where?: any; skip?: number; take?: number; orderBy?: any; include?: any }) {
      let result = applyFilters(mockWorkItems, args.where);
      // Sort
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      if (args.skip !== undefined || args.take !== undefined) {
        const start = args.skip || 0;
        const end = args.take ? start + args.take : undefined;
        result = result.slice(start, end);
      }
      return result.map((w) => enrichWorkItem(w, args.include));
    },

    async findUnique(args: { where: { id: string }; include?: any }) {
      const item = mockWorkItems.find((w) => w.id === args.where.id);
      if (!item) return null;
      return enrichWorkItem(item, args.include);
    },

    async create(args: { data: any; include?: any }) {
      const newItem = {
        id: `wi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: args.data.title,
        description: args.data.description,
        type: args.data.type,
        priority: args.data.priority,
        status: args.data.status || Status.OPEN,
        teamId: args.data.teamId,
        targetTeamId: args.data.targetTeamId || null,
        reporterId: args.data.reporterId,
        assigneeId: args.data.assigneeId || null,
        dueDate: args.data.dueDate || null,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockWorkItems.unshift(newItem);
      return enrichWorkItem(newItem, args.include);
    },

    async updateMany(args: { where: { id: string; version?: number; assigneeId?: any }; data: any }) {
      const index = mockWorkItems.findIndex((w) => w.id === args.where.id);
      if (index === -1) return { count: 0 };
      const current = mockWorkItems[index];

      // OCC version check
      if (args.where.version !== undefined && current.version !== args.where.version) {
        return { count: 0 };
      }

      // Assignee guard (for claim)
      if (args.where.assigneeId === null && current.assigneeId !== null) {
        return { count: 0 };
      }

      const updated = {
        ...current,
        ...args.data,
        version: current.version + 1,
        updatedAt: new Date(),
      };

      if (args.data.assignee) {
        if (args.data.assignee.disconnect) updated.assigneeId = null;
        if (args.data.assignee.connect) updated.assigneeId = args.data.assignee.connect.id;
      }

      mockWorkItems[index] = updated;
      return { count: 1 };
    },

    async delete(args: { where: { id: string } }) {
      const index = mockWorkItems.findIndex((w) => w.id === args.where.id);
      if (index === -1) return null;
      const [removed] = mockWorkItems.splice(index, 1);
      mockActivities = mockActivities.filter((a) => a.workItemId !== args.where.id);
      mockComments = mockComments.filter((c) => c.workItemId !== args.where.id);
      return removed;
    },
  },

  activityLog: {
    async count(args?: { where?: any }) {
      if (!args?.where) return mockActivities.length;
      return mockActivities.filter((a) => {
        if (args.where.workItemId && a.workItemId !== args.where.workItemId) return false;
        if (args.where.action && a.action !== args.where.action) return false;
        return true;
      }).length;
    },
    async findMany(args?: { where?: any; take?: number; orderBy?: any; include?: any }) {
      let list = [...mockActivities];
      if (args?.where) {
        list = list.filter((a) => {
          if (args.where.workItemId && a.workItemId !== args.where.workItemId) return false;
          if (args.where.action && a.action !== args.where.action) return false;
          if (args.where.workItem?.teamId) {
            const wi = mockWorkItems.find((w) => w.id === a.workItemId);
            if (!wi) return false;
            if (args.where.workItem.teamId.in && !args.where.workItem.teamId.in.includes(wi.teamId)) return false;
            if (typeof args.where.workItem.teamId === 'string' && wi.teamId !== args.where.workItem.teamId) return false;
          }
          return true;
        });
      }
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      if (args?.take) list = list.slice(0, args.take);
      return list.map((a) => {
        const u = mockUsers.find((usr) => usr.id === a.userId);
        const wi = mockWorkItems.find((w) => w.id === a.workItemId);
        const team = wi ? mockTeams.find((t) => t.id === wi.teamId) : null;
        return {
          ...a,
          user: u ? { id: u.id, name: u.name, email: u.email, role: u.role } : null,
          workItem: wi ? { id: wi.id, title: wi.title, status: wi.status, teamId: wi.teamId, team } : null,
        };
      });
    },
    async create(args: { data: any }) {
      const log = {
        id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        workItemId: args.data.workItemId,
        userId: args.data.userId,
        action: args.data.action,
        details: args.data.details || null,
        createdAt: new Date(),
      };
      mockActivities.unshift(log);
      return log;
    },
  },

  comment: {
    async create(args: { data: any; include?: any }) {
      const newComment = {
        id: `com-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        workItemId: args.data.workItemId,
        userId: args.data.userId,
        content: args.data.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockComments.unshift(newComment);
      const user = mockUsers.find((u) => u.id === newComment.userId);
      return {
        ...newComment,
        user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null,
      };
    },
  },

  idempotencyRecord: {
    async findUnique(args: { where: { idempotencyKey: string } }) {
      const rec = mockIdempotency[args.where.idempotencyKey];
      if (!rec) return null;
      return {
        id: 'idem-1',
        idempotencyKey: args.where.idempotencyKey,
        ...rec,
        createdAt: new Date(),
      };
    },
    async create(args: { data: any }) {
      mockIdempotency[args.data.idempotencyKey] = {
        statusCode: args.data.statusCode,
        responseBody: args.data.responseBody,
        expiresAt: args.data.expiresAt,
      };
      return { id: 'idem-rec', ...args.data };
    },
    async delete(args: { where: { idempotencyKey: string } }) {
      delete mockIdempotency[args.where.idempotencyKey];
    },
  },

  async $transaction(callback: any) {
    return await callback(memoryStore);
  },
};

function applyFilters(items: typeof mockWorkItems, where?: any): typeof mockWorkItems {
  if (!where) return [...items];
  return items.filter((item) => {
    if (where.teamId) {
      if (where.teamId.in && !where.teamId.in.includes(item.teamId)) return false;
      if (typeof where.teamId === 'string' && item.teamId !== where.teamId) return false;
    }
    if (where.status) {
      if (where.status.in && !where.status.in.includes(item.status)) return false;
      if (typeof where.status === 'string' && item.status !== where.status) return false;
    }
    if (where.priority) {
      if (where.priority.in && !where.priority.in.includes(item.priority)) return false;
      if (typeof where.priority === 'string' && item.priority !== where.priority) return false;
    }
    if (where.type && item.type !== where.type) return false;
    if (where.assigneeId !== undefined && item.assigneeId !== where.assigneeId) return false;

    if (where.NOT) {
      const notList = Array.isArray(where.NOT) ? where.NOT : [where.NOT];
      for (const clause of notList) {
        let matchesAll = true;
        if (clause.status !== undefined && item.status !== clause.status) matchesAll = false;
        if (clause.assigneeId !== undefined && item.assigneeId !== clause.assigneeId) matchesAll = false;
        if (clause.teamId !== undefined && item.teamId !== clause.teamId) matchesAll = false;
        if (matchesAll) return false;
      }
    }

    if (where.OR && Array.isArray(where.OR)) {
      const matchesSearch = where.OR.some((clause: any) => {
        if (clause.title?.contains) {
          return item.title.toLowerCase().includes(clause.title.contains.toLowerCase());
        }
        if (clause.description?.contains) {
          return item.description.toLowerCase().includes(clause.description.contains.toLowerCase());
        }
        return false;
      });
      if (!matchesSearch) return false;
    }
    return true;
  });
}

function enrichWorkItem(w: typeof mockWorkItems[0], include?: any) {
  const team = mockTeams.find((t) => t.id === w.teamId) || null;
  const targetTeam = w.targetTeamId ? mockTeams.find((t) => t.id === w.targetTeamId) || null : null;
  const reporter = mockUsers.find((u) => u.id === w.reporterId) || null;
  const assignee = mockUsers.find((u) => u.id === w.assigneeId) || null;

  const item: any = { ...w, targetTeam, targetTeamId: w.targetTeamId || null };
  item.team = team;
  if (include?.reporter) item.reporter = reporter ? { id: reporter.id, name: reporter.name, email: reporter.email, role: reporter.role } : null;
  if (include?.assignee) item.assignee = assignee ? { id: assignee.id, name: assignee.name, email: assignee.email, role: assignee.role } : null;

  if (include?.comments) {
    item.comments = mockComments
      .filter((c) => c.workItemId === w.id)
      .map((c) => {
        const u = mockUsers.find((usr) => usr.id === c.userId);
        return {
          ...c,
          user: u ? { id: u.id, name: u.name, email: u.email, role: u.role } : null,
        };
      });
  }

  if (include?.activities) {
    item.activities = mockActivities
      .filter((a) => a.workItemId === w.id)
      .map((a) => {
        const u = mockUsers.find((usr) => usr.id === a.userId);
        return {
          ...a,
          user: u ? { id: u.id, name: u.name, email: u.email, role: u.role } : null,
        };
      });
  }

  if (include?._count) {
    item._count = {
      comments: mockComments.filter((c) => c.workItemId === w.id).length,
      activities: mockActivities.filter((a) => a.workItemId === w.id).length,
    };
  }

  return item;
}

// Initial probe
probePostgres();

// Dynamic proxy that transparently delegates to real Prisma or high-fidelity store
export const prisma: any = new Proxy(realPrisma, {
  get(target: any, prop: string | symbol) {
    if (!isPostgresAvailable && typeof prop === 'string' && prop in memoryStore) {
      return (memoryStore as any)[prop];
    }
    return target[prop];
  },
});

export default prisma;
