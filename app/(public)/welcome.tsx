import React from 'react';
import { View, Text, Image } from 'react-native';
import { router } from 'expo-router';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';

export default function WelcomeScreen() {
  return (
    <PremiumBackground>
      <View className="flex-1 px-6 pt-20 pb-10 justify-between">

        {/* Header */}
        <AnimatedSection direction="down">
          <View className="items-center">
            <Text className="text-[10px] tracking-[6px] uppercase text-amber-500 font-semibold mb-5">
              Premium Appointment Platform
            </Text>

            <Text className="text-[56px] font-black text-slate-900 tracking-[-2px] leading-[58px] text-center mt-5">
              CusOwn
            </Text>

            <Text className="text-slate-500 text-center mt-6 text-[17px] leading-8 px-4">
              Seamlessly book appointments, manage experiences,
              and connect with premium service providers —
              all in one platform.
            </Text>
          </View>
        </AnimatedSection>

        {/* CTA Card */}
        <AnimatedSection delay={600} direction="up">
          <GlassCard
            variant="light"
            className="rounded-[34px] border border-slate-200/70 bg-white/75 p-8 mt-8"
          >
            <View className="mb-8">
              <Text className="text-slate-900 text-[32px] font-black leading-9 mb-4">
                Built Around
                {"\n"}
                Your Time
              </Text>

              <Text className="text-slate-600 text-[16px] leading-8">
                Discover services, schedule appointments,
                manage bookings, and enjoy a smooth premium
                experience designed for modern lifestyles.
              </Text>
            </View>

            <PremiumButton
              title="Get Started"
              onPress={() => router.push('/(public)/onboarding')}
              variant="primary"
              className="w-full"
            />
          </GlassCard>
        </AnimatedSection>

        {/* Footer */}
        <AnimatedSection delay={900} direction="up">
          <View className="items-center pt-6">
            <Text className="text-[10px] uppercase tracking-[4px] text-slate-400">
              Designed For Premium Experiences
            </Text>
          </View>
        </AnimatedSection>

      </View>
    </PremiumBackground>
  );
}