import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from '@/constants/api';
import { OwnerStats } from '@/types/user.types';
import { Service } from '@/types/salon.types';
import { CreateServiceFormValues } from '@/schemas/booking.schema';

export const ownerApi = {
  getStats: async (): Promise<OwnerStats> => {
    const response = await axiosInstance.get(`${ENDPOINTS.SALONS}/owner/stats`);
    return response.data;
  },

  getServices: async (): Promise<Service[]> => {
    const response = await axiosInstance.get(`${ENDPOINTS.SALONS}/owner/services`);
    return response.data;
  },

  createService: async (payload: CreateServiceFormValues): Promise<Service> => {
    const response = await axiosInstance.post(`${ENDPOINTS.SALONS}/owner/services`, payload);
    return response.data;
  },
};
