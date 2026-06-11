import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';
import type { NotificationLog } from '@/hooks/useNotifications';
import { CustomerNotificationType, OwnerNotificationType } from '@/types/notification.types';

interface NotificationContextType {
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType>({ unreadCount: 0 });

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useAuthStore();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    // 1. Initial fetch for unread count
    const fetchInitialCount = async () => {
      let query = supabase
        .from('notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('opened_at', null);

      if (role === 'Owner') {
        query = query.in('notification_type', Object.values(OwnerNotificationType));
      } else {
        query = query.in('notification_type', Object.values(CustomerNotificationType));
      }

      const { count } = await query;
      if (count !== null) setUnreadCount(count);
    };
    fetchInitialCount();

    // 2. Subscribe to realtime inserts
    const channel = supabase
      .channel('public:notification_logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationLog;

          const allowedTypes: string[] =
            role === 'Owner'
              ? Object.values(OwnerNotificationType)
              : Object.values(CustomerNotificationType);

          if (allowedTypes.includes(newNotif.notification_type as string)) {
            setUnreadCount((prev) => prev + 1);

            // Optionally, invalidate the queries so the screen updates
            queryClient.invalidateQueries({ queryKey: ['notifications', user.id, role] });

            // Show a simple alert or toast (in production, use a custom toast component)
            Alert.alert(
              newNotif.title || 'New Notification',
              newNotif.body || 'You have a new update.',
            );
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notification_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // If a notification is marked as read, decrement the count
          const oldRecord = payload.old as NotificationLog;
          const newRecord = payload.new as NotificationLog;
          if (!oldRecord.opened_at && newRecord.opened_at) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, role, queryClient]);

  const value = useMemo(() => ({ unreadCount }), [unreadCount]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
