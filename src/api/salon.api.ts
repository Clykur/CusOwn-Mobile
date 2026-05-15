import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from '@/constants/api';
import { Salon } from '@/types/salon.types';

export const salonApi = {
  getSalons: async (): Promise<Salon[]> => {
    const response = await axiosInstance.get(ENDPOINTS.SALONS_LIST);
    return response.data;
  },

  getSalonById: async (id: string): Promise<Salon> => {
    const response = await axiosInstance.get(`${ENDPOINTS.SALONS}/${id}`);
    return response.data;
  },
};
