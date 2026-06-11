import { useLocalSearchParams, router } from 'expo-router';
import React, { useMemo } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

import { OwnerBookingDetailModal } from '@/features/owner/components/OwnerBookingDetailModal';
import {
  useBookings,
  useConfirmBooking,
  useRejectBooking,
  useUndoConfirm,
  useUndoReject,
  useMarkNoShow,
} from '@/hooks/useBookings';

import { THEME } from '@/theme/theme';

export default function OwnerBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bookings, isLoading, isError } = useBookings('Owner');
  const booking = useMemo(() => {
    if (bookings && id) {
      return bookings.find((b) => b.id === id) ?? null;
    }
    return null;
  }, [bookings, id]);

  const { mutate: confirmBooking } = useConfirmBooking();
  const { mutate: rejectBooking } = useRejectBooking();
  const { mutate: undoConfirm } = useUndoConfirm();
  const { mutate: undoReject } = useUndoReject();
  const { mutate: markNoShow } = useMarkNoShow();

  const handleClose = () => {
    router.back();
  };

  const handleAccept = (bookingId: string) => {
    confirmBooking(bookingId);
  };

  const handleReject = (bookingId: string) => {
    rejectBooking(bookingId);
  };

  const handleUndoAccept = (bookingId: string) => {
    undoConfirm(bookingId);
  };

  const handleUndoReject = (bookingId: string) => {
    undoReject(bookingId);
  };

  const handleNoShow = (bookingId: string) => {
    markNoShow(bookingId);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-black/40">
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  if (isError || (!isLoading && !booking)) {
    return (
      <View className="flex-1 justify-center items-center bg-black/40">
        <Text className="text-white text-lg">Booking not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-transparent">
      <OwnerBookingDetailModal
        visible={true}
        booking={booking}
        onClose={handleClose}
        onAccept={handleAccept}
        onReject={handleReject}
        onUndoAccept={handleUndoAccept}
        onUndoReject={handleUndoReject}
        onNoShow={handleNoShow}
      />
    </View>
  );
}
