import { Request } from 'express';
import { Role, WorkItemType, Priority, Status } from '@prisma/client';

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

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface CreateWorkItemInput {
  title: string;
  description: string;
  type: WorkItemType;
  priority: Priority;
  teamId: string;
  targetTeamId?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface UpdateWorkItemInput {
  title?: string;
  description?: string;
  type?: WorkItemType;
  priority?: Priority;
  status?: Status;
  assigneeId?: string | null;
  dueDate?: string | null;
  version: number; // Mandatory for OCC (Optimistic Concurrency Control)
}

export interface WorkItemListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: Status;
  priority?: Priority;
  type?: WorkItemType;
  assigneeId?: string;
  teamId?: string;
  dueFilter?: 'overdue' | 'today' | 'upcoming';
}
