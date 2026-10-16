# Newtonite — Architectural & Engineering Decisions

This document details the architectural decisions, trade-offs, and design patterns implemented in the Newtonite Task Management & Incident Workflow Platform according to enterprise engineering standards.

---

## 1. Concurrency Control: Optimistic Concurrency Control (OCC)

### Context & Challenge (FR-05, FR-13, NFR-03)
In collaborative multi-team environments, multiple team members may simultaneously view and update the same task or incident. Without concurrency control, the **Lost Update Anomaly** occurs: user B overwrites user A's changes without noticing, leading to state corruption and silent data loss.

### Decision
We implemented **Optimistic Concurrency Control (OCC)** using an integer `version` field on the `WorkItem` model.

1. **Version Verification**: When a client requests an update, claim, or status transition, it must supply the known `version` number.
2. **Atomic Conditional Update**: The backend performs an atomic conditional update:
   ```typescript
   const result = await prisma.workItem.updateMany({
     where: { id, version: clientVersion },
     data: { ...updates, version: { increment: 1 } }
   });
   if (result.count === 0) {
     throw new ConflictError("Conflict: Work item was updated concurrently by another user.");
   }
   ```
3. **HTTP 409 Conflict Contract**: If `result.count === 0`, the server responds with status `409 Conflict`.
4. **Client Recovery**: The frontend TanStack Query client intercepts `409 Conflict` errors and displays a prominent warning with a **"Reload Latest"** button, preventing accidental overwrites.

### Trade-Offs
- *Pros*: Non-blocking, excellent read scalability, zero deadlock risk, ideal for human-paced web interactions.
- *Cons*: Rejects stale submissions requiring the user to reload and reapply modifications (mitigated by clear conflict warnings and auto-refresh).

---

## 2. Atomic Claim & Race Condition Protection (FR-05)

### Context & Challenge
When an urgent incident appears in the `Unassigned Urgent` queue, two engineers might click "Claim Task" at the exact same millisecond. If the read and write operations are split (`findUnique` followed by `update`), both requests see `assigneeId: null` and both succeed, with the latter overwriting the former.

### Decision
We enforce atomic claim semantics using a combined OCC version guard and an unassigned state constraint:
```typescript
const updateResult = await prisma.workItem.updateMany({
  where: {
    id,
    assigneeId: null, // Guard condition: MUST still be unassigned
    version: currentVersion
  },
  data: {
    assigneeId: user.id,
    version: { increment: 1 }
  }
});
```
- If two users race, the database engine serializes the write on the row lock.
- Exactly one transaction succeeds (`count: 1`).
- The second transaction updates 0 rows and immediately returns HTTP 409 Conflict with `"Race condition: Task was just claimed by another user!"`.

---

## 3. Team-Level RBAC & Boundary Isolation (FR-02, FR-12)

### Context & Challenge
Enterprise security requires strict multi-tenant / multi-team partitioning. A member of DevOps must not inspect or tamper with internal tasks belonging to Engineering without authorization.

### Decision
We structured permissions into a 4-tier Role-Based Access Control (RBAC) hierarchy coupled with Team-level tenant boundaries:

| Role | Permissions | Scope |
|---|---|---|
| **VIEWER** | Read-only access to permitted team's tasks and comments. Cannot create, edit, claim, or comment. | Assigned Team |
| **MEMBER** | Create tasks, update assigned tasks, claim unassigned items, post comments, submit for review. | Assigned Team |
| **LEAD** | Full Member permissions + assign/reassign to other team members, update priorities, **approve review transitions**. | Assigned Team |
| **ADMIN** | Full administrative supervision across all teams, users, and audit logs. | Global (All Teams) |

- **Boundary Enforcement**: At both route and service layers, non-Admin requests verify `canAccessTeam(user.role, user.teamId, targetTeamId)`. Unauthorized cross-team access is blocked with HTTP `403 Forbidden`.

---

## 4. Idempotency Key Duplicate Prevention (FR-14, NFR-02)

### Context & Challenge
Network dropouts or aggressive user double-clicks on "Submit" can trigger duplicate task creation.

### Decision
We implemented the IETF draft **Idempotency-Key** pattern:
1. Clients generate a unique key (`Idempotency-Key` HTTP header) on POST operations.
2. The middleware inspects the `IdempotencyRecord` table before invoking business logic.
3. If a match is found with an active TTL (24 hours), the cached response status and JSON payload are returned with header `X-Cache-Lookup: HIT-IDEMPOTENT`.
4. If fresh, the response is captured during `res.json` and saved atomically.

---

## 5. Append-Only Audit Trail & Accountability (FR-08, NFR-10)

### Context & Challenge
Regulatory compliance and incident retrospectives require an indisputable record of who modified what, when, and why.

### Decision
We modeled an append-only `ActivityLog` table.
- Logs are strictly immutable (no `UPDATE` or `DELETE` endpoints exist).
- Records track `action` (`CREATED`, `CLAIMED`, `STATUS_CHANGE`, `APPROVED`, `UPDATED`, `COMMENT_ADDED`), actor `userId`, `timestamp`, and structured JSON `details` of before/after field changes.

---

## 6. High-Performance Indexing Strategy (NFR-04, NFR-05)

### Context & Challenge
As work items grow into tens of thousands of rows, unindexed queries cause full table scans.

### Decision
We defined targeted compound and single-column indexes in Prisma:
- `@@index([teamId, status])`: Optimizes team queue listings.
- `@@index([assigneeId, status])`: Powers the "Assigned to Me" queue.
- `@@index([priority, status])`: Powers the "Unassigned Urgent" queue.
- `@@index([createdAt])`: Accelerates chronological sorting.
- `@@index([workItemId, createdAt])`: Accelerates audit timeline and comment retrieval.

---

## 7. Resilient Dual-Mode Database Architecture

### Context & Challenge
Evaluation environments vary. A reviewer may have Docker Desktop active, or may wish to immediately evaluate the codebase via standard Node without configuring local PostgreSQL.

### Decision
The backend utilizes Prisma Client configured for PostgreSQL (`postgresql://...`) alongside a high-fidelity transparent in-memory dev adapter:
- When PostgreSQL is active (e.g. via `docker compose up`), queries execute against PostgreSQL.
- If PostgreSQL is offline, the backend seamlessly activates the in-memory dev store seeded with all demo personas, queues, and OCC logic, ensuring zero-friction local testing.
