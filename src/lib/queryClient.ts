import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const bookingKeys = {
  all: () => ['bookings'] as const,
  list: (filters?: any) => [...bookingKeys.all(), 'list', filters] as const,
  customer: () => [...bookingKeys.all(), 'customer'] as const,
  owner: (filters?: Record<string, any>) => [...bookingKeys.all(), 'owner', filters] as const,
  detail: (id: string) => [...bookingKeys.all(), 'detail', id] as const,
};

export const salonKeys = {
  all: () => ['salons'] as const,
  list: (search?: string) => [...salonKeys.all(), 'list', { search }] as const,
  featured: () => [...salonKeys.all(), 'featured'] as const,
  detail: (id: string) => [...salonKeys.all(), 'detail', id] as const,
  services: (salonId: string) => [...salonKeys.all(), 'services', salonId] as const,
};

export const slotKeys = {
  all: () => ['slots'] as const,
  available: (salonId: string, serviceId: string, date: string) =>
    [...slotKeys.all(), { salonId, serviceId, date }] as const,
};

export const ownerKeys = {
  all: () => ['owner'] as const,
  stats: () => [...ownerKeys.all(), 'stats'] as const,
  services: () => [...ownerKeys.all(), 'services'] as const,
};

export const queryKeys = {
  bookings: bookingKeys,
  salons: salonKeys,
  slots: {
    all: slotKeys.all,
    list: (salonId: string, date: string) => [...slotKeys.all(), salonId, date] as const,
    available: slotKeys.available,
  },
  owner: ownerKeys,
};
