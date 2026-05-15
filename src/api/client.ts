import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

// Determine the base URL dynamically leveraging strict fallbacks
const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Hardened 15-second edge connectivity window to accommodate remote DB cold-starts over flaky mobile interfaces
  timeout: 15000,
});

// Request Interceptor: Attach Supabase auth token securely
apiClient.interceptors.request.use(
  async (config) => {
    const session = useAuthStore.getState().session;
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    // Conditionally trace debug footprints only in development containers
    if (__DEV__) {
      console.log(`[API Request]: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors (e.g., 401 Unauthorized) and scrub traces
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API Response OK]: ${response.config.url} (${response.status})`);
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      console.log(`[API Error Intercepted]: ${error.config?.url} status code: ${error.response?.status}`);
    }
    
    // Log 401s for debugging but don't immediately purge the session.
    // Let the Supabase auth listener or specific screen logic handle re-auth
    // to avoid aggressive logouts during temporary token refresh gaps.
    if (error.response?.status === 401) {
      console.warn(`[API] 401 Unauthorized for ${error.config?.url}. Background refresh may be pending.`);
    }
    return Promise.reject(error);
  }
);
