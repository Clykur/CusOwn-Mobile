import { useQuery } from '@tanstack/react-query';
import { salonApi } from '@/api/salon.api';
import { queryKeys } from '@/lib/queryClient';

export const useSalons = () => {
  return useQuery({
    queryKey: queryKeys.salons.all(),
    queryFn: salonApi.getSalons,
  });
};

export const useSalonDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.salons.detail(id),
    queryFn: () => salonApi.getSalonById(id),
    enabled: !!id,
  });
};
