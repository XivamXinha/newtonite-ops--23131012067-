<<<<<<< HEAD
# 🛡️ Newtonite

> **Enterprise Task Management & Incident Workflow Engine**  
> Built with React + TanStack Query, Node.js + Express + TypeScript, PostgreSQL + Prisma ORM, Vitest + Supertest, and Docker Compose.

---

## 📋 Table of Contents
1. [Overview & Architecture](#overview--architecture)
2. [Technology Stack](#technology-stack)
3. [Pre-Seeded Demo Personas (1-Click Switcher)](#pre-seeded-demo-personas)
4. [Quick Start & Local Setup](#quick-start--local-setup)
5. [Running Automated Tests](#running-automated-tests)
6. [Functional Requirements (FR-01 to FR-14)](#functional-requirements)
7. [Non-Functional Requirements (NFR-01 to NFR-10)](#non-functional-requirements)
8. [Known Limitations & Roadmap](#known-limitations--roadmap)
9. [Architecture Decisions Document](#architecture-decisions-document)

---

## 1. Overview & Architecture

Newtonite is an enterprise-grade workflow and incident management platform designed for multi-team engineering organizations. It provides atomic concurrency protection against race conditions, team boundary isolation (RBAC), approval workflows, optimistic concurrency versioning, and immutable audit logs.

```
                  ┌───────────────────────────────────────────────┐
                  │          React Frontend (Vite)                │
                  │   TanStack Query • Responsive UI • JWT Auth   │
                  └───────────────────────┬───────────────────────┘
                                          │ REST API (/api/*)
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │       Node.js + Express + TypeScript          │
                  │  RBAC Middleware • OCC Guard • Idempotency    │
                  └───────────────┬───────────────────────┬───────┘
                                  │                       │
                                  ▼                       ▼
                    ┌─────────────────────────┐  ┌───────────────────┐
                    │ PostgreSQL Database     │  │ In-Memory Dev     │
                    │ (Prisma ORM & Schema)   │  │ Store (Fallback)  │
                    └─────────────────────────┘  └───────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + TanStack Query v5 | Reactive cache, instant updates, state management |
| **Styling** | Vanilla CSS + Design System | Custom dark theme, glassmorphism, responsive tokens |
| **Backend** | Node.js + Express + TypeScript | Layered architecture (Controllers, Services, Routes) |
| **Database** | PostgreSQL 16 | Relational database with composite indexing |
| **ORM** | Prisma v5 | Typesafe database schema, migrations & seed scripts |
| **Automated Tests** | Vitest + Supertest | Unit & integration tests for all critical behaviors |
| **Local Setup** | Docker Compose | One-command PostgreSQL 16 local orchestration |

---

## 3. Pre-Seeded Demo Personas

Newtonite ships with pre-seeded accounts representing all key RBAC roles and teams.  
Use the **1-click persona switcher** in the top navigation bar or log in with credentials:

| Persona | Role | Team | Default Password | Permissions & Use Case |
|---|---|---|---|---|
| **Alice Smith** | `LEAD` | Engineering | `password123` | Full team member access + **Approval authority** to resolve PRs/reviews, reassign tasks |
| **Bob Jones** | `MEMBER` | Engineering | `password123` | Create tasks, update assigned tasks, claim unassigned items, post comments |
| **Charlie Brown** | `VIEWER` | Engineering | `password123` | Read-only inspection within Engineering. Cannot create, edit, or claim items |
| **Diana Prince** | `LEAD` | DevOps & IT Support | `password123` | Lead approval and task management for DevOps infrastructure |
| **Edward Norton** | `MEMBER` | DevOps & IT Support | `password123` | Claim urgent infrastructure incidents, submit tasks for review |
| **System Admin** | `ADMIN` | Global (All Teams) | `password123` | Unrestricted cross-team visibility, emergency task resolution, global configuration |

---

## 4. Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9+
- **Docker Compose** *(optional for PostgreSQL)*

### Step 1: Start PostgreSQL (Docker Compose)
If you have Docker installed, start the PostgreSQL container:
```bash
docker compose up -d
```
*(Note: If Docker is not installed or offline, Newtonite's resilient database adapter will automatically activate the zero-config embedded store with the identical seed data so you can test immediately without barriers).*

### Step 2: Start the Backend Server
```bash
cd backend
npm install
npm run dev
```
The backend API server will listen at `http://localhost:5000/api`.

### Step 3: Start the Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at **`http://localhost:5173`**.

---

## 5. Running Automated Tests

Newtonite includes automated test suites covering all critical behaviors (concurrency race conditions, team boundaries, lead approvals, OCC conflicts, and idempotency).

To run the test suite:
```bash
cd backend
npm test
```

### Test Results Output:
```text
✓ tests/critical-behaviors.test.ts (7 tests)
  ✓ Behavior 1: Atomic Claim & Race Condition Protection (FR-05)
  ✓ Behavior 2: Cross-Team Boundary Authorization (FR-02, FR-12)
  ✓ Behavior 3: Status Transition & Lead Approval Workflow (FR-06, FR-07)
  ✓ Behavior 4: Optimistic Concurrency Control & Version Conflict (FR-13)
  ✓ Behavior 5: Idempotency Key Duplicate Prevention (FR-14)
  ✓ Behavior 6: Viewer Read-Only Permissions (FR-02)

Test Files  1 passed (1)
Tests       7 passed (7)
```

---

## 6. Functional Requirements (FR-01 to FR-14)

| ID | Requirement | Implementation Details |
|---|---|---|
| **FR-01** | **Login** | Seeded demo users with 1-click switcher and JWT token authentication. |
| **FR-02** | **Role Management** | Granular Viewer, Member, Lead, Admin hierarchy enforced via `rbac.middleware.ts`. |
| **FR-03** | **Create Work Item** | Create tasks & incidents with title, description, priority, type, due date. |
| **FR-04** | **Edit Work Item** | Edit details with team authorization check and OCC version validation. |
| **FR-05** | **Assign / Claim** | Atomic claim with row-level OCC guard: two users cannot claim simultaneously. |
| **FR-06** | **Workflow** | Valid status progression (`OPEN` → `IN_PROGRESS` → `IN_REVIEW` → `RESOLVED` → `CLOSED`). |
| **FR-07** | **Approval** | Moving from `IN_REVIEW` to `RESOLVED` requires authorized `LEAD` or `ADMIN` role. |
| **FR-08** | **Activity History** | Append-only `ActivityLog` storing action type, actor, before/after deltas. |
| **FR-09** | **Comments** | Team members can post comments with author badge and timestamps. |
| **FR-10** | **Search & Filters** | Filter by text, status, priority, type, assignee, and team. |
| **FR-11** | **Pagination** | Server-side pagination with `page`, `limit`, `totalPages`, and `totalCount`. |
| **FR-12** | **Authorization** | Strict multi-team isolation: users cannot read/modify items outside their team. |
| **FR-13** | **Conflict Handling** | Optimistic Concurrency Control (OCC) returns HTTP 409 Conflict with reload alert. |
| **FR-14** | **Duplicate Prevention** | `Idempotency-Key` header caching prevents duplicate tasks on network retries. |

---

## 7. Non-Functional Requirements (NFR-01 to NFR-10)

| ID | NFR | How Newtonite Satisfies It |
|---|---|---|
| **NFR-01** | **Security** | JWT authentication, bcrypt password hashing, team-level boundary authorization. |
| **NFR-02** | **Reliability** | Idempotency keys prevent double submissions on retry; atomic database transactions. |
| **NFR-03** | **Data Consistency** | Optimistic Concurrency Control (`version` integer) prevents the Lost Update anomaly. |
| **NFR-04** | **Performance** | Server-side execution of search, filters, and pagination; sub-millisecond in-memory caching. |
| **NFR-05** | **Scalability** | Composite indexes on `[teamId, status]`, `[assigneeId, status]`, and `[priority, status]`. |
| **NFR-06** | **Maintainability** | Clean layered architecture (controllers, services, middlewares); documented in `ENGINEERING_DECISIONS.md`. |
| **NFR-07** | **Testability** | Vitest + Supertest integration suite verifying all 5 critical system behaviors. |
| **NFR-08** | **Usability** | Clear visual error messages, conflict warnings, reload triggers, and status badge aesthetics. |
| **NFR-09** | **Reproducible Setup** | Complete `docker-compose.yml`, `.env.example`, and single-command startup scripts. |
| **NFR-10** | **Accountability** | Immutable `ActivityLog` table preserving complete actor, timestamp, action, and JSON delta history. |

---

## 8. Known Limitations & Roadmap

1. **WebSocket Real-Time Push**: Currently, dashboard queues refresh periodically (15s polling) and on user interactions. A WebSocket/SSE feed can push real-time broadcasts when another team member claims an item.
2. **Keyset (Cursor-Based) Pagination**: Offset pagination (`page`, `limit`) is implemented for ease of navigation. For datasets exceeding 1,000,000 items, cursor-based pagination will be added.
3. **Soft Deletion**: Work items currently cycle through the `CLOSED` status rather than hard deletion to preserve forensic audit history.

---

## 9. Architecture Decisions Document

For an in-depth breakdown of technical trade-offs, concurrency design, and security architecture, see [ENGINEERING_DECISIONS.md](file:///c:/Users/skuma/OneDrive/Desktop/Netwonite/ENGINEERING_DECISIONS.md).
=======
# newtonite-ops--23131012067-
A full-stack operational task management system for teams, featuring role-based access control, task assignment, workflow approvals, activity history, and concurrent update handling.
>>>>>>> 731d44824fdbdb451f61b8569d2113f7e279c754
