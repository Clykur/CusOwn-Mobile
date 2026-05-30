import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { apiService } from '@/services/api.service';
import { RatingPromptModal } from './RatingPromptModal';
import { logger, LogTag } from '@/utils/logger';

export const RatingPromptProvider: React.FC = () => {
  const session = useAuthStore((s) => s.session);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
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
          (b: any) => b && b.id && !dismissedBookingIds.includes(b.id),
        );
        setPendingBookings(filtered);
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
      booking={pendingBooking}
      onClose={handleModalClose}
      onSuccess={handleSuccess}
    />
  );
};
