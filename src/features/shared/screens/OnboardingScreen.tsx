import React, { useState, useRef } from 'react';
import { View, Text, FlatList, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';

import { useOnboardingStore } from '@/store/onboarding.store';
import { THEME } from '@/theme/theme';

const SLIDES = [
  {
    id: '1',
    title: 'Smart Scheduling',
    description: 'Manage appointments effortlessly with a premium booking experience.',
    icon: 'calendar-clear-outline' as const,
  },
  {
    id: '2',
    title: 'Seamless Experiences',
    description: 'Everything flows through one elegant and modern platform.',
    icon: 'sparkles-outline' as const,
  },
  {
    id: '3',
    title: 'Built To Scale',
    description: 'Designed for multiple industries, premium services, and future growth.',
    icon: 'trending-up-outline' as const,
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();

  const [activeIndex, setActiveIndex] = useState(0);

  const flatListRef = useRef<FlatList>(null);

  const setOnboardingCompleted = useOnboardingStore((state) => state.setOnboardingCompleted);

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
      });

      setActiveIndex(activeIndex + 1);
    } else {
      setOnboardingCompleted(true);

      router.push('/(public)/role-selection');
    }
  };

  const onScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;

    const index = Math.round(offsetX / width);

    setActiveIndex(index);
  };

  return (
    <PremiumBackground>
      <View className="flex-1 pt-24 pb-12">
        {/* Header */}
        <AnimatedSection direction="down">
          <View className="px-7 mb-8">
            <Text
              className="uppercase font-semibold mb-5"
              style={{
                letterSpacing: 5,
                fontSize: 11,
                color: '#D97706',
              }}
            >
              Premium Experience
            </Text>

            <Text
              style={{
                fontSize: 52,
                fontWeight: '900',
                color: THEME.colors.primary,
                lineHeight: 58,
                letterSpacing: -2,
              }}
            >
              Everything{'\n'}In One Place
            </Text>
          </View>
        </AnimatedSection>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View
              style={{
                width,
                paddingHorizontal: 28,
                justifyContent: 'center',
              }}
            >
              <AnimatedSection direction="up">
                <GlassCard className="rounded-[34px] border border-border p-8">
                  <View
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 999,
                      backgroundColor: THEME.colors.primary,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 30,
                    }}
                  >
                    <Ionicons name={item.icon} size={38} color={THEME.colors.text} />
                  </View>

                  <Text
                    style={{
                      fontSize: 34,
                      fontWeight: '900',
                      lineHeight: 40,
                      color: THEME.colors.primary,
                      marginBottom: 18,
                    }}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={{
                      fontSize: 16,
                      lineHeight: 30,
                      color: THEME.colors.textSecondary,
                    }}
                  >
                    {item.description}
                  </Text>
                </GlassCard>
              </AnimatedSection>
            </View>
          )}
        />

        {/* Footer */}
        <AnimatedSection delay={400} direction="up">
          <View className="px-7 mt-10">
            {/* Indicators */}
            <View className="flex-row justify-center mb-10">
              {SLIDES.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: index === activeIndex ? 38 : 8,
                    height: 8,
                    borderRadius: 999,
                    marginHorizontal: 4,
                    backgroundColor:
                      index === activeIndex ? THEME.colors.primary : THEME.colors.border,
                  }}
                />
              ))}
            </View>

            <PremiumButton
              title={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
              onPress={handleNext}
              className="w-full"
            />

            <View className="items-center mt-6">
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: 4,
                  textTransform: 'uppercase',
                  color: THEME.colors.textSecondary,
                }}
              >
                Designed For Modern Businesses
              </Text>
            </View>
          </View>
        </AnimatedSection>
      </View>
    </PremiumBackground>
  );
}
