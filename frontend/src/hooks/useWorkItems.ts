import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { DashboardData, WorkItem, PaginationMeta, Status } from '../types';

export const useDashboardQueuesQuery = () => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiRequest('/dashboard');
      return res.data;
    },
    refetchInterval: 15000, // automatic background refresh
  });
};

export const useWorkItemsQuery = (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  type?: string;
  assigneeId?: string;
}) => {
  return useQuery<{ items: WorkItem[]; pagination: PaginationMeta }>({
    queryKey: ['workItems', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', String(params.page));
      if (params.limit) searchParams.append('limit', String(params.limit));
      if (params.search) searchParams.append('search', params.search);
      if (params.status) searchParams.append('status', params.status);
      if (params.priority) searchParams.append('priority', params.priority);
      if (params.type) searchParams.append('type', params.type);
      if (params.assigneeId) searchParams.append('assigneeId', params.assigneeId);

      const res = await apiRequest(`/work-items?${searchParams.toString()}`);
      return { items: res.data, pagination: res.pagination };
    },
  });
};

export const useWorkItemDetailQuery = (id: string | null) => {
  return useQuery<WorkItem>({
    queryKey: ['workItem', id],
    queryFn: async () => {
      if (!id) throw new Error('ID required');
      const res = await apiRequest(`/work-items/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useDemoUsersQuery = () => {
  return useQuery<any[]>({
    queryKey: ['demoUsers'],
    queryFn: async () => {
      const res = await apiRequest('/auth/demo-users');
      return res.data;
    },
  });
};

export const useClaimMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, version }: { id: string; version: number }) => {
      const res = await apiRequest(`/work-items/${id}/claim`, {
        method: 'POST',
        body: JSON.stringify({ version }),
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
      queryClient.invalidateQueries({ queryKey: ['workItem', variables.id] });
    },
  });
};

export const useTransitionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      targetStatus,
      version,
      claimForSelf,
      comment,
    }: {
      id: string;
      targetStatus: Status;
      version: number;
      claimForSelf?: boolean;
      comment?: string;
    }) => {
      const res = await apiRequest(`/work-items/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify({ targetStatus, version, claimForSelf, comment }),
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
      queryClient.invalidateQueries({ queryKey: ['workItem', variables.id] });
    },
  });
};

export const useCreateWorkItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      // Generate client idempotency key to prevent double submits on accidental multiple clicks
      const idempotencyKey = `create-wi-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const res = await apiRequest('/work-items', {
        method: 'POST',
        idempotencyKey,
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
    },
  });
};

export const useUpdateWorkItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await apiRequest(`/work-items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
      queryClient.invalidateQueries({ queryKey: ['workItem', variables.id] });
    },
  });
};

export const useAddCommentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await apiRequest(`/work-items/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workItem', variables.id] });
    },
  });
};

export const useDeleteWorkItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/work-items/${id}`, {
        method: 'DELETE',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
    },
  });
};
