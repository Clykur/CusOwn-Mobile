import React, { useState, useEffect, useCallback } from 'react';

import { RatingPromptModal } from './RatingPromptModal';
import { apiService } from '@/services/api.service';
import { useAuthStore } from '@/store/auth.store';
import { logger, LogTag } from '@/utils/logger';

import type { Booking } from '@/types/booking.types';

export const RatingPromptProvider: React.FC = () => {
  const session = useAuthStore((s) => s.session);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [dismissedBookingIds, setDismissedBookingIds] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  const pendingBooking = pendingBookings[0] || null;

  const fetchPendingRatings = useCallback(async () => {
    if (!session?.user?.id) {
      setPendingBookings([]);
      setVisible(false);
      return;
    }

    try {
      const bookings = await apiService.getPendingRatings();
      if (Array.isArray(bookings)) {
        const filtered = bookings.filter(
          (b) =>
            (b as Booking) && (b as Booking).id && !dismissedBookingIds.includes((b as Booking).id),
        );
        setPendingBookings(filtered as Booking[]);
        setVisible(filtered.length > 0);
      }
    } catch (error) {
      logger.error(LogTag.API, 'Failed to fetch pending ratings for customer:', error);
      setPendingBookings([]);
      setVisible(false);
    }
  }, [session?.user?.id, dismissedBookingIds]);

  useEffect(() => {
    fetchPendingRatings();
  }, [fetchPendingRatings]);

  // Poll for new pending ratings every 60 seconds when session is active
  useEffect(() => {
    if (!session?.user?.id) return;

    const interval = setInterval(fetchPendingRatings, 60000);
    return () => clearInterval(interval);
  }, [fetchPendingRatings, session?.user?.id]);

  const handleModalClose = () => {
    if (!pendingBooking) return;
    setDismissedBookingIds((prev) => [...prev, pendingBooking.id]);
    setVisible(false);
    // Remove the current booking from list
    setPendingBookings((prev) => prev.filter((b) => b.id !== pendingBooking.id));
  };

  const handleSuccess = () => {
    if (!pendingBooking) return;
    setVisible(false);
    // Remove the current booking from list
    setPendingBookings((prev) => prev.filter((b) => b.id !== pendingBooking.id));
    // Trigger quick refetch to see if another completed booking needs rating
    setTimeout(fetchPendingRatings, 800);
  };

  if (!session?.user?.id || !pendingBooking) {
    return null;
  }

  return (
    <RatingPromptModal
      visible={visible}
      booking={
        pendingBooking as unknown as {
          id: string;
          booking_id?: string;
          salon_name?: string;
          business_name?: string;
          service_name?: string | string[];
          service_date?: string;
          service_time?: string;
        }
      }
      onClose={handleModalClose}
      onSuccess={handleSuccess}
    />
  );
};
