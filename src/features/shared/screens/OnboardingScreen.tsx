import React, { useState, useRef } from 'react';
import { View, Text, FlatList, useWindowDimensions } from 'react-native';

import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { useOnboardingStore } from '@/store/onboarding.store';
import {
  responsiveFontSize,
  horizontalScale,
  verticalScale,
  moderateScale,
} from '@/utils/responsive';
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
    const contentOffsetX = event.nativeEvent.contentOffset.x;

    const index = Math.round(contentOffsetX / width);

    setActiveIndex(index);
  };

  return (
    <LinearGradient colors={['#FAFAFA', '#F4F4F5', '#EEEEEE']} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <AnimatedSection direction="down">
          <View
            style={{
              paddingHorizontal: horizontalScale(28),
              paddingTop: verticalScale(90),
            }}
          >
            <Text
              style={{
                fontSize: responsiveFontSize(11),
                letterSpacing: 5,
                textTransform: 'uppercase',
                color: '#D97706',
                fontWeight: '600',
                marginBottom: verticalScale(20),
              }}
            >
              Premium Experience
            </Text>

            <Text
              style={{
                fontSize: responsiveFontSize(48),
                fontWeight: '900',
                color: THEME.colors.background,
                lineHeight: responsiveFontSize(54),
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
                justifyContent: 'center',
                paddingHorizontal: horizontalScale(28),
                paddingBottom: verticalScale(50),
              }}
            >
              <AnimatedSection direction="up">
                <View
                  style={{
                    backgroundColor: THEME.colors.text,
                    borderRadius: moderateScale(32),
                    padding: moderateScale(32),
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                >
                  <View
                    style={{
                      width: moderateScale(80),
                      height: moderateScale(80),
                      borderRadius: moderateScale(40),
                      backgroundColor: THEME.colors.background,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: verticalScale(28),
                    }}
                  >
                    <Ionicons name={item.icon} size={moderateScale(34)} color={THEME.colors.text} />
                  </View>

                  <Text
                    style={{
                      fontSize: responsiveFontSize(34),
                      fontWeight: '900',
                      color: THEME.colors.background,
                      lineHeight: responsiveFontSize(40),
                      marginBottom: verticalScale(18),
                    }}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={{
                      fontSize: responsiveFontSize(17),
                      color: THEME.colors.textSecondary,
                      lineHeight: responsiveFontSize(30),
                    }}
                  >
                    {item.description}
                  </Text>
                </View>
              </AnimatedSection>
            </View>
          )}
        />

        {/* Footer */}
        <View
          style={{
            paddingHorizontal: horizontalScale(28),
            paddingBottom: verticalScale(50),
          }}
        >
          {/* Indicators */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: verticalScale(36),
            }}
          >
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={{
                  width: index === activeIndex ? horizontalScale(40) : horizontalScale(8),
                  height: horizontalScale(8),
                  borderRadius: 999,
                  backgroundColor:
                    index === activeIndex ? THEME.colors.background : THEME.colors.border,
                  marginHorizontal: horizontalScale(4),
                }}
              />
            ))}
          </View>

          <PremiumButton
            title={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
            onPress={handleNext}
            className="w-full"
          />

          <View
            style={{
              alignItems: 'center',
              marginTop: verticalScale(24),
            }}
          >
            <Text
              style={{
                fontSize: responsiveFontSize(10),
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: THEME.colors.textSecondary,
              }}
            >
              Designed For Modern Businesses
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
