import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { BlurView } from 'expo-blur';
import { GlassCard } from '@/components/ui/GlassCard';

export default function WelcomeScreen() {
  return (
    <PremiumBackground>
      <View className="flex-1 justify-end px-luxury pb-20">
        <AnimatedSection direction="down" className="mb-auto pt-24">
          <Text className="text-accent-premium text-sm font-bold tracking-[6px] uppercase mb-4">
            Welcome to the Elite
          </Text>
          <Text className="text-slate-900 text-6xl font-bold tracking-tighter leading-[54px]">
            CusOwn{"\n"}
            <Text className="text-accent-premium">Signature.</Text>
          </Text>
        </AnimatedSection>

        <AnimatedSection delay={400} direction="up">
          <GlassCard variant="light" className="rounded-3xl overflow-hidden border border-slate-200/80 p-8 mb-12 shadow-sm bg-white/80">
            <Text className="text-slate-600 text-lg leading-relaxed mb-8">
              Experience the world's most exclusive beauty and wellness concierge service.
              Designed for those who demand excellence.
            </Text>

            <PremiumButton
              title="Begin Your Experience"
              onPress={() => router.push('/(public)/onboarding')}
              variant="primary"
              className="w-full"
            />
          </GlassCard>
        </AnimatedSection>

        <AnimatedSection delay={800} direction="up" className="items-center">
          <Text className="text-slate-400 text-[10px] tracking-[4px] uppercase">
            Curated by Excellence
          </Text>
        </AnimatedSection>
      </View>
    </PremiumBackground>
  );
}
