// src/hooks/useNotificationPreferences.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { logger, LogTag } from '@/utils/logger';

export interface NotificationPreferences {
  booking_updates: boolean;
  booking_reminders: boolean;
  payment_updates: boolean;
  marketing_notifications: boolean;
  booking_requests: boolean;
  cancellations: boolean;
  payout_notifications: boolean;
  business_updates: boolean;
}

const defaultPreferences: NotificationPreferences = {
  booking_updates: true,
  booking_reminders: true,
  payment_updates: true,
  marketing_notifications: false,
  booking_requests: true,
  cancellations: true,
  payout_notifications: true,
  business_updates: true,
};

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    async function loadPreferences() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 means no rows found
          logger.error(LogTag.DB, 'Failed to fetch preferences', error);
        } else if (data) {
          setPreferences({
            booking_updates: data.booking_updates,
            booking_reminders: data.booking_reminders,
            payment_updates: data.payment_updates,
            marketing_notifications: data.marketing_notifications,
            booking_requests: data.booking_requests,
            cancellations: data.cancellations,
            payout_notifications: data.payout_notifications,
            business_updates: data.business_updates,
          });
        } else {
          // If no row exists, insert defaults
          await supabase.from('notification_preferences').insert({ user_id: user.id });
        }
      } catch (err) {
        logger.error(LogTag.DB, 'Exception loading preferences', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, [user?.id]);

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user?.id) return;

    // Optimistic UI update
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) {
        // Revert on error
        setPreferences((prev) => ({ ...prev, [key]: !value }));
        logger.error(LogTag.DB, `Failed to update preference ${key}`, error);
      }
    } catch (err) {
      setPreferences((prev) => ({ ...prev, [key]: !value }));
      logger.error(LogTag.DB, 'Exception updating preference', err);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    preferences,
    isLoading,
    isSaving,
    updatePreference,
  };
}
