import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
} from 'react-native';

import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { useOnboardingStore } from '@/store/onboarding.store';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Smart Scheduling',
    description:
      'Manage appointments effortlessly with a premium booking experience.',
    icon: 'calendar-clear-outline' as const,
  },
  {
    id: '2',
    title: 'Seamless Experiences',
    description:
      'Everything flows through one elegant and modern platform.',
    icon: 'sparkles-outline' as const,
  },
  {
    id: '3',
    title: 'Built To Scale',
    description:
      'Designed for multiple industries, premium services, and future growth.',
    icon: 'trending-up-outline' as const,
  },
];

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);

  const flatListRef = useRef<FlatList>(null);

  const setOnboardingCompleted = useOnboardingStore(
    (state) => state.setOnboardingCompleted
  );

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
    <LinearGradient
      colors={['#FAFAFA', '#F4F4F5', '#EEEEEE']}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>

        {/* Header */}
        <AnimatedSection direction="down">
          <View
            style={{
              paddingHorizontal: 28,
              paddingTop: 90,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                letterSpacing: 5,
                textTransform: 'uppercase',
                color: '#D97706',
                fontWeight: '600',
                marginBottom: 20,
              }}
            >
              Premium Experience
            </Text>

            <Text
              style={{
                fontSize: 48,
                fontWeight: '900',
                color: '#0F172A',
                lineHeight: 54,
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
                paddingHorizontal: 28,
                paddingBottom: 120,
              }}
            >
              <AnimatedSection direction="up">
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 32,
                    padding: 32,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: '#000',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 28,
                    }}
                  >
                    <Ionicons
                      name={item.icon}
                      size={34}
                      color="#FFF"
                    />
                  </View>

                  <Text
                    style={{
                      fontSize: 34,
                      fontWeight: '900',
                      color: '#0F172A',
                      lineHeight: 40,
                      marginBottom: 18,
                    }}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={{
                      fontSize: 17,
                      color: '#64748B',
                      lineHeight: 30,
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
            paddingHorizontal: 28,
            paddingBottom: 50,
          }}
        >
          {/* Indicators */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: 36,
            }}
          >
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={{
                  width: index === activeIndex ? 40 : 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor:
                    index === activeIndex ? '#000' : '#CBD5E1',
                  marginHorizontal: 4,
                }}
              />
            ))}
          </View>

          <PremiumButton
            title={
              activeIndex === SLIDES.length - 1
                ? 'Get Started'
                : 'Continue'
            }
            onPress={handleNext}
            className="w-full"
          />

          <View
            style={{
              alignItems: 'center',
              marginTop: 24,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: '#94A3B8',
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