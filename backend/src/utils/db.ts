import { PrismaClient, Role, WorkItemType, Priority, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const realPrisma = new PrismaClient({
  log: ['error'],
});

// Seed data template
const SEED_TEAMS = [
  { id: 'team-eng', name: 'Engineering', description: 'Core product development & distributed backend' },
  { id: 'team-devops', name: 'DevOps & IT Support', description: 'Cloud infrastructure, CI/CD, and internal IT' },
  { id: 'team-sec', name: 'Security Operations', description: 'SecOps, vulnerability mitigation, and compliance' },
];

const defaultPasswordHash = bcrypt.hashSync('123456', 10);

// Helper function to build 20 employee users
const buildEmployees = () => {
  const users = [];
  for (let i = 1; i <= 20; i++) {
    const email = `employ${i}@gmail.com`;
    let role = Role.MEMBER;
    let teamId: string | null = 'team-eng';

    if (i === 1) {
      role = Role.LEAD;
      teamId = 'team-eng';
    } else if (i <= 5) {
      role = i === 5 ? Role.VIEWER : Role.MEMBER;
      teamId = 'team-eng';
    } else if (i === 6) {
      role = Role.LEAD;
      teamId = 'team-devops';
    } else if (i <= 10) {
      role = i === 10 ? Role.VIEWER : Role.MEMBER;
      teamId = 'team-devops';
    } else if (i === 11) {
      role = Role.LEAD;
      teamId = 'team-sec';
    } else if (i <= 15) {
      role = i === 15 ? Role.VIEWER : Role.MEMBER;
      teamId = 'team-sec';
    } else if (i <= 18) {
      role = Role.MEMBER;
      teamId = i === 16 ? 'team-eng' : i === 17 ? 'team-devops' : 'team-sec';
    } else if (i === 19) {
      role = Role.LEAD;
      teamId = 'team-eng';
    } else if (i === 20) {
      role = Role.ADMIN;
      teamId = null; // Global Admin
    }

    users.push({
      id: `u-employ-${i}`,
      email,
      name: `Employee ${i}${role === Role.ADMIN ? ' (Admin)' : role === Role.LEAD ? ' (Lead)' : role === Role.VIEWER ? ' (Viewer)' : ''}`,
      role,
      teamId,
      passwordHash: defaultPasswordHash,
    });
  }
  return users;
};

const SEED_USERS = buildEmployees();

let mockTeams = [...SEED_TEAMS];
let mockUsers = [...SEED_USERS];
let mockWorkItems = [
  {
    id: 'wi-1',
    title: 'Implement OAuth2.0 Token Revocation Protocol',
    description: 'RFC 7009 token revocation support to terminate compromised sessions immediately across distributed microservices.',
    type: WorkItemType.TASK,
    priority: Priority.HIGH,
    status: Status.IN_PROGRESS,
    teamId: 'team-eng',
    reporterId: 'u-employ-20',
    assigneeId: 'u-employ-1',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    version: 1,
    createdAt: new Date(Date.now() - 3600000 * 24),
    updatedAt: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: 'wi-2',
    title: 'Database connection pool exhaustion on payment gateway',
    description: 'Transactions experiencing 504 Gateway Timeout during peak billing cycle. Needs immediate connection pool tuning and query audit.',
    type: WorkItemType.INCIDENT,
    priority: Priority.URGENT,
    status: Status.OPEN,
    teamId: 'team-eng',
    reporterId: 'u-employ-1',
    assigneeId: null, // Unassigned Urgent
    dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
    version: 1,
    createdAt: new Date(Date.now() - 3600000 * 5),
    updatedAt: new Date(Date.now() - 3600000 * 5),
  },
  {
    id: 'wi-3',
    title: 'Upgrade Prisma ORM and apply zero-downtime database migration',
    description: 'Migrating schema with backward-compatible nullable columns and updated generated client types.',
    type: WorkItemType.TASK,
    priority: Priority.MEDIUM,
    status: Status.IN_REVIEW, // Awaiting Lead Approval
    teamId: 'team-eng',
    reporterId: 'u-employ-1',
    assigneeId: 'u-employ-2',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    version: 2,
    createdAt: new Date(Date.now() - 3600000 * 48),
    updatedAt: new Date(Date.now() - 3600000 * 1),
  },
  {
    id: 'wi-4',
    title: 'Refactor TanStack Query caching for optimistic task updates',
    description: 'Ensure instant optimistic feedback on status changes with rollback on server 409 conflict.',
    type: WorkItemType.TASK,
    priority: Priority.MEDIUM,
    status: Status.IN_PROGRESS,
    teamId: 'team-eng',
    reporterId: 'u-employ-1',
    assigneeId: 'u-employ-2',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    version: 1,
    createdAt: new Date(Date.now() - 3600000 * 12),
    updatedAt: new Date(Date.now() - 3600000 * 3),
  },
  {
    id: 'wi-5',
    title: 'SSL Certificate expiration alert for api.newtonite.internal',
    description: 'Cert-manager automated renewal failed due to DNS challenge rate limits. Renew manually.',
    type: WorkItemType.INCIDENT,
    priority: Priority.URGENT,
    status: Status.OPEN,
    teamId: 'team-devops',
    reporterId: 'u-employ-6',
    assigneeId: null, // Unassigned Urgent for DevOps
    dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
    version: 1,
    createdAt: new Date(Date.now() - 3600000 * 4),
    updatedAt: new Date(Date.now() - 3600000 * 4),
  },
  {
    id: 'wi-6',
    title: 'Kubernetes horizontal pod autoscaling threshold tuning',
    description: 'Lower target CPU utilization from 85% to 70% to handle sudden traffic spikes gracefully.',
    type: WorkItemType.TASK,
    priority: Priority.HIGH,
    status: Status.IN_REVIEW,
    teamId: 'team-devops',
    reporterId: 'u-employ-6',
    assigneeId: 'u-employ-7',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    version: 2,
    createdAt: new Date(Date.now() - 3600000 * 30),
    updatedAt: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: 'wi-7',
    title: 'Configure automated security scanning in CI/CD pipeline',
    description: 'Integrated Semgrep and Snyk vulnerability checking into Github Actions workflow.',
    type: WorkItemType.TASK,
    priority: Priority.LOW,
    status: Status.RESOLVED,
    teamId: 'team-eng',
    reporterId: 'u-employ-20',
    assigneeId: 'u-employ-1',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    version: 3,
    createdAt: new Date(Date.now() - 3600000 * 72),
    updatedAt: new Date(Date.now() - 3600000 * 24),
  },
];

let mockActivities = [
  {
    id: 'act-1',
    workItemId: 'wi-1',
    userId: 'u-employ-20',
    action: 'CREATED',
    details: JSON.stringify({ priority: 'HIGH', assignee: 'Employee 1' }),
    createdAt: new Date(Date.now() - 3600000 * 24),
  },
  {
    id: 'act-2',
    workItemId: 'wi-2',
    userId: 'u-employ-1',
    action: 'CREATED',
    details: JSON.stringify({ priority: 'URGENT', unassigned: true }),
    createdAt: new Date(Date.now() - 3600000 * 5),
  },
  {
    id: 'act-3',
    workItemId: 'wi-3',
    userId: 'u-employ-2',
    action: 'STATUS_CHANGE',
    details: JSON.stringify({ from: 'IN_PROGRESS', to: 'IN_REVIEW', reason: 'PR submitted, awaiting Lead approval' }),
    createdAt: new Date(Date.now() - 3600000 * 1),
  },
];

let mockComments = [
  {
    id: 'com-1',
    workItemId: 'wi-1',
    userId: 'u-employ-1',
    content: 'I have started implementing the token blacklist in Redis with automated expiry.',
    createdAt: new Date(Date.now() - 3600000 * 10),
    updatedAt: new Date(Date.now() - 3600000 * 10),
  },
  {
    id: 'com-2',
    workItemId: 'wi-3',
    userId: 'u-employ-2',
    content: 'All Vitest test suites passed locally. Ready for Employee 1 (Lead) to review and approve.',
    createdAt: new Date(Date.now() - 3600000 * 1),
    updatedAt: new Date(Date.now() - 3600000 * 1),
  },
];

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
        teamObj.users = mockUsers.filter((u) => u.teamId === t.id).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
      }
      if (args.include?.workItems) {
        teamObj.workItems = mockWorkItems.filter((w) => w.teamId === t.id).map((w) => enrichWorkItem(w, { assignee: true }));
      }
      return teamObj;
    },
    async findMany() {
      return mockTeams.map((t) => {
        const teamUsers = mockUsers.filter((u) => u.teamId === t.id);
        const teamItems = mockWorkItems.filter((w) => w.teamId === t.id);
        return {
          ...t,
          users: teamUsers.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
          workItems: teamItems.map((w) => enrichWorkItem(w, { assignee: true })),
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeams.push(newTeam);
      return newTeam;
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
  },

  activityLog: {
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
    if (where.teamId && item.teamId !== where.teamId) return false;
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
  const reporter = mockUsers.find((u) => u.id === w.reporterId) || null;
  const assignee = mockUsers.find((u) => u.id === w.assigneeId) || null;

  const item: any = { ...w };
  if (include?.team) item.team = team;
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
