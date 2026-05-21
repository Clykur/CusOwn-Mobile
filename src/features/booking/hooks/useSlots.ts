import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api.service';
import { queryKeys } from '@/lib/queryClient';

export const useSlots = (businessId: string | null, date: string, serviceIds?: string) => {
  return useQuery({
    queryKey: queryKeys.slots.list(businessId ?? '', date),
    queryFn: () => apiService.getSlots(businessId!, date, serviceIds),
    enabled: !!businessId && !!date,
    // Refresh every minute so booked-by-others slots appear quickly
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
};

export const useBusinessSlots = (businessId: string, date: string) => {
  return useQuery({
    queryKey: ['owner', 'slots', businessId, date],
    queryFn: () => apiService.getSlots(businessId, date),
    enabled: !!businessId && !!date,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
};
