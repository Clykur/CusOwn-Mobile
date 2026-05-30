import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export const bookingService = {
  subscribeToBookings: (
    role: string,
    userId: string,
    onInsertOrUpdate: (payload: unknown) => void,
  ): RealtimeChannel => {
    const channelId = `bookings-${role}-${userId}-${Math.random().toString(36).substr(2, 6)}`;
    const filterOptions = {
      event: '*' as const,
      schema: 'public',
      table: 'bookings',
      ...(role === 'Customer' && { filter: `customer_user_id=eq.${userId}` }),
    };

    return supabase
      .channel(channelId)
      .on('postgres_changes', filterOptions, onInsertOrUpdate)
      .subscribe();
  },

  unsubscribeFromBookings: (channel: RealtimeChannel) => {
    supabase.removeChannel(channel);
  },
};
