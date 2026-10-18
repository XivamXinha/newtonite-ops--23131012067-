import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/utils/db';
import { Role, Status, Priority, WorkItemType } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'newtonite_super_secret_jwt_key_2026_dev';

const createToken = (payload: any) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

// Mock prisma for deterministic unit and API contract testing
vi.mock('../src/utils/db', () => {
  return {
    default: {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      team: {
        findUnique: vi.fn(),
      },
      workItem: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      activityLog: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      comment: {
        create: vi.fn(),
      },
      idempotencyRecord: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prisma)),
    },
    prisma: {},
  };
});

describe('Newtonite Critical System Behaviors (FR-01 to FR-14)', () => {
  const aliceLeadEng = {
    id: 'user-alice-lead',
    email: 'alice@newtonite.io',
    name: 'Alice Smith',
    role: Role.LEAD,
    teamId: 'team-eng',
  };

  const bobMemberEng = {
    id: 'user-bob-member',
    email: 'bob@newtonite.io',
    name: 'Bob Jones',
    role: Role.MEMBER,
    teamId: 'team-eng',
  };

  const edwardMemberDevOps = {
    id: 'user-edward-devops',
    email: 'edward@newtonite.io',
    name: 'Edward Norton',
    role: Role.MEMBER,
    teamId: 'team-devops',
  };

  const charlieViewer = {
    id: 'user-charlie-viewer',
    email: 'charlie@newtonite.io',
    name: 'Charlie Brown',
    role: Role.VIEWER,
    teamId: 'team-eng',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test 1: FR-05 Atomic Claim Concurrency
   * Two concurrent users try to claim an unassigned item.
   * If updateMany returns count: 0 (already claimed by someone else), it must return 409 Conflict.
   */
  describe('Behavior 1: Atomic Claim & Race Condition Protection (FR-05)', () => {
    it('should reject a claim with 409 Conflict if task was concurrently claimed or updated', async () => {
      const token = createToken(bobMemberEng);

      // Task is initially unassigned in engineering team
      (prisma.workItem.findUnique as any).mockResolvedValueOnce({
        id: 'task-101',
        title: 'Fix race condition',
        teamId: 'team-eng',
        assigneeId: null,
        version: 1,
      });

      // Concurrent update simulated: updateMany returns 0 because another worker won the race
      (prisma.workItem.updateMany as any).mockResolvedValueOnce({ count: 0 });

      // Secondary check shows it now belongs to another user
      (prisma.workItem.findUnique as any).mockResolvedValueOnce({
        id: 'task-101',
        assigneeId: 'user-another-fast-worker',
      });

      const res = await request(app)
        .post('/api/work-items/task-101/claim')
        .set('Authorization', `Bearer ${token}`)
        .send({ version: 1 });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Race condition');
    });
  });

  /**
   * Test 2: FR-12 Team Isolation & RBAC
   * Users from another team cannot read or update items of another team.
   */
  describe('Behavior 2: Cross-Team Boundary Authorization (FR-02, FR-12)', () => {
    it('should reject member from DevOps team trying to view an Engineering work item with 403 Forbidden', async () => {
      const token = createToken(edwardMemberDevOps); // DevOps member

      (prisma.workItem.findUnique as any).mockResolvedValueOnce({
        id: 'task-eng-999',
        title: 'Confidential Core Architecture Task',
        teamId: 'team-eng', // Belongs to Engineering!
      });

      const res = await request(app)
        .get('/api/work-items/task-eng-999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Unauthorized: You cannot access work items of another team');
    });
  });

  /**
   * Test 3: FR-06 & FR-07 Workflow Transitions & Lead Approval
   * Moving a task from IN_REVIEW to RESOLVED requires LEAD approval.
   */
  describe('Behavior 3: Status Transition & Lead Approval Workflow (FR-06, FR-07)', () => {
    it('should forbid a regular Member from approving an IN_REVIEW item to RESOLVED', async () => {
      const token = createToken(bobMemberEng); // Member, NOT Lead

      (prisma.workItem.findUnique as any).mockResolvedValueOnce({
        id: 'task-300',
        title: 'PR awaiting approval',
        status: Status.IN_REVIEW,
        teamId: 'team-eng',
        version: 2,
      });

      const res = await request(app)
        .post('/api/work-items/task-300/transition')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetStatus: Status.RESOLVED, version: 2 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Approval required: Only an authorized Team Lead or Admin can approve');
    });

    it('should allow an authorized Team Lead to approve an IN_REVIEW item to RESOLVED', async () => {
      const token = createToken(aliceLeadEng); // Lead!

      (prisma.workItem.findUnique as any).mockResolvedValueOnce({
        id: 'task-300',
        title: 'PR awaiting approval',
        status: Status.IN_REVIEW,
        teamId: 'team-eng',
        version: 2,
      });

      (prisma.workItem.updateMany as any).mockResolvedValueOnce({ count: 1 });
      (prisma.activityLog.create as any).mockResolvedValueOnce({ id: 'log-1' });
      (prisma.workItem.findUnique as any).mockResolvedValueOnce({
        id: 'task-300',
        title: 'PR awaiting approval',
        status: Status.RESOLVED,
        teamId: 'team-eng',
        version: 3,
      });

      const res = await request(app)
        .post('/api/work-items/task-300/transition')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetStatus: Status.RESOLVED, version: 2 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Status transitioned to RESOLVED');
    });
  });

  /**
   * Test 4: FR-13 Optimistic Concurrency Control (OCC)
   * Rejecting stale version updates with 409 Conflict
   */
  describe('Behavior 4: Optimistic Concurrency Control & Version Conflict (FR-13)', () => {
    it('should return 409 Conflict if client sends an outdated version number', async () => {
      const token = createToken(bobMemberEng);

      (prisma.workItem.findUnique as any).mockResolvedValueOnce({
        id: 'task-400',
        title: 'Stale task',
        teamId: 'team-eng',
        version: 5, // DB is already on version 5
      });

      // Client submits update with stale version 4
      const res = await request(app)
        .patch('/api/work-items/task-400')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New Title from old tab', version: 4 });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Conflict: This work item has been modified by another user');
    });
  });

  /**
   * Test 5: FR-14 Idempotent Work Item Creation
   * Submitting identical Idempotency-Key returns the cached response
   */
  describe('Behavior 5: Idempotency Key Duplicate Prevention (FR-14)', () => {
    it('should return the cached response without creating a duplicate item when Idempotency-Key is repeated', async () => {
      const token = createToken(bobMemberEng);
      const idempotencyKey = 'idem-req-uuid-987654';

      // Simulate existing idempotency record
      (prisma.idempotencyRecord.findUnique as any).mockResolvedValueOnce({
        id: 'record-1',
        idempotencyKey,
        statusCode: 201,
        responseBody: JSON.stringify({
          success: true,
          data: { id: 'task-created-earlier', title: 'Task with idempotency' },
        }),
        expiresAt: new Date(Date.now() + 3600000), // Valid
      });

      const res = await request(app)
        .post('/api/work-items')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          title: 'Task with idempotency',
          description: 'Testing duplicate request protection',
          type: 'TASK',
          priority: 'MEDIUM',
        });

      expect(res.status).toBe(201);
      expect(res.headers['x-cache-lookup']).toBe('HIT-IDEMPOTENT');
      expect(res.body.data.id).toBe('task-created-earlier');
      // Ensure prisma.workItem.create was NOT called again
      expect(prisma.workItem.create).not.toHaveBeenCalled();
    });
  });

  /**
   * Test 6: Role Management - Viewer read-only restrictions (FR-02)
   */
  describe('Behavior 6: Viewer Read-Only Permissions (FR-02)', () => {
    it('should forbid a Viewer from creating or claiming a work item', async () => {
      const token = createToken(charlieViewer);

      const res = await request(app)
        .post('/api/work-items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Illegal task from viewer',
          description: 'Viewer should be blocked',
          type: 'TASK',
          priority: 'LOW',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Viewers are not permitted to create work items');
    });
  });

  /**
   * Test 7: Team Creation Restricted Exclusively to Admins (FR-02)
   */
  describe('Behavior 7: Team Creation Restricted Exclusively to Admins', () => {
    it('should forbid non-admins (Lead/Member/Viewer) from creating new teams', async () => {
      const leadToken = createToken(aliceLeadEng);

      const res = await request(app)
        .post('/api/admin/teams')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({
          name: 'Unauthorized Squad',
          description: 'Attempting to create team without Admin role',
        });

      expect(res.status).toBe(403);
    });
  });

  /**
   * Test 8: Post-Claim Isolation & Creator Claim Prevention
   */
  describe('Behavior 8: Post-Claim Isolation & Creator Claim Prevention', () => {
    it('should forbid a member from claiming their own created task', async () => {
      const token = createToken(bobMemberEng);

      (prisma.workItem.findUnique as any).mockResolvedValueOnce({
        id: 'task-created-by-bob',
        title: 'Task by Bob',
        reporterId: bobMemberEng.id, // Bob is creator!
        teamId: 'team-eng',
        assigneeId: null,
        version: 1,
      });

      const res = await request(app)
        .post('/api/work-items/task-created-by-bob/claim')
        .set('Authorization', `Bearer ${token}`)
        .send({ version: 1 });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Task creators cannot claim their own task');
    });

    it('should forbid another member from opening a task claimed by someone else', async () => {
      const token = createToken(bobMemberEng);

      (prisma.workItem.findUnique as any).mockResolvedValueOnce({
        id: 'task-claimed-by-other',
        title: 'Work item owned by colleague',
        reporterId: 'user-another-reporter',
        assigneeId: 'user-claimed-colleague', // Claimed by someone else!
        teamId: 'team-eng',
      });

      const res = await request(app)
        .get('/api/work-items/task-claimed-by-other')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Access restricted: This task has been claimed by another member');
    });
  });
});

