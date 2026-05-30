import { supabase } from '@/lib/supabase';

export const dashboardService = {
  getNearbySalons: async (lat: number, lng: number, radiusKm: number = 50) => {
    const { data, error } = await supabase.rpc('get_nearby_available_salons', {
      user_lat: lat,
      user_lng: lng,
      radius_km: radiusKm,
    });
    if (error) throw error;
    return data;
  },

  getTrendingServices: async () => {
    const { data, error } = await supabase.rpc('get_trending_services');
    if (error) throw error;
    return data;
  },

  getActiveDeals: async () => {
    const { data, error } = await supabase.rpc('get_active_deals');
    if (error) throw error;
    return data;
  },
};
