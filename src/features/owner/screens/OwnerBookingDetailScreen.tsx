import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import type { Booking } from '@/types/booking.types';
import { THEME } from '@/theme/theme';

export default function OwnerBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bookings, isLoading, isError } = useBookings('Owner');
  const [booking, setBooking] = useState<Booking | null>(null);

  const { mutate: confirmBooking } = useConfirmBooking();
  const { mutate: rejectBooking } = useRejectBooking();
  const { mutate: undoConfirm } = useUndoConfirm();
  const { mutate: undoReject } = useUndoReject();
  const { mutate: markNoShow } = useMarkNoShow();

  useEffect(() => {
    if (bookings && id) {
      const found = bookings.find((b) => b.id === id);
      if (found) {
        setBooking(found);
      }
    }
  }, [bookings, id]);

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
