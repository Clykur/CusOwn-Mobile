import { Platform } from 'react-native';

const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL?.replace(/\/api$/, '');

const getBaseUrl = () => {
  if (envUrl && envUrl.includes('localhost')) {
    return Platform.OS === 'android' ? envUrl.replace('localhost', '10.0.2.2') : envUrl;
  }
  return envUrl || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');
};

export const API_BASE_URL = getBaseUrl();

export const ENDPOINTS = {
  SALONS: '/api/salons',
  SALONS_LIST: '/api/salons/list',
  SLOTS: '/api/slots',
  BOOKINGS: '/api/bookings',
  OWNER_BOOKINGS: '/api/owner/bookings',
  OWNER_STATS: '/api/owner/stats',
  OWNER_SERVICES: '/api/owner/services',
  NOTIFICATIONS_REGISTER: '/api/notifications/register',
};
