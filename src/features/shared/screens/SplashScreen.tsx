import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

import type { Session } from '@supabase/supabase-js';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { useOnboardingStore } from '@/store/onboarding.store';
import { THEME } from '@/theme/theme';

const SPLASH_DURATION = 4500;
const FADE_OUT_DURATION = 500;

export default function Splash() {
  const setSession = useAuthStore((s) => s.setSession);
  const { selectedRole, setSplashShown } = useOnboardingStore();

  const [loadPercent, setLoadPercent] = useState(0);

  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.95);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);

  const subtitleOpacity = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [
      {
        translateY: interpolate(subtitleOpacity.value, [0, 1], [16, 0]),
      },
    ],
  }));

  useEffect(() => {
    let percentInterval: NodeJS.Timeout;
    let navigateTimeout: NodeJS.Timeout;

    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await authService.getSession();

        await setSession(session);

        containerOpacity.value = withTiming(1, {
          duration: 700,
          easing: Easing.out(Easing.quad),
        });

        containerScale.value = withTiming(1, {
          duration: 700,
          easing: Easing.out(Easing.exp),
        });

        logoOpacity.value = withTiming(1, {
          duration: 1000,
        });

        logoScale.value = withTiming(1, {
          duration: 1000,
          easing: Easing.out(Easing.back(1.4)),
        });

        subtitleOpacity.value = withTiming(1, {
          duration: 900,
        });

        const start = Date.now();

        percentInterval = setInterval(() => {
          const elapsed = Date.now() - start;
          const progress = Math.min(100, Math.floor((elapsed / SPLASH_DURATION) * 100));
          setLoadPercent(progress);
        }, 30);

        navigateTimeout = setTimeout(() => {
          clearInterval(percentInterval);

          containerOpacity.value = withTiming(0, {
            duration: FADE_OUT_DURATION,
          });

          containerScale.value = withTiming(1.05, {
            duration: FADE_OUT_DURATION,
          });

          setTimeout(() => {
            setSplashShown(true);
            handleNavigation(session);
          }, FADE_OUT_DURATION);
        }, SPLASH_DURATION);
      } catch (error) {
        console.error('Initialization error:', error);
        router.replace('/(public)/welcome');
      }
    };

    initialize();

    return () => {
      clearInterval(percentInterval);
      clearTimeout(navigateTimeout);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavigation = (session: Session | null) => {
    if (session) {
      const role = session.user.user_metadata?.role || selectedRole;
      router.replace(role === 'Owner' ? '/(owner)' : '/(customer)');
    } else {
      router.replace('/(public)/welcome');
    }
  };

  return (
    <PremiumBackground>
      {/* Soft radial glow */}
      <View
        className="absolute w-80 h-80 rounded-full self-center top-1/3"
        style={{
          backgroundColor: 'rgba(212,175,55,0.08)',
        }}
      />

      <Animated.View style={containerStyle} className="flex-1 items-center justify-center px-8">
        {/* Logo */}
        <Animated.View style={logoStyle}>
          <Text className="text-text text-6xl font-black tracking-tight">
            Cus
            <Text className="text-accent-premium">Own</Text>
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={subtitleStyle} className="mt-5">
          <Text className="text-textLight text-sm tracking-[4px] uppercase">
            Elevated Experiences
          </Text>
        </Animated.View>

        {/* Loader */}
        <View className="mt-14 items-center justify-center">
          <ActivityIndicator
            size="large"
            color={THEME.colors.accentPremium || THEME.colors.primary}
          />
        </View>
      </Animated.View>

      {/* Footer Branding */}
      <View className="absolute bottom-16 left-0 right-0 items-center">
        <Text className="text-textSecondary/60 text-xs tracking-[3px] uppercase">
          Powered by Gold Protocol
        </Text>
      </View>

      {/* Loading Percentage */}
      <View className="absolute bottom-8 right-8">
        <Text className="font-mono text-sm">
          <Text className="text-accent-premium font-bold">{loadPercent}</Text>
          <Text className="text-textSecondary">%</Text>
        </Text>
      </View>
    </PremiumBackground>
  );
}
