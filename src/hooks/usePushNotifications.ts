// src/hooks/usePushNotifications.ts
import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '@/services/notification.service';
import { useAuthStore } from '@/store/auth.store';
import { logger, LogTag } from '@/utils/logger';

export interface UsePushNotificationsResult {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  hasPermission: boolean;
  isLoading: boolean;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const { user } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    async function setupNotifications() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const token = await NotificationService.registerDevice();

        if (token && isMounted) {
          setExpoPushToken(token);
          setHasPermission(true);

          // Send token to backend
          await NotificationService.sendTokenToBackend(user.id, token);
        }
      } catch (error) {
        logger.error(LogTag.API, 'Failed to setup push notifications', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    setupNotifications();

    // Listeners for foreground notifications and taps are usually handled
    // at a higher level (like _layout.tsx) for deep linking, but keeping state
    // here can be useful for local component reactivity.
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      logger.info(LogTag.API, 'Notification tapped', response);
      // Actual routing happens in _layout.tsx based on the payload
    });

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.id]);

  return {
    expoPushToken,
    notification,
    hasPermission,
    isLoading,
  };
}
