// src/services/notification.service.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { logger, LogTag } from '@/utils/logger';

// Optionally define your project ID here or in app.json for standalone builds
const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;

export class NotificationService {
  /**
   * Request permissions and register the device for push notifications
   */
  static async registerDevice(): Promise<string | null> {
    if (!Device.isDevice) {
      logger.warn(LogTag.PUSH, 'Must use physical device for Push Notifications');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn(LogTag.PUSH, 'Failed to get push token for push notification!');
        return null;
      }

      // Handle Android Notification Channels
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return tokenData.data;
    } catch (error) {
      logger.error(LogTag.PUSH, 'Error registering for push notifications', error);
      return null;
    }
  }

  /**
   * Save the Expo push token to the Supabase database
   */
  static async sendTokenToBackend(userId: string, token: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('push_tokens').upsert(
        {
          user_id: userId,
          token: token,
          platform: Platform.OS,
          provider: 'expo',
        },
        {
          onConflict: 'user_id, token',
        },
      );

      if (error) {
        logger.error(LogTag.API, 'Failed to save push token to backend', error);
        return false;
      }

      logger.info(LogTag.API, 'Push token saved to backend successfully');
      return true;
    } catch (error) {
      logger.error(LogTag.API, 'Exception saving push token', error);
      return false;
    }
  }

  /**
   * Remove the device push token from the Supabase database
   */
  static async unregisterDevice(userId: string, token: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token);

      if (error) {
        logger.error(LogTag.API, 'Failed to remove push token from backend', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error(LogTag.API, 'Exception removing push token', error);
      return false;
    }
  }

  /**
   * Initialize standard notification handlers
   */
  static initializeNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
}
