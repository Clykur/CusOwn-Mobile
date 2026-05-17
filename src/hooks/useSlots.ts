import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api.service';
import { queryKeys } from '@/lib/queryClient';

export const useSlots = (businessId: string | null, date: string, serviceIds?: string) => {
  return useQuery({
    queryKey: ['slots', businessId, date, serviceIds],
    queryFn: () => {
      if (!businessId) throw new Error('Business ID is required');
      return apiService.getSlots(businessId, date, serviceIds);
    },
    enabled: !!businessId && !!date,
  });
};