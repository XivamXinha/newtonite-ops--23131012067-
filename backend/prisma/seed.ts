import { PrismaClient, Role, WorkItemType, Priority, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Newtonite database seed...');

  // 1. Clean existing records
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.idempotencyRecord.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();

  // 2. Create Teams
  const engTeam = await prisma.team.create({
    data: {
      name: 'Engineering',
      description: 'Core product development, frontend and backend services',
    },
  });

  const devopsTeam = await prisma.team.create({
    data: {
      name: 'DevOps & IT Support',
      description: 'Cloud infrastructure, CI/CD, internal IT systems and uptime',
    },
  });

  const securityTeam = await prisma.team.create({
    data: {
      name: 'Security Operations',
      description: 'SecOps, vulnerability mitigation, and compliance monitoring',
    },
  });

  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  // 3. Create 20 Demo Users (employ1@gmail.com to employ20@gmail.com)
  const createdUsers: Record<string, any> = {};

  for (let i = 1; i <= 20; i++) {
    const email = `employ${i}@gmail.com`;
    let role = Role.MEMBER;
    let targetTeamId: string | null = engTeam.id;

    if (i === 1) {
      role = Role.LEAD;
      targetTeamId = engTeam.id;
    } else if (i <= 5) {
      role = i === 5 ? Role.VIEWER : Role.MEMBER;
      targetTeamId = engTeam.id;
    } else if (i === 6) {
      role = Role.LEAD;
      targetTeamId = devopsTeam.id;
    } else if (i <= 10) {
      role = i === 10 ? Role.VIEWER : Role.MEMBER;
      targetTeamId = devopsTeam.id;
    } else if (i === 11) {
      role = Role.LEAD;
      targetTeamId = securityTeam.id;
    } else if (i <= 15) {
      role = i === 15 ? Role.VIEWER : Role.MEMBER;
      targetTeamId = securityTeam.id;
    } else if (i <= 18) {
      role = Role.MEMBER;
      targetTeamId = i === 16 ? engTeam.id : i === 17 ? devopsTeam.id : securityTeam.id;
    } else if (i === 19) {
      role = Role.LEAD;
      targetTeamId = engTeam.id;
    } else if (i === 20) {
      role = Role.ADMIN;
      targetTeamId = null; // Global Admin
    }

    const u = await prisma.user.create({
      data: {
        email,
        name: `Employee ${i}${role === Role.ADMIN ? ' (Admin)' : role === Role.LEAD ? ' (Lead)' : role === Role.VIEWER ? ' (Viewer)' : ''}`,
        role,
        teamId: targetTeamId,
        passwordHash: defaultPasswordHash,
      },
    });

    createdUsers[`employ${i}`] = u;
  }

  console.log('✅ 20 Employee users seeded (employ1@gmail.com to employ20@gmail.com with password 123456)');

  const employ1 = createdUsers['employ1'];
  const employ2 = createdUsers['employ2'];
  const employ6 = createdUsers['employ6'];
  const employ7 = createdUsers['employ7'];
  const employ20 = createdUsers['employ20'];

  // 4. Create Work Items

  // Item 1: Assigned to Employee 1 (Engineering) - In Progress
  const item1 = await prisma.workItem.create({
    data: {
      title: 'Implement OAuth2.0 Token Revocation Protocol',
      description: 'RFC 7009 token revocation support to terminate compromised sessions immediately across distributed microservices.',
      type: WorkItemType.TASK,
      priority: Priority.HIGH,
      status: Status.IN_PROGRESS,
      teamId: engTeam.id,
      reporterId: employ20.id,
      assigneeId: employ1.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      version: 1,
    },
  });

  await prisma.activityLog.create({
    data: {
      workItemId: item1.id,
      userId: employ20.id,
      action: 'CREATED',
      details: JSON.stringify({ priority: 'HIGH', assignee: 'Employee 1' }),
    },
  });

  await prisma.comment.create({
    data: {
      workItemId: item1.id,
      userId: employ1.id,
      content: 'I have started implementing the token blacklist in Redis with automated expiry.',
    },
  });

  // Item 2: Unassigned Urgent Incident (Engineering)
  const item2 = await prisma.workItem.create({
    data: {
      title: 'Database connection pool exhaustion on payment gateway',
      description: 'Transactions experiencing 504 Gateway Timeout during peak billing cycle. Needs immediate connection pool tuning and query audit.',
      type: WorkItemType.INCIDENT,
      priority: Priority.URGENT,
      status: Status.OPEN,
      teamId: engTeam.id,
      reporterId: employ1.id,
      assigneeId: null, // Unassigned!
      dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
      version: 1,
    },
  });

  await prisma.activityLog.create({
    data: {
      workItemId: item2.id,
      userId: employ1.id,
      action: 'CREATED',
      details: JSON.stringify({ priority: 'URGENT', unassigned: true }),
    },
  });

  // Item 3: In Review - Awaiting Employee 1's Approval (Engineering)
  const item3 = await prisma.workItem.create({
    data: {
      title: 'Upgrade Prisma ORM and apply zero-downtime database migration',
      description: 'Migrating schema with backward-compatible nullable columns and updated generated client types.',
      type: WorkItemType.TASK,
      priority: Priority.MEDIUM,
      status: Status.IN_REVIEW, // Awaiting Lead Approval!
      teamId: engTeam.id,
      reporterId: employ1.id,
      assigneeId: employ2.id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      version: 2,
    },
  });

  await prisma.activityLog.create({
    data: {
      workItemId: item3.id,
      userId: bob.id,
      action: 'STATUS_CHANGE',
      details: JSON.stringify({ from: 'IN_PROGRESS', to: 'IN_REVIEW', reason: 'PR passed tests, awaiting Lead sign-off' }),
    },
  });

  await prisma.comment.create({
    data: {
      workItemId: item3.id,
      userId: bob.id,
      content: 'All Vitest test suites passed locally. Ready for Alice to review and approve.',
    },
  });

  // Item 4: Assigned to Bob (Engineering)
  const item4 = await prisma.workItem.create({
    data: {
      title: 'Refactor TanStack Query caching for optimistic task updates',
      description: 'Ensure instant optimistic feedback on status changes with rollback on server 409 conflict.',
      type: WorkItemType.TASK,
      priority: Priority.MEDIUM,
      status: Status.IN_PROGRESS,
      teamId: engTeam.id,
      reporterId: alice.id,
      assigneeId: bob.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      version: 1,
    },
  });

  // Item 5: Unassigned Urgent Incident (DevOps)
  const item5 = await prisma.workItem.create({
    data: {
      title: 'SSL Certificate expiration alert for api.newtonite.internal',
      description: 'Cert-manager automated renewal failed due to DNS challenge rate limits. Renew manually.',
      type: WorkItemType.INCIDENT,
      priority: Priority.URGENT,
      status: Status.OPEN,
      teamId: devopsTeam.id,
      reporterId: employ6.id,
      assigneeId: null, // Unassigned Urgent for DevOps
      dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
      version: 1,
    },
  });

  // Item 6: In Review (DevOps) - Awaiting Employee 6's Approval
  const item6 = await prisma.workItem.create({
    data: {
      title: 'Kubernetes horizontal pod autoscaling threshold tuning',
      description: 'Lower target CPU utilization from 85% to 70% to handle sudden traffic spikes gracefully.',
      type: WorkItemType.TASK,
      priority: Priority.HIGH,
      status: Status.IN_REVIEW,
      teamId: devopsTeam.id,
      reporterId: employ6.id,
      assigneeId: employ7.id,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      version: 2,
    },
  });

  // Item 7: Resolved task
  await prisma.workItem.create({
    data: {
      title: 'Configure automated security scanning in CI/CD pipeline',
      description: 'Integrated Semgrep and Snyk vulnerability checking into Github Actions workflow.',
      type: WorkItemType.TASK,
      priority: Priority.LOW,
      status: Status.RESOLVED,
      teamId: engTeam.id,
      reporterId: employ20.id,
      assigneeId: employ1.id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      version: 3,
    },
  });

  console.log('✅ Work items, activity logs, and comments seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
