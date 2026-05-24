import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { THEME } from '@/theme/theme';

const SERVICE_CATEGORIES = [
  {
    id: 'salon',
    title: 'Salons',
    description: 'Haircuts, styling, grooming, and beauty services.',
    icon: 'cut-outline',
    color: THEME.colors.primary,
  },
];

export default function CustomerCategoriesScreen() {
  const onSelectCategory = (id: string) => {
    // Navigate to browse with category filter
    router.push({
      pathname: '/(customer)/browse',
      params: { category: id },
    });
  };

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-luxury pb-12 pt-4"
          showsVerticalScrollIndicator={false}
        >
          <AnimatedSection direction="down" className="mb-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-1">
                Explore
              </Text>
            </View>
            <Text className="text-text text-4xl font-bold tracking-tighter leading-[48px]">
              Find Your <Text className="text-primary">Experience</Text>.
            </Text>
          </AnimatedSection>

          <View className="gap-y-6">
            {SERVICE_CATEGORIES.map((cat, index) => (
              <AnimatedSection key={cat.id} delay={index * 100} direction="up">
                <Pressable onPress={() => onSelectCategory(cat.id)}>
                  <GlassCard className="p-2 overflow-hidden bg-card shadow-sm">
                    <View className="flex-row items-center justify-between mb-6">
                      <View className="w-16 h-16 rounded-2xl items-center justify-center">
                        <Ionicons name={cat.icon as any} size={32} color={cat.color} />
                      </View>
                      <Ionicons name="arrow-forward" size={20} color={THEME.colors.textSecondary} />
                    </View>

                    <Text className="text-text text-2xl font-bold mb-2">{cat.title}</Text>
                    <Text className="text-textSecondary text-sm leading-5 font-medium">
                      {cat.description}
                    </Text>
                  </GlassCard>
                </Pressable>
              </AnimatedSection>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </PremiumBackground>
  );
}
