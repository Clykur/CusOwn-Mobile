import { apiClient } from '../api/client';

export const SalonService = {
  getSalons: async (params?: { latitude?: number; longitude?: number; query?: string; location?: string }) => {
    // Map generic query string to server-validated location param
    const mappedParams = {
      ...params,
      location: params?.location || params?.query || undefined,
    };
    const response = await apiClient.get('/salons/list', { params: mappedParams });
    return response.data;
  },
  
  getSalonDetails: async (salonId: string) => {
    const response = await apiClient.get(`/salons/${salonId}`);
    return response.data;
  },
  
  getSalonServices: async (salonId: string) => {
    const response = await apiClient.get(`/businesses/${salonId}/services`);
    return response.data;
  },
};
