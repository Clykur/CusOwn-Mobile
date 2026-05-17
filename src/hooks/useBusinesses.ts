import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api.service';
import { queryKeys } from '@/lib/queryClient';
import { logger, LogTag } from '@/utils/logger';

export const useBusinesses = (categoryId?: string) => {
  const query = useQuery({
    queryKey: queryKeys.businesses.list(categoryId ? { categoryId } : undefined),
    queryFn: () => apiService.getBusinesses(categoryId),
  });

  useEffect(() => {
    if (query.isSuccess) {
      logger.info(LogTag.QUERY, `Businesses fetched successfully. Count: ${query.data?.length}`);
    }
    if (query.isError) {
      logger.error(LogTag.QUERY, `Failed to fetch businesses`, query.error);
    }
  }, [query.isSuccess, query.isError, query.data, query.error]);

  return query;
};

export const useBusinessDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.businesses.detail(id),
    queryFn: () => apiService.getBusinessById(id),
    enabled: !!id,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiService.getCategories(),
  });
};

