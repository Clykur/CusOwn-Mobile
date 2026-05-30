import '../global.css';
import { QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';

import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { ModalProvider } from '@/providers/ModalProvider';
import { useAuthStore } from '@/store/auth.store';
import { useOnboardingStore } from '@/store/onboarding.store';
import { logger, LogTag } from '@/utils/logger';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Notifications: any = null;

const isExpoGo = Constants?.executionEnvironment === 'storeClient';

if (!isExpoGo) {
  try {
    import('expo-notifications').then((mod) => {
      Notifications = mod;
      Notifications?.setNotificationHandler?.({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    });
  } catch {
    Notifications = null;
  }
}

export default function RootLayout() {
  const { session, profile, role, isLoading, setSession } = useAuthStore();
  const { onboardingCompleted } = useOnboardingStore();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const isNavigationReady = !!navigationState?.key;

  // ─── Initialize Auth ──────────────────────────────────────────────────
  useEffect(() => {
    logger.info(LogTag.API, '🔄 RootLayout: Initializing Supabase session...');

    // 1. Check for an existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      logger.info(
        LogTag.AUTH,
        session ? '✅ RootLayout: Session restored' : 'ℹ️ RootLayout: No initial session',
      );
      setSession(session);
    });

    // 2. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      logger.info(LogTag.AUTH, `🔔 RootLayout: Auth Event: ${_event}`, {
        user: session?.user.email,
      });
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession]);

  // ─── Routing & Protection ─────────────────────────────────────────────
  useEffect(() => {
    // Wait for the initial session check to finish and navigation to be ready
    if (isLoading || !isNavigationReady) return;

    // Expo Router automatically shows the splash screen.
    // Calling showAsync() here manually on iOS throws the "No native splash screen registered" error.
    SplashScreen.hideAsync();

    const rootSegment = segments[0];
    const isPublic = rootSegment === '(public)';
    const isAuth = rootSegment === '(auth)';
    const isRecovery = rootSegment === 'recovery';
    const isSplash = isPublic && segments[0] === 'splash';
    const isCallback =
      rootSegment === 'google-callback' ||
      (isAuth && (segments as string[])[1] === 'google-callback');
    const isAtRoot = !rootSegment || rootSegment === 'index';

    logger.info(LogTag.AUTH, `🛣️ RootLayout: Navigation Update`, {
      session: !!session,
      role,
      segment: rootSegment,
    });

    // Let the custom splash screen control its own destiny if it is rendering
    if (isSplash) return;

    // 1. Handle Redirect after Sign-in
    if (session) {
      // 1a. Handle Soft Deleted Account
      if (profile?.deleted_at) {
        if (!isRecovery) {
          logger.info(LogTag.AUTH, '🛑 RootLayout: Account deleted, redirecting to recovery...');
          router.replace('/recovery');
        }
        return; // Prevent further routing logic
      }

      // If we are on the recovery screen but the profile is no longer deleted, continue to the app
      if (isRecovery && !profile?.deleted_at) {
        // Will fall through to the target check below
      }

      if (!role) {
        logger.info(
          LogTag.AUTH,
          '⏳ RootLayout: Session exists but role is null, waiting for resolution...',
        );
        return;
      }

      const target = role === 'Owner' ? '/(owner)' : '/(customer)';

      // Only redirect if they are currently in the public/auth screens (except callback) or the recovery screen
      if ((isPublic || isAuth || isRecovery) && !isCallback) {
        logger.info(LogTag.AUTH, `🚀 RootLayout: Navigating to ${target}`);
        router.replace(target as '/(owner)' | '/(customer)');
      }

      // eslint-disable-next-line react-hooks/immutability
      registerForPushNotificationsAsync();
    }
    // 2. Handle Not Signed In
    else if (!session && !isPublic && !isAuth && !isAtRoot) {
      logger.info(LogTag.AUTH, '🛑 RootLayout: Unauthenticated access attempt, redirecting...');
      router.replace('/(public)/welcome');
    }
    // 3. Handle Onboarding Not Completed (even if signed in or not)
    else if (!onboardingCompleted && !isPublic && !isAuth && !isAtRoot) {
      logger.info(LogTag.AUTH, 'ℹ️ RootLayout: Onboarding not completed, redirecting...');
      router.replace('/(public)/welcome');
    }
  }, [session, profile, role, isLoading, segments, onboardingCompleted, isNavigationReady]);

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
        const { user } = useAuthStore.getState();

        if (tokenData?.data && user?.id) {
          await supabase
            .from('user_profiles')
            .update({
              push_token: tokenData.data,
              platform: Platform.OS,
            })
            .eq('id', user.id);
        }
      }
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={[
          {
            backgroundColor: '#F8FAFC',
          },
        ]}
      >
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ModalProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(public)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)" options={{ headerShown: false }} />
          <Stack.Screen name="(owner)" options={{ headerShown: false }} />
          <Stack.Screen name="setup" options={{ headerShown: false }} />
          <Stack.Screen name="booking" options={{ headerShown: false }} />
          <Stack.Screen
            name="booking-detail/[id]"
            options={{ presentation: 'modal', headerShown: false }}
          />
        </Stack>
      </ModalProvider>
    </QueryClientProvider>
  );
}
