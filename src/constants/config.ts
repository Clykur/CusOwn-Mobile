import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Determine the backend API URL based on the environment and device type.
 */
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  
  // In development, if we're on a physical device, localhost won't work.
  // We need to use the computer's LAN IP.
  if (__DEV__) {
    // On Android Emulator, 10.0.2.2 is the host machine
    if (Platform.OS === 'android' && !Constants.expoConfig?.hostUri && envUrl.includes('localhost')) {
        // This is a fallback for some emulators, but usually localhost works fine on emulators
        // return envUrl.replace('localhost', '10.0.2.2');
    }

    // For physical devices, we try to use the hostUri from Expo
    const hostUri = Constants.expoConfig?.hostUri; // Format: "192.168.x.x:8081"
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (envUrl.includes('localhost')) {
        const resolvedUrl = envUrl.replace('localhost', ip);
        console.log(`[Config] Resolved API URL for development: ${resolvedUrl}`);
        return resolvedUrl;
      }
    }
  }
  
  return envUrl;
};

export const CONFIG = {
  API_URL: getApiUrl(),
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  IS_DEV: __DEV__,
  UNDO_WINDOW_MINUTES: 15,
};

console.log(`[Config] App Environment: ${__DEV__ ? 'Development' : 'Production'}`);
console.log(`[Config] API Base URL: ${CONFIG.API_URL}`);
