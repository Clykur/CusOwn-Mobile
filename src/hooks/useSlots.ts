import { useQuery } from '@tanstack/react-query';
import { slotApi } from '@/api/slot.api';
import { queryKeys } from '@/lib/queryClient';

export const useSlots = (salonId: string | null, date: string) => {
  return useQuery({
    queryKey: queryKeys.slots.list(salonId || '', date),
    queryFn: () => slotApi.getSlots({ salonId: salonId!, date }),
    enabled: !!salonId && !!date,
  });
};
