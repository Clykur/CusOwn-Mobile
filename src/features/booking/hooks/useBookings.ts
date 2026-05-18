import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiService } from '@/services/api.service';
import { queryKeys, queryClient } from '@/lib/queryClient';
import { CreateBookingPayload, BookingStatus } from '@/types/booking.types';
import { useAuthStore } from '@/store/auth.store';
import { logger, LogTag } from '@/utils/logger';
import { useQueryLogger } from '@/features/shared/hooks/useQueryLogger';

export const useBookings = (roleInput?: 'Customer' | 'Owner') => {
  const { user, role: authRole } = useAuthStore();
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

  // Real-time subscription (Keep this via Supabase as requested)
  useEffect(() => {
    if (!user?.id) return;

    const channelId = `bookings-${role}-${user.id}-${Math.random().toString(36).substr(2, 6)}`;
    const filterOptions = {
      event: '*' as const,
      schema: 'public',
      table: 'bookings',
      ...(role === 'Customer' && { filter: `customer_user_id=eq.${user.id}` }),
      // Owner: no column filter — RLS limits rows; avoids wrong customer_id filter on prod schema.
    };

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', filterOptions, (payload) => {
        logger.info(LogTag.API, '🔔 Real-time update received for bookings', payload);
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });

        if (payload.new && (payload.new as any).id) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.bookings.detail((payload.new as any).id),
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
  const { user } = useAuthStore();

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
    onSuccess: (_: any, variables: { id: string; status: BookingStatus }) => {
      logger.info(LogTag.API, `✅ Booking status updated to ${variables.status}`, {
        id: variables.id,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.id) });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'dashboard'],
      });
    },
    onError: (error) => {
      logger.error(LogTag.API, '❌ Failed to update booking status', error);
    },
  });
};

export const useRescheduleBooking = () => {
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload: any }) =>
      apiService.rescheduleBooking(bookingId, payload),
    onSuccess: (_, variables) => {
      logger.info(
        LogTag.API,
        `✅ Booking ${variables.bookingId} rescheduled successfully`,
        variables.payload,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.bookingId) });
    },
    onError: (error) => {
      logger.error(LogTag.API, '❌ Failed to reschedule booking', error);
    },
  });
};

export const useAcceptBooking = () => {
  return useMutation({
    mutationFn: (id: string) => apiService.acceptBooking(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'dashboard'],
      });
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
    },
  });
};

export const useUndoAccept = () => {
  return useMutation({
    mutationFn: (id: string) => apiService.undoAccept(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'dashboard'],
      });
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
    },
  });
};
