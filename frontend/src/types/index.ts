export type Role = 'VIEWER' | 'MEMBER' | 'LEAD' | 'ADMIN';
export type WorkItemType = 'TASK' | 'INCIDENT';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Status = 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  teamId: string | null;
  teamName?: string | null;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
}

export interface ActivityLog {
  id: string;
  workItemId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  action: string;
  details: string | null;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  workItemId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  type: WorkItemType;
  priority: Priority;
  status: Status;
  teamId: string;
  team: {
    id: string;
    name: string;
  };
  reporterId: string;
  reporter: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  assigneeId: string | null;
  assignee: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
  dueDate: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  comments?: CommentItem[];
  activities?: ActivityLog[];
  _count?: {
    comments: number;
    activities: number;
  };
}

export interface PaginationMeta {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardData {
  metrics: {
    totalOpen: number;
    totalPendingApproval: number;
    totalUrgent: number;
    totalCompleted: number;
    assignedToMeCount: number;
  };
  queues: {
    assignedToMe: WorkItem[];
    unassignedUrgent: WorkItem[];
    awaitingMyApproval: WorkItem[];
  };
}
