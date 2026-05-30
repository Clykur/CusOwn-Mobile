import { useQuery } from '@tanstack/react-query';

import { useQueryLogger } from '@/features/shared/hooks/useQueryLogger';
import { queryKeys } from '@/lib/queryClient';
import { apiService } from '@/services/api.service';

import type { EffectiveHours } from '@/services/supabase/business-hours';

export const useBusinessHours = (businessId: string | null, date: string) => {
  const query = useQuery<EffectiveHours | null>({
    queryKey: [queryKeys.businessHours, businessId, date],
    queryFn: () => {
      if (!businessId) throw new Error('Business ID is required');
      return apiService.getEffectiveHours(businessId, date);
    },
    enabled: !!businessId && !!date,
  });
  useQueryLogger('useBusinessHours', query, { businessId, date });
  return query;
};
