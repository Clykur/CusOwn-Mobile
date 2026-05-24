import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { NearbySalon } from '@/features/customer/components/NearbySalonCard';
import { TrendingService } from '@/features/customer/components/TrendingServiceCard';
import { FlashDeal } from '@/features/customer/components/DealCard';

export const useDashboard = (lat?: number | null, lng?: number | null) => {
  const nearbyQuery = useQuery({
    queryKey: ['nearby_salons', lat, lng],
    queryFn: async (): Promise<NearbySalon[]> => {
      // Pass 0, 0 if location not available yet, RPC should handle nulls or ignore distance
      const { data, error } = await supabase.rpc('get_nearby_available_salons', {
        user_lat: lat || 0,
        user_lng: lng || 0,
      });

      if (error) {
        console.error('Error fetching nearby salons:', error);
        throw error;
      }
      return data as NearbySalon[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  });

  const trendingQuery = useQuery({
    queryKey: ['trending_services'],
    queryFn: async (): Promise<TrendingService[]> => {
      const { data, error } = await supabase.rpc('get_trending_services');

      if (error) {
        console.error('Error fetching trending services:', error);
        throw error;
      }
      return data as TrendingService[];
    },
    staleTime: 15 * 60 * 1000, // Cache for 15 mins
  });

  const dealsQuery = useQuery({
    queryKey: ['flash_deals'],
    queryFn: async (): Promise<FlashDeal[]> => {
      const { data, error } = await supabase.rpc('get_active_deals');

      if (error) {
        console.error('Error fetching flash deals:', error);
        throw error;
      }
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
