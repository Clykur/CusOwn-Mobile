import React, { useState, useRef } from 'react';
import { View, Text, FlatList, Dimensions, Pressable } from 'react-native';
import { router } from 'expo-router';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/store/onboarding.store';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Precision Management',
    description: 'Bespoke tools designed for high-performance beauty businesses.',
    icon: 'diamond-outline' as const,
    color: '#000000'
  },
  {
    id: '2',
    title: 'Elite Concierge',
    description: 'Instant access to the most exclusive salons and treatment centers.',
    icon: 'star-outline' as const,
    color: '#000000'
  },
  {
    id: '3',
    title: 'Seamless Growth',
    description: 'Advanced analytics and automated operations at your fingertips.',
    icon: 'stats-chart-outline' as const,
    color: '#000000'
  }
];

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const setOnboardingCompleted = useOnboardingStore((state) => state.setOnboardingCompleted);

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
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
    <PremiumBackground>
      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={({ item }) => (
            <View className="w-screen px-luxury items-center justify-center pt-20">
              <View className="w-32 h-32 rounded-full items-center justify-center bg-accent-premium/10 border border-accent-premium/20 mb-12">
                <Ionicons name={item.icon} size={64} color="#000000" />
              </View>
              <Text className="text-slate-900 text-4xl font-bold text-center tracking-tight mb-6">
                {item.title}
              </Text>
              <Text className="text-slate-500 text-xl text-center leading-relaxed">
                {item.description}
              </Text>
            </View>
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
        />

        <View className="px-luxury pb-20">
          <View className="flex-row justify-center gap-x-2 mb-12">
            {SLIDES.map((_, index) => (
              <View
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-12 bg-accent-premium' : 'w-4 bg-slate-200'
                  }`}
              />
            ))}
          </View>

          <PremiumButton
            title={activeIndex === SLIDES.length - 1 ? "Discover CusOwn" : "Continue"}
            onPress={handleNext}
            className="w-full"
          />
        </View>
      </View>
    </PremiumBackground>
  );
}
