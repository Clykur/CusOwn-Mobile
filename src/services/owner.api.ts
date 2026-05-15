import { apiClient } from '../api/client';

export interface CreateBusinessInput {
  salon_name: string;
  category: string;
  owner_name: string;
  whatsapp_number: string;
  opening_time: string;
  closing_time: string;
  slot_duration: number;
  concurrent_booking_capacity: number;
  address: string;
  city: string;
  location?: string;
}

export const OwnerService = {
  getMyBusinesses: async () => {
    const response = await apiClient.get('/owner/businesses');
    return response.data;
  },

  createBusiness: async (payload: CreateBusinessInput) => {
    const response = await apiClient.post('/salons', payload);
    return response.data;
  },

  getBusinessDetails: async (salonId: string) => {
    const response = await apiClient.get(`/salons/${salonId}`);
    return response.data;
  },

  addHoliday: async (salonId: string, payload: { holiday_date: string; reason?: string }) => {
    const response = await apiClient.post(`/owner/businesses/${salonId}/holidays`, payload);
    return response.data;
  },

  addClosure: async (salonId: string, payload: { closure_date: string; reason?: string }) => {
    const response = await apiClient.post(`/owner/businesses/${salonId}/closures`, payload);
    return response.data;
  },
};
