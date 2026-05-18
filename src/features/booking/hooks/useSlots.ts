import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api.service';
import { queryKeys } from '@/lib/queryClient';
import { useQueryLogger } from '@/features/shared/hooks/useQueryLogger';
import type { SlotListItem } from '@/services/supabase/slots';

export const useSlots = (businessId: string | null, date: string, serviceIds?: string) => {
  const query = useQuery<SlotListItem[]>({
    queryKey: ['slots', businessId, date, serviceIds],
    queryFn: () => {
      if (!businessId) throw new Error('Business ID is required');
      return apiService.getSlots(businessId, date, serviceIds);
    },
    enabled: !!businessId && !!date,
  });
  useQueryLogger('useSlots', query, { businessId, date });
  return query;
};
