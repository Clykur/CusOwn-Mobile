import { useQuery, useMutation } from '@tanstack/react-query';
import { ownerApi } from '@/api/owner.api';
import { queryClient } from '@/lib/queryClient';
import { CreateServiceFormValues } from '@/schemas/booking.schema';

export const useOwnerStats = () => {
  return useQuery({
    queryKey: ['owner', 'stats'],
    queryFn: ownerApi.getStats,
  });
};

export const useOwnerServices = () => {
  return useQuery({
    queryKey: ['owner', 'services'],
    queryFn: ownerApi.getServices,
  });
};

export const useCreateService = () => {
  return useMutation({
    mutationFn: (payload: CreateServiceFormValues) => ownerApi.createService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'services'] });
    },
  });
};
