import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from '@/constants/api';
import { Booking, CreateBookingPayload, BookingStatus } from '@/types/booking.types';

export const bookingApi = {
  getBookings: async (params?: { role?: 'Customer' | 'Owner' }): Promise<Booking[]> => {
    const response = await axiosInstance.get(ENDPOINTS.BOOKINGS, { params });
    return response.data;
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const response = await axiosInstance.get(`${ENDPOINTS.BOOKINGS}/${id}`);
    return response.data;
  },

  createBooking: async (payload: CreateBookingPayload): Promise<Booking> => {
    const response = await axiosInstance.post(ENDPOINTS.BOOKINGS, payload);
    return response.data;
  },

  updateBookingStatus: async (id: string, status: BookingStatus): Promise<Booking> => {
    const response = await axiosInstance.patch(`${ENDPOINTS.BOOKINGS}/${id}/status`, { status });
    return response.data;
  },
};
