import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api.service';
import { queryClient } from '@/lib/queryClient';
import { CreateServiceFormValues } from '@/schemas/booking.schema';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';

export const useOwnerStats = (businessId?: string) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['owner', 'stats', user?.id, businessId],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.getOwnerStats(businessId);
    },
    enabled: !!user?.id,
  });
};

export const useOwnerAnalytics = (params: {
  businessId: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  aggregated?: boolean
}) => {
  const { user } = useAuthStore();

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
  return useQuery({
    queryKey: ['owner', 'services', businessId],
    queryFn: () => apiService.getOwnerServices(businessId),
    enabled: true,
  });
};

export const useCreateService = () => {
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: CreateServiceFormValues) => {
      if (!user?.id) throw new Error('User not authenticated');

      // We still need the business_id for some backend endpoints if they are not session-aware
      // But ideally the backend knows who the user is from the JWT.
      // Keeping the business_id lookup for now if the backend requires it.
      const { data: business, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();

      if (error || !business) throw new Error('No business found for this owner');

      // The backend should probably have a POST /api/owner/services
      // For now we'll assume the apiService handles it.
      return apiService.createService({
        ...payload,
        business_id: business.id,
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
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['owner', 'dashboard', user?.id, params],

    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      return apiService.getOwnerDashboard(params);
    },

    enabled: !!user?.id,
  });
};
export const useOwnerBusiness = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['owner', 'business', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useOwnerBusinesses = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['owner', 'businesses', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.getOwnerBusinesses();
    },
    enabled: !!user?.id,
  });
};

export const useUpdateBusiness = () => {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
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
    },
  });
};
