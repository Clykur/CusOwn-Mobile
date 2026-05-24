import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';

import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';

import { PremiumBackground } from '@/components/ui/PremiumBackground';

import card1 from '../../../../assets/Everything-in-one-place-1.svg';
import card2 from '../../../../assets/Everything-in-one-place-2.svg';
import card3 from '../../../../assets/Everything-in-one-place-3.svg';

import { useOnboardingStore } from '@/store/onboarding.store';
import { THEME } from '@/theme/theme';

const SLIDES = [
  {
    id: '1',
    title: 'Smart Scheduling',
    subtitle: 'Effortless booking and schedule management.',
    image: card1,
  },
  {
    id: '2',
    title: 'Seamless Experiences',
    subtitle: `Modern workflows built for premium\nservices.`,
    image: card2,
  },
  {
    id: '3',
    title: 'Built To Scale',
    subtitle: 'Flexible infrastructure for growing businesses.',
    image: card3,
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();

  const [activeIndex, setActiveIndex] = useState(0);

  const setOnboardingCompleted = useOnboardingStore((state) => state.setOnboardingCompleted);

  const currentSlide = SLIDES[activeIndex];

  const completeFlow = () => {
    setOnboardingCompleted(true);

    router.push('/(public)/role-selection');
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else {
      completeFlow();
    }
  };

  return (
    <PremiumBackground>
      <View className="flex-1 px-7 pt-20 pb-12">
        {/* Slide */}
        <View className="flex-1 justify-center overflow-hidden">
          <Animated.View
            key={currentSlide.id}
            entering={SlideInRight.duration(650).springify().damping(20).stiffness(120)}
            exiting={SlideOutLeft.duration(320)}
            style={{
              transform: [{ translateX: 0 }],
            }}
          >
            <View className="items-center">
              {/* SVG */}
              <View
                style={{
                  width: width * 0.74,
                  height: width * 0.74,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 50,
                }}
              >
                <currentSlide.image width="100%" height="100%" />
              </View>

              {/* Title */}
              <Text
                style={{
                  fontSize: 34,
                  fontWeight: '900',
                  color: THEME.colors.primary,
                  textAlign: 'center',
                  marginBottom: 18,
                }}
              >
                {currentSlide.title}
              </Text>

              {/* Subtitle */}
              <Text
                style={{
                  fontSize: 16,
                  lineHeight: 30,
                  color: THEME.colors.textSecondary,
                  textAlign: 'center',
                  paddingHorizontal: 10,
                }}
              >
                {currentSlide.subtitle}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Indicators */}
        <View className="flex-row justify-center mb-10">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={{
                width: index === activeIndex ? 34 : 8,
                height: 8,
                borderRadius: 999,
                marginHorizontal: 4,
                backgroundColor: index === activeIndex ? THEME.colors.primary : THEME.colors.border,
              }}
            />
          ))}
        </View>

        {/* Bottom Buttons */}
        <View className="flex-row justify-between items-center">
          {/* Skip */}
          <TouchableOpacity onPress={completeFlow}>
            <Text
              style={{
                color: THEME.colors.textSecondary,
                fontSize: 15,
                fontWeight: '700',
                letterSpacing: 1,
              }}
            >
              SKIP
            </Text>
          </TouchableOpacity>

          {/* Next */}
          <TouchableOpacity
            onPress={handleNext}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: THEME.colors.primary,
                fontSize: 15,
                fontWeight: '700',
                letterSpacing: 1,
                marginRight: 4,
              }}
            >
              {activeIndex === SLIDES.length - 1 ? 'START' : 'NEXT'}
            </Text>

            <Ionicons name="chevron-forward" size={18} color={THEME.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </PremiumBackground>
  );
}
