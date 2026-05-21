import { THEME } from '@/theme/theme';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: THEME.colors.background,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Permission rejected: Disabling remote token registration arrays.');
      return null;
    }
    try {
      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || 'cusown-mobile-parity',
      });
    } catch (e) {
      console.log('Token capture fallback executed locally.');
    }
  } else {
    console.log(
      'Simulated device hardware detected: Falling back to mocked local push dispatcher channel.',
    );
  }

  return token?.data || `ExponentPushToken[mock_${Date.now()}]`;
}

/**
 * Register background and foreground lifecycle observers for live socket triggers
 */
export function setupNotificationListeners(
  onNotification: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void,
) {
  const notificationListener = Notifications.addNotificationReceivedListener(onNotification);
  const responseListener = Notifications.addNotificationResponseReceivedListener(onResponse);

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}

/**
 * Proactively dispatch instant native system scheduled push events for testing feature parity loops
 */
export async function scheduleLocalNotification(title: string, body: string, seconds = 2) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { route: 'BookingDetails' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}
