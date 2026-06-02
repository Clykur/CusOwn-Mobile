// src/services/notificationAnalytics.service.ts
import { supabase } from '@/lib/supabase';
import { logger, LogTag } from '@/utils/logger';

export class NotificationAnalyticsService {
  /**
   * Tracks when a user opens the app via a push notification tap.
   * Finds the most recent successful log for that event/url and marks it as opened.
   */
  static async trackNotificationOpen(payloadData: Record<string, unknown>) {
    if (!payloadData || !payloadData.event) return;

    try {
      // Find the most recent un-opened notification log for this user & event
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: logs, error: fetchError } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('notification_type', payloadData.event)
        .eq('status', 'success')
        .is('opened_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError || !logs || logs.length === 0) return;

      // Mark as opened
      const logId = logs[0].id;
      const { error: updateError } = await supabase
        .from('notification_logs')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', logId);

      if (updateError) {
        logger.warn(LogTag.DB, 'Failed to track notification open', updateError);
      } else {
        logger.info(LogTag.API, 'Tracked notification open successfully');
      }
    } catch (e) {
      logger.error(LogTag.API, 'Exception in trackNotificationOpen', e);
    }
  }
}
