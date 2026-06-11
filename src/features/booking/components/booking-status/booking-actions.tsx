import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { memo, useState, useCallback } from 'react';
import { Text, Pressable, View } from 'react-native';

import RescheduleButton from '@/features/booking/components/reschedule-button';
import { useModal } from '@/hooks/useModal';
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';
import { apiService } from '@/services/api.service';
import { THEME } from '@/theme/theme';

import type { Slot } from '@/types/slot.types';

interface BookingActionsProps {
  booking: {
    id: string;
    status: string;
    no_show?: boolean;
    slot?: Slot & {
      start_time?: string;
    };
    salon?: {
      id: string;
    };
    business_id: string;
    services?: { id: string; name: string }[];
    service?: { id: string; name: string };
  };
  salon_id?: string;
  availableSlots: Slot[];
  cancellationMinHoursMs: number;
  onCancelled: () => void;
  onRescheduled: () => void;
}

function BookingActionsComponent({
  booking,
  availableSlots,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cancellationMinHoursMs,
  onCancelled,
  onRescheduled,
}: BookingActionsProps) {
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const { showModal } = useModal();

  const canCancelByStatus = booking.status === 'confirmed' || booking.status === 'pending';

  const appointmentDateTime = (() => {
    if (!booking?.slot?.date || !booking?.slot?.start_time) {
      return null;
    }

    const startTimeRaw = String(booking.slot.start_time);

    const startTime = startTimeRaw.includes('T')
      ? new Date(startTimeRaw)
      : new Date(`${booking.slot.date}T${startTimeRaw}`);

    const timeMs = startTime.getTime();

    if (!Number.isFinite(timeMs)) {
      return null;
    }

    return startTime;
  })();

  const msUntilAppointment = appointmentDateTime
    ? appointmentDateTime.getTime() - Date.now()
    : Number.POSITIVE_INFINITY;

  const THIRTY_MINUTES_IN_MS = 30 * 60 * 1000;

  const isActionDisabled = !appointmentDateTime || msUntilAppointment < THIRTY_MINUTES_IN_MS;

  const isCancellationTooLate = canCancelByStatus && isActionDisabled;

  const cancelMutation = useOptimisticMutation({
    mutationFn: async () => {
      await apiService.cancelBooking(booking.id);
      return { ok: true };
    },
    onMutate: async () => {
      setOptimisticStatus('cancelled');
      return null;
    },
    onSuccess: () => {
      onCancelled();
    },
    onError: (error: unknown) => {
      setOptimisticStatus(null);
      showModal({
        variant: 'error',
        title: 'Cancellation Failed',
        description:
          (error instanceof Error ? error.message : String(error)) ||
          'An error occurred while cancelling your booking.',
      });
    },
  });

  const handleCancel = useCallback(async () => {
    if (cancelMutation.isPending) return;
    if (isCancellationTooLate) return;

    setIsConfirmingCancel(true);
  }, [cancelMutation, isCancellationTooLate]);

  const handleRebook = useCallback(() => {
    const serviceIds =
      booking.services?.map((s: { id: string }) => s.id).join(',') || booking.service?.id || '';

    router.dismissAll();

    setTimeout(() => {
      router.push({
        pathname: '/(customer)/book/[id]',
        params: {
          id: booking.business_id,
          serviceIds,
        },
      });
    }, 10);
  }, [booking.business_id, booking.services, booking.service]);

  const displayStatus = optimisticStatus || booking.status;
  const showCancelled = displayStatus === 'cancelled';
  const isPastOrInactive =
    displayStatus === 'completed' ||
    displayStatus === 'cancelled' ||
    displayStatus === 'no_show' ||
    displayStatus === 'rejected';

  return (
    <View className="space-y-3">
      {/* Cancelled Notice */}
      {showCancelled && (
        <View className="p-4 bg-error/10 border border-error/20 rounded-xl mb-3">
          <Text className="text-error font-semibold text-center">
            {cancelMutation.isPending ? 'Cancelling your booking...' : 'Booking cancelled'}
          </Text>
        </View>
      )}

      {/* Active Actions */}
      {canCancelByStatus && !showCancelled && (
        <View className="space-y-3">
          {/* Cancel Button / Confirmation */}
          {isConfirmingCancel ? (
            <View className="bg-card border border-border p-4 rounded-2xl mb-3">
              <Text className="text-text font-bold mb-1">Are you sure?</Text>
              <Text className="text-textSecondary text-xs mb-4">This action cannot be undone.</Text>
              <View className="flex-row gap-x-3">
                <Pressable
                  onPress={() => setIsConfirmingCancel(false)}
                  disabled={cancelMutation.isPending}
                  className="flex-1 bg-border/50 py-3 rounded-xl items-center"
                >
                  <Text className="text-text font-semibold">Keep it</Text>
                </Pressable>
                <Pressable
                  onPress={() => cancelMutation.mutate(undefined)}
                  disabled={cancelMutation.isPending}
                  className={`flex-1 py-3 rounded-xl items-center ${
                    cancelMutation.isPending ? 'bg-error/50' : 'bg-error'
                  }`}
                >
                  <Text className="text-background font-bold">
                    {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={handleCancel}
              disabled={cancelMutation.isPending || isActionDisabled}
              className={`w-full rounded-2xl py-4 px-6 items-center mb-3 border ${
                isActionDisabled
                  ? 'bg-error/10 border-error/20 opacity-50'
                  : 'bg-error/10 border-error/30 active:bg-error/20'
              }`}
            >
              <Text className="text-error font-bold">Cancel Booking</Text>
            </Pressable>
          )}

          {/* Too-Late Warning */}
          {isActionDisabled && (
            <View className="flex-row items-start gap-x-2 mb-2 -mt-2">
              <Ionicons
                className="mt-0.25"
                name="information-circle-outline"
                size={14}
                color={THEME.colors.textSecondary}
              />
              <Text className="text-textSecondary text-xs flex-1 leading-5">
                Actions are disabled as the appointment time has passed or is too close.
              </Text>
            </View>
          )}

          {/* Cancel Error */}
          {cancelMutation.isError && (
            <Text className="text-error text-sm">
              {(cancelMutation.error as Error)?.message || 'Failed to cancel booking'}
            </Text>
          )}

          {/* Reschedule */}
          {booking.slot && !booking.no_show && booking.status !== 'cancelled' && (
            <View className="flex justify-center">
              <RescheduleButton
                bookingId={booking.id}
                currentSlot={booking.slot}
                businessId={booking.business_id}
                availableSlots={availableSlots ?? []}
                onRescheduled={onRescheduled}
                rescheduledBy="customer"
                disabled={isActionDisabled}
              />
            </View>
          )}
        </View>
      )}

      {/* Rebook Button */}
      {isPastOrInactive && (
        <Pressable
          onPress={handleRebook}
          className="w-full rounded-2xl py-4 px-6 items-center bg-primary/10 border border-primary/30 active:bg-primary/20"
        >
          <Text className="text-primary font-bold">Rebook Appointment</Text>
        </Pressable>
      )}
    </View>
  );
}

export const BookingActions = memo(BookingActionsComponent);
