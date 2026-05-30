import { useQuery } from '@tanstack/react-query';

import { useQueryLogger } from '@/features/shared/hooks/useQueryLogger';
import { queryKeys } from '@/lib/queryClient';
import { apiService } from '@/services/api.service';

export const useBusinesses = (categoryId?: string) => {
  const query = useQuery({
    queryKey: queryKeys.businesses.list(categoryId ? { categoryId } : undefined),
    queryFn: () => apiService.getBusinesses(categoryId),
  });

  useQueryLogger('useBusinesses', query, { categoryId });

  return query;
};

export const useBusinessDetail = (id: string) => {
  const query = useQuery({
    queryKey: queryKeys.businesses.detail(id),
    queryFn: () => apiService.getBusinessById(id),
    enabled: !!id,
  });
  useQueryLogger('useBusinessDetail', query, { id });
  return query;
};

export const useCategories = () => {
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiService.getCategories(),
  });
  useQueryLogger('useCategories', query);
  return query;
};
