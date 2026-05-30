import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  withSequence,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';

import type { Session } from '@supabase/supabase-js';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { useOnboardingStore } from '@/store/onboarding.store';

const PHRASES = [
  'Book Instantly',
  'Manage Effortlessly',
  'Grow Your Business',
  'Luxury Meets Technology',
];

export default function Splash() {
  const setSession = useAuthStore((s) => s.setSession);
  const { selectedRole, setSplashShown } = useOnboardingStore();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const taglineOpacity = useSharedValue(0);
  const phraseOpacity = useSharedValue(0);
  const phraseTranslateY = useSharedValue(10);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: interpolate(taglineOpacity.value, [0, 1], [20, 0]) }],
  }));

  const phraseStyle = useAnimatedStyle(() => ({
    opacity: phraseOpacity.value,
    transform: [{ translateY: phraseTranslateY.value }],
  }));

  useEffect(() => {
    let timeout1: NodeJS.Timeout;
    let timeout2: NodeJS.Timeout;

    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await authService.getSession();
        await setSession(session);

        // eslint-disable-next-line react-hooks/immutability
        logoOpacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) });
        // eslint-disable-next-line react-hooks/immutability
        logoScale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.back(1.5)) });

        // eslint-disable-next-line react-hooks/immutability
        taglineOpacity.value = withDelay(800, withTiming(1, { duration: 1000 }));

        timeout1 = setTimeout(() => {
          // eslint-disable-next-line react-hooks/immutability
          startPhraseRotation();
        }, 1500);

        timeout2 = setTimeout(() => {
          setSplashShown(true);
          // eslint-disable-next-line react-hooks/immutability
          handleNavigation(session);
        }, 4500);
      } catch (error) {
        console.error('Initialization error:', error);
        router.replace('/(public)/welcome');
      }
    };

    initialize();

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPhraseRotation = () => {
    // eslint-disable-next-line react-hooks/immutability
    phraseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withDelay(800, withTiming(0, { duration: 600 })),
      ),
      -1,
      false,
      () => {
        runOnJS(nextPhrase)();
      },
    );
    // eslint-disable-next-line react-hooks/immutability
    phraseTranslateY.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 600 }),
        withDelay(800, withTiming(-10, { duration: 600 })),
      ),
      -1,
    );
  };

  const nextPhrase = () => {
    setCurrentPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    // eslint-disable-next-line react-hooks/immutability
    phraseTranslateY.value = 10;
  };

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
      <View className="flex-1 items-center justify-center px-luxury">
        <Animated.View style={logoStyle} className="shadow-lg shadow-secondary/50">
          <View className="w-28 h-28 bg-accent-premium rounded-3xl items-center justify-center rotate-12">
            <Text className="text-black text-5xl font-bold italic -rotate-12">C</Text>
          </View>
        </Animated.View>

        <Animated.View style={logoStyle} className="mt-8">
          <Text className="text-text text-5xl font-bold tracking-tighter">
            Cus<Text className="text-accent-premium">Own</Text>
          </Text>
        </Animated.View>

        <Animated.View style={taglineStyle} className="mt-4">
          <Text className="text-textLight text-lg font-medium tracking-1 uppercase text-center">
            Elevated Experiences
          </Text>
        </Animated.View>

        <View className="h-16 mt-12 items-center justify-center">
          <Animated.Text
            style={phraseStyle}
            className="text-accent-premium text-xl font-semibold italic text-center"
          >
            {PHRASES[currentPhraseIndex]}
          </Animated.Text>
        </View>
      </View>

      <AnimatedSection
        direction="up"
        delay={2000}
        className="absolute bottom-16 w-full items-center"
      >
        <Text className="text-textSecondary/50 text-xs tracking-2 uppercase">
          Powered by Gold Protocol
        </Text>
      </AnimatedSection>
    </PremiumBackground>
  );
}
