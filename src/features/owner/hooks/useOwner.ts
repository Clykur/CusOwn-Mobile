import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api.service';
import { queryClient } from '@/lib/queryClient';
import { CreateServiceFormValues } from '@/schemas/booking.schema';
import { useAuthStore } from '@/store/auth.store';
import { useQueryLogger } from '@/features/shared/hooks/useQueryLogger';
import { getOwnerDefaultBusinessId } from '@/services/supabase/businesses';

export const useOwnerStats = (businessId?: string) => {
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: ['owner', 'stats', user?.id, businessId],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.getOwnerStats(businessId);
    },
    enabled: !!user?.id,
  });
  useQueryLogger('useOwnerStats', query, { businessId });
  return query;
};

export const useOwnerAnalytics = (params: {
  businessId: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  aggregated?: boolean;
}) => {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['owner', 'analytics', user?.id, params],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.getOwnerAnalytics(params);
    },
    enabled: !!user?.id && !!params.businessId,
  });
};

export const useOwnerServices = (businessId?: string) => {
  const query = useQuery({
    queryKey: ['owner', 'services', businessId],
    queryFn: () => apiService.getOwnerServices(businessId),
    enabled: true,
  });
  useQueryLogger('useOwnerServices', query, { businessId });
  return query;
};

export const useCreateService = () => {
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (payload: CreateServiceFormValues) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Fetch the default business_id via the service layer (no direct supabase access in hooks)
      const businessId = await getOwnerDefaultBusinessId(user.id);

      return apiService.createService({
        ...payload,
        business_id: businessId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'services'] });
    },
  });
};
export const useOwnerDashboard = (params?: {
  businessId?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: ['owner', 'dashboard', user?.id, params],

    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      return apiService.getOwnerDashboard(params);
    },

    enabled: !!user?.id,
  });
  useQueryLogger('useOwnerDashboard', query, { businessId: params?.businessId });
  return query;
};
export const useOwnerBusiness = () => {
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: ['owner', 'business', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const businesses = await apiService.getOwnerBusinesses();
      return businesses[0] ?? null;
    },
    enabled: !!user?.id,
  });
  useQueryLogger('useOwnerBusiness', query);
  return query;
};

export const useOwnerBusinesses = () => {
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: ['owner', 'businesses', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.getOwnerBusinesses();
    },
    enabled: !!user?.id,
  });
  useQueryLogger('useOwnerBusinesses', query);
  return query;
};

export const useUpdateBusiness = () => {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiService.updateBusiness(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'businesses'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'business', variables.id] });
    },
  });
};

export const useDeleteBusiness = () => {
  return useMutation({
    mutationFn: (id: string) => apiService.deleteBusiness(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'businesses'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'businesses', 'deleted'] });
    },
  });
};

export const useDeletedOwnerBusinesses = () => {
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: ['owner', 'businesses', 'deleted', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.getDeletedOwnerBusinesses();
    },
    enabled: !!user?.id,
  });
  useQueryLogger('useDeletedOwnerBusinesses', query);
  return query;
};

export const useRestoreBusiness = () => {
  return useMutation({
    mutationFn: (id: string) => apiService.restoreBusiness(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'businesses'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'businesses', 'deleted'] });
    },
  });
};

export const useHardDeleteBusiness = () => {
  return useMutation({
    mutationFn: (id: string) => apiService.hardDeleteBusiness(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'businesses'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'businesses', 'deleted'] });
    },
  });
};
