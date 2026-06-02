import '../global.css';
import { QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { ModalProvider } from '@/providers/ModalProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { useAuthStore } from '@/store/auth.store';
import { useOnboardingStore } from '@/store/onboarding.store';
import { logger, LogTag } from '@/utils/logger';
import { NotificationService } from '@/services/notification.service';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { NotificationPayload } from '@/types/notification.types';
import { getRouteForNotification } from '@/constants/notification-routes';
import { NotificationAnalyticsService } from '@/services/notificationAnalytics.service';

// Keep the splash screen visible while we fetch resources, but ignore errors if it's disabled natively
try {
  SplashScreen.preventAutoHideAsync().catch(() => {
    // Ignore missing splash screen error
  });
} catch (e) {
  // Ignore synchronous errors
}

const isExpoGo = Constants?.executionEnvironment === 'storeClient';

if (!isExpoGo) {
  NotificationService.initializeNotifications();
}

export default function RootLayout() {
  const { session, profile, role, isLoading, setSession } = useAuthStore();
  const { onboardingCompleted } = useOnboardingStore();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const isNavigationReady = !!navigationState?.key;

  // Initialize push notifications (handles permission and syncing to backend)
  usePushNotifications();

  // Listen for Notification Taps (Deep Linking)
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (!isExpoGo) {
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data as NotificationPayload;
          logger.info(LogTag.API, 'Notification tapped, handling deep link', data);

          // Track the open in analytics
          NotificationAnalyticsService.trackNotificationOpen(data);

          // Resolve route using the registry
          let url = data?.url;
          if (!url && data?.event) {
            url = getRouteForNotification(data.event, data) || undefined;
          }

          if (url && isNavigationReady) {
            // Add a small delay to ensure routing stack is ready if app was completely closed
            setTimeout(() => {
              router.push(url as any);
            }, 100);
          }
        },
      );
    }

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isNavigationReady]);

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
  // Hide splash screen exactly once when ready
  useEffect(() => {
    if (!isLoading && isNavigationReady) {
      try {
        SplashScreen.hideAsync().catch(() => {});
      } catch (e) {}
    }
  }, [isLoading, isNavigationReady]);

  useEffect(() => {
    // Wait for the initial session check to finish and navigation to be ready
    if (isLoading || !isNavigationReady) return;

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

      if ((isPublic || isAuth || isRecovery) && !isCallback) {
        logger.info(LogTag.AUTH, `🚀 RootLayout: Navigating to ${target}`);
        router.replace(target as '/(owner)' | '/(customer)');
      }
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

  if (isLoading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={[
          {
            backgroundColor: '#000000',
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
        <NotificationProvider>
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}
          >
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
            <Stack.Screen
              name="owner-booking-detail/[id]"
              options={{
                presentation: 'transparentModal',
                headerShown: false,
                animation: 'fade',
              }}
            />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
          </Stack>
        </NotificationProvider>
      </ModalProvider>
    </QueryClientProvider>
  );
}
