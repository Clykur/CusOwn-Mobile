import { useQuery, useMutation } from '@tanstack/react-query';
import { bookingApi } from '@/api/booking.api';
import { queryKeys, queryClient } from '@/lib/queryClient';
import { CreateBookingPayload, BookingStatus } from '@/types/booking.types';

export const useBookings = (role?: 'Customer' | 'Owner') => {
  return useQuery({
    queryKey: queryKeys.bookings.list(role ? { role } : undefined),
    queryFn: () => bookingApi.getBookings(role ? { role } : undefined),
  });
};

export const useBookingDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingApi.getBookingById(id),
    enabled: !!id,
  });
};

export const useCreateBooking = () => {
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingApi.createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
};

export const useUpdateBookingStatus = () => {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      bookingApi.updateBookingStatus(id, status),
    onSuccess: (_: any, variables: { id: string; status: BookingStatus }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.id) });
    },
  });
};
