import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import Constants from 'expo-constants';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore, Role } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';
import { axiosInstance } from '@/api/axiosInstance';
import { ENDPOINTS } from '@/constants/api';
// NOTE: expo-notifications remote notifications are not supported in Expo Go (SDK 53+).
// Keep this file compiling in Expo Go by avoiding static imports.
// Remote push registration will be done via a dedicated module that can be excluded/used in Dev Builds.
let Notifications: typeof import('expo-notifications') | null = null;

// We use a safe require pattern to avoid crashes in Expo Go (SDK 53+)
const isExpoGo = Constants?.executionEnvironment === 'storeClient';

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Notifications = require('expo-notifications');
    Notifications?.setNotificationHandler?.({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      } as any),
    });
  } catch {
    Notifications = null;
  }
}


export default function RootLayout() {
  const { session, role, isLoading, setSession } = useAuthStore();
  const segments = useSegments();

  // ─── Initialize Auth ──────────────────────────────────────────────────
  useEffect(() => {
    // 1. Check for an existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Listen for auth state changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AUTH] State changed:', _event);
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ─── Routing & Protection ─────────────────────────────────────────────
  useEffect(() => {
    // Wait for the initial session check to finish
    if (isLoading) return;

    const rootSegment = segments[0];
    const inAuthGroup = rootSegment === '(auth)';
    const isCallback = rootSegment === 'google-callback';
    const isAtRoot = !rootSegment;

    // 1. If signed in, route to appropriate dashboard
    if (session && role) {
      const target = role === 'Owner' ? '/(owner)' : '/(customer)';
      
      // Only redirect if they are currently in the login screens
      if (inAuthGroup || isCallback || isAtRoot) {
        router.replace(target as any);
      }
      
      // Register for notifications once logged in
      registerForPushNotificationsAsync();
    } 
    // 2. If not signed in and trying to access protected routes
    else if (!session && !inAuthGroup && !isCallback) {
      router.replace('/(auth)/welcome');
    }
  }, [session, role, isLoading, segments]);

  const registerForPushNotificationsAsync = async () => {
    if (!Notifications) return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus === 'granted') {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        if (tokenData?.data) {
          await axiosInstance
            .post(ENDPOINTS.NOTIFICATIONS_REGISTER, {
              token: tokenData.data,
              platform: Platform.OS,
            })
            .catch(() => {});
        }
      }
    } catch {
      // ignore push token errors in emulator
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(customer)" options={{ headerShown: false }} />
        <Stack.Screen name="(owner)" options={{ headerShown: false }} />
        <Stack.Screen name="booking" options={{ headerShown: false }} />
        <Stack.Screen
          name="booking-detail/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
    </QueryClientProvider>
  );
}