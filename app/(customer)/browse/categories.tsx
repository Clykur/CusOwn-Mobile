import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const SERVICE_CATEGORIES = [
  {
    id: "salon",
    title: "Salon",
    description: "Haircuts, styling, grooming, and beauty services.",
    icon: "cut-outline",
    color: "#000000"
  },
  // {
  //   id: "spa",
  //   title: "Spa & Wellness",
  //   description: "Massages, facials, and relaxation treatments.",
  //   icon: "leaf-outline",
  //   color: "#000000"
  // },
  // {
  //   id: "clinic",
  //   title: "Medical Clinic",
  //   description: "Specialized healthcare and consultation services.",
  //   icon: "medical-outline",
  //   color: "#000000"
  // },
  // {
  //   id: "fitness",
  //   title: "Fitness & Gym",
  //   description: "Personal training, yoga, and workout sessions.",
  //   icon: "barbell-outline",
  //   color: "#000000"
  // }
];

export default function CustomerCategoriesScreen() {
  const onSelectCategory = (id: string) => {
    // Navigate to browse with category filter
    router.push({
      pathname: '/(customer)/browse',
      params: { category: id }
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
          <AnimatedSection direction="down" className="mb-8">
            <View className="flex-row items-center mb-6">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 items-center justify-center mr-4"
              >
                <Ionicons name="arrow-back" size={20} color="#0F172A" />
              </Pressable>
              <Text className="text-accent-premium text-sm font-bold tracking-[6px] uppercase">
                Explore
              </Text>
            </View>
            <Text className="text-slate-900 text-5xl font-bold tracking-tighter leading-[48px]">
              Find Your{"\n"}
              <Text className="text-accent-premium">Experience</Text>.
            </Text>
          </AnimatedSection>

          <View className="gap-y-6">
            {SERVICE_CATEGORIES.map((cat, index) => (
              <AnimatedSection key={cat.id} delay={index * 100} direction="up">
                <Pressable onPress={() => onSelectCategory(cat.id)}>
                  <GlassCard className="p-8 overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <View className="flex-row items-center justify-between mb-6">
                      <View
                        className="w-16 h-16 rounded-2xl items-center justify-center"
                        style={{ backgroundColor: `${cat.color}15`, borderWidth: 1, borderColor: `${cat.color}30` }}
                      >
                        <Ionicons name={cat.icon as any} size={32} color={cat.color} />
                      </View>
                      <Ionicons name="arrow-forward" size={20} color="#64748B" />
                    </View>

                    <Text className="text-slate-900 text-2xl font-bold mb-2">{cat.title}</Text>
                    <Text className="text-slate-500 text-sm leading-5 font-medium">
                      {cat.description}
                    </Text>

                    <View className="mt-6 flex-row items-center">
                      <Text className="text-accent-premium text-[10px] font-black uppercase tracking-widest mr-2">
                        Browse Hubs
                      </Text>
                      <View className="h-[1px] flex-1 bg-accent-premium/20" />
                    </View>
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
