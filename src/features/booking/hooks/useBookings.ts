import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api.service';
import { queryKeys, queryClient } from '@/lib/queryClient';
import { CreateBookingPayload, BookingStatus } from '@/types/booking.types';
import { useAuthStore } from '@/store/auth.store';
import { logger, LogTag } from '@/utils/logger';
import { useQueryLogger } from '@/features/shared/hooks/useQueryLogger';

export const useBookings = (roleInput?: 'Customer' | 'Owner') => {
  const user = useAuthStore((s) => s.user);
  const authRole = useAuthStore((s) => s.role);
  const role = roleInput || (authRole as 'Customer' | 'Owner');

  const query = useQuery({
    queryKey: queryKeys.bookings.list(role ? { role } : undefined),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const bookings = await apiService.getBookings(role || 'Customer');
      if (__DEV__) {
        logger.info(
          LogTag.QUERY,
          '[useBookings] Mapped bookings prices:',
          bookings.map((b) => ({ id: b.id, price: b.price })),
        );
      }
      return bookings;
    },
    enabled: !!user?.id,
  });

  useQueryLogger('useBookings', query, { role });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = apiService.subscribeToBookings(user.id, role, (payload) => {
      logger.info(LogTag.API, '🔔 Real-time update received for bookings', payload);
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });

      const newRecord = payload.new as Record<string, unknown>;
      if (newRecord && newRecord.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.bookings.detail(newRecord.id as string),
        });
      }
    });

    return unsubscribe;
  }, [user?.id, role]);

  return query;
};

export const useBookingDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => apiService.getBookingById(id),
    enabled: !!id,
  });
};

export const useCreateBooking = () => {
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => {
      if (!user?.id) throw new Error('User not authenticated');
      return apiService.createBooking({
        ...payload,
        customer_user_id: user.id,
      });
    },
    onSuccess: (data) => {
      logger.info(LogTag.API, '✅ Booking created successfully via backend', data);
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all() });
    },
    onError: (error) => {
      logger.error(LogTag.API, '❌ Failed to create booking via backend', error);
    },
  });
};

export const useUpdateBookingStatus = () => {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      apiService.updateBookingStatus(id, status),
    onSuccess: (_, variables: { id: string; status: BookingStatus }) => {
      logger.info(LogTag.API, `✅ Booking status updated to ${variables.status}`, {
        id: variables.id,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.id) });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'dashboard'],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all() });
    },
    onError: (error) => {
      logger.error(LogTag.API, '❌ Failed to update booking status', error);
    },
  });
};

export const useRescheduleBooking = () => {
  return useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: string;
      payload: Parameters<typeof apiService.rescheduleBooking>[1];
    }) => apiService.rescheduleBooking(bookingId, payload),
    onSuccess: (_, variables) => {
      logger.info(
        LogTag.API,
        `✅ Booking ${variables.bookingId} rescheduled successfully`,
        variables.payload,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all() });
    },
    onError: (error) => {
      logger.error(LogTag.API, '❌ Failed to reschedule booking', error);
    },
  });
};

export const useConfirmBooking = () => {
  return useMutation({
    mutationFn: (id: string) => apiService.confirmBooking(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'dashboard'],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all() });
    },
  });
};

export const useRejectBooking = () => {
  return useMutation({
    mutationFn: (id: string) => apiService.rejectBooking(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'dashboard'],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all() });
    },
  });
};

export const useMarkNoShow = () => {
  return useMutation({
    mutationFn: (id: string) => apiService.markNoShow(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'dashboard'],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all() });
    },
  });
};

export const useUndoConfirm = () => {
  return useMutation({
    mutationFn: (id: string) => apiService.undoConfirm(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'dashboard'],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all() });
    },
  });
};

export const useUndoReject = () => {
  return useMutation({
    mutationFn: (id: string) => apiService.undoReject(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'dashboard'],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all() });
    },
  });
};

export const useCancelBooking = () => {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiService.cancelBooking(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all() });
    },
  });
};
