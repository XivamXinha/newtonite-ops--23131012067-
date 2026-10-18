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
  leadTeam?: { id: string; name: string; description?: string | null } | null;
  memberTeam?: { id: string; name: string; description?: string | null } | null;
  leadTeams?: Array<{ id: string; name: string; description?: string | null }>;
  memberTeams?: Array<{ id: string; name: string; description?: string | null }>;
  leadTeamIds?: string[];
  isLead?: boolean;
  assignedRoles?: Array<{
    role: Role;
    label: string;
    teamName: string | null;
    teamId: string | null;
    isAssigned: boolean;
  }>;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  leadUserId?: string | null;
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
  targetTeamId?: string | null;
  targetTeam?: {
    id: string;
    name: string;
    description?: string;
  } | null;
  team: {
    id: string;
    name: string;
    leadUserId?: string | null;
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
    unclaimedNewTasksCount?: number;
  };
  queues: {
    assignedToMe: WorkItem[];
    unassignedUrgent: WorkItem[];
    awaitingMyApproval: WorkItem[];
    newTasks?: WorkItem[];
  };
  teamActivities?: any[];
  allTeams?: any[];
  myTeam?: any | null;
  leadTeam?: any | null;
  memberTeam?: any | null;
  leadTeams?: any[];
  memberTeams?: any[];
  userRole?: string;
  userTeamId?: string | null;
}
