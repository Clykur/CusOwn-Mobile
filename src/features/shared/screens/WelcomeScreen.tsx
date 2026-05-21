import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { THEME } from '@/theme/theme';

export default function WelcomeScreen() {
  return (
    <PremiumBackground>
      <View className="flex-1 px-6 pt-20 pb-10 justify-between">
        {/* Header */}
        <AnimatedSection direction="down">
          <View className="items-center">
            <Text
              className="text-xs font-semibold mb-5 uppercase"
              style={{ letterSpacing: 6, color: THEME.colors.warning }}
            >
              Premium Appointment Platform
            </Text>

            <Text
              className="text-[56px] font-black tracking-[-2px] leading-[58px] text-center mt-5"
              style={{ color: THEME.colors.primary }}
            >
              CusOwn
            </Text>

            <Text className="text-textSecondary text-center mt-6 text-base leading-8 px-4">
              Seamlessly book appointments, manage experiences, and connect with premium service
              providers — all in one platform.
            </Text>
          </View>
        </AnimatedSection>

        {/* CTA Card */}
        <AnimatedSection delay={600} direction="up">
          <GlassCard className="rounded-[34px] border border-border p-8 mt-8">
            <View className="mb-8">
              <Text
                className="text-[32px] font-black leading-9 mb-4"
                style={{ color: THEME.colors.primary }}
              >
                Built Around{'\n'}Your Time
              </Text>

              <Text className="text-textSecondary text-base leading-8">
                Discover services, schedule appointments, manage bookings, and enjoy a smooth
                premium experience designed for modern lifestyles.
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
            <Text
              className="text-xs uppercase"
              style={{ letterSpacing: 4, color: THEME.colors.textSecondary }}
            >
              Designed For Premium Experiences
            </Text>
          </View>
        </AnimatedSection>
      </View>
    </PremiumBackground>
  );
}
