import axios from 'axios';
import { API_BASE_URL } from '@/constants/api';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: get token from Zustand auth store → set Authorization header
axiosInstance.interceptors.request.use(
  async (config) => {
    const session = useAuthStore.getState().session;
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: on 401 → clear store + redirect to welcome.
// Avoid forcing signOut on transient auth issues; Supabase handles refresh via autoRefreshToken.
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Only clear local Zustand state; Supabase JS storage + auth listeners will reconcile.
      await useAuthStore.getState().clearSession();
      try {
        router.replace('/(auth)/welcome');
      } catch (err) {
        // router might not be mounted yet in background refetch
      }
    }
    return Promise.reject(error);
  }
);

