import { useQuery } from '@tanstack/react-query';

import { dashboardService } from '@/services/dashboard.service';

import type { FlashDeal } from '@/features/customer/components/DealCard';
import type { NearbySalon } from '@/features/customer/components/NearbySalonCard';
import type { TrendingService } from '@/features/customer/components/TrendingServiceCard';

export const useDashboard = (lat?: number | null, lng?: number | null) => {
  const nearbyQuery = useQuery({
    queryKey: ['nearby_salons', lat, lng],
    queryFn: async (): Promise<NearbySalon[]> => {
      const data = await dashboardService.getNearbySalons(lat || 0, lng || 0);
      return data as NearbySalon[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  });

  const trendingQuery = useQuery({
    queryKey: ['trending_services'],
    queryFn: async (): Promise<TrendingService[]> => {
      const data = await dashboardService.getTrendingServices();
      return data as TrendingService[];
    },
    staleTime: 15 * 60 * 1000, // Cache for 15 mins
  });

  const dealsQuery = useQuery({
    queryKey: ['flash_deals'],
    queryFn: async (): Promise<FlashDeal[]> => {
      const data = await dashboardService.getActiveDeals();
      return data as FlashDeal[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  });

  return {
    nearbySalons: nearbyQuery.data || [],
    isLoadingNearby: nearbyQuery.isLoading,
    isErrorNearby: nearbyQuery.isError,
    refetchNearby: nearbyQuery.refetch,

    trendingServices: trendingQuery.data || [],
    isLoadingTrending: trendingQuery.isLoading,
    isErrorTrending: trendingQuery.isError,

    flashDeals: dealsQuery.data || [],
    isLoadingDeals: dealsQuery.isLoading,
    isErrorDeals: dealsQuery.isError,
  };
};
