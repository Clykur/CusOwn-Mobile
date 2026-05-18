import React, { memo, useState, useCallback } from 'react';

import RescheduleButton from '@/features/booking/components/reschedule-button';

import { Alert, Text, TouchableOpacity, View } from 'react-native';

import { Slot } from '@/types/slot.types';

import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';
import { apiService } from '@/services/api.service';

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
  cancellationMinHoursMs,
  onCancelled,
  onRescheduled,
}: BookingActionsProps) {
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);

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

  const THIRTY_MINUTES_IN_MS = 30 * 60 * 1000; // 30 minutes

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

    onError: () => {
      setOptimisticStatus(null);
    },
  });

  const handleCancel = useCallback(async () => {
    if (cancelMutation.isPending) return;

    if (isCancellationTooLate) return;

    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      {
        text: 'No',
        style: 'cancel',
      },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () => {
          cancelMutation.mutate(undefined);
        },
      },
    ]);

    return;
  }, [cancelMutation, isCancellationTooLate]);

  const displayStatus = optimisticStatus || booking.status;

  const showCancelled = displayStatus === 'cancelled';

  return (
    <>
      {showCancelled ? (
        <View className="mb-6 p-4 bg-slate-100 rounded-xl text-center">
          <Text className="text-slate-600 font-medium">
            {cancelMutation.isPending ? 'Cancelling your booking...' : 'Booking cancelled'}
          </Text>
        </View>
      ) : (
        canCancelByStatus && (
          <View className="mb-6 space-y-3">
            {/* CANCEL BUTTON */}

            <TouchableOpacity
              onPress={handleCancel}
              disabled={cancelMutation.isPending || isActionDisabled}
              activeOpacity={0.7}
              className={`w-full rounded-xl py-3 px-6 items-center mb-3 ${isActionDisabled ? 'bg-red-300' : 'bg-red-600'}`}
            >
              <Text className="text-white font-semibold">
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
              </Text>
            </TouchableOpacity>

            {/* CANCELLATION WARNING */}

            {isActionDisabled && (
              <Text className="text-sm text-slate-500 mb-4 -mt-2">
                Actions are disabled as the appointment time has passed or is too close.
              </Text>
            )}
            {/* ERROR */}

            {cancelMutation.isError && (
              <Text className="text-sm text-red-600">
                {(cancelMutation.error as Error)?.message || 'Failed to cancel booking'}
              </Text>
            )}

            {/* RESCHEDULE */}

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
        )
      )}
    </>
  );
}

export const BookingActions = memo(BookingActionsComponent);
