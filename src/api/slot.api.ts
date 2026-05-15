import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from '@/constants/api';
import { Slot } from '@/types/slot.types';

export const slotApi = {
  getSlots: async (params: { salonId: string; date: string }): Promise<Slot[]> => {
    const response = await axiosInstance.get(ENDPOINTS.SLOTS, { params });
    return response.data;
  },
};
