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

export const businessKeys = {
  all: () => ['businesses'] as const,
  list: (filters?: any) => [...businessKeys.all(), 'list', filters] as const,
  featured: () => [...businessKeys.all(), 'featured'] as const,
  detail: (id: string) => [...businessKeys.all(), 'detail', id] as const,
  services: (businessId: string) => [...businessKeys.all(), 'services', businessId] as const,
};

export const slotKeys = {
  all: () => ['slots'] as const,
  list: (businessId: string, date: string) => [...slotKeys.all(), businessId, date] as const,
};

export const ownerKeys = {
  all: () => ['owner'] as const,
  stats: () => [...ownerKeys.all(), 'stats'] as const,
  services: () => [...ownerKeys.all(), 'services'] as const,
};

export const queryKeys = {
  bookings: bookingKeys,
  businesses: businessKeys,
  slots: slotKeys,
  owner: ownerKeys,
  businessHours: ['businessHours'] as const,
};
