import React from 'react';
import { View, Text, Image } from 'react-native';
import { router } from 'expo-router';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { THEME } from '@/theme/theme';
import CusOwnIcon from '../../../../assets/Cusown.svg';

export default function WelcomeScreen() {
  return (
    <PremiumBackground>
      <View className="flex-1 px-6 pb-10 justify-between">
        {/* Header */}
        <AnimatedSection direction="down">
          <View className="items-center">
            <CusOwnIcon width={200} height={200} />

            {/* Burger Style Branding */}
            <View className="items-center -mt-14">
              <Text
                className="text-xs font-semibold tracking-[6px] uppercase"
                style={{ color: THEME.colors.text }}
              >
                A CLYKUR PRODUCT
              </Text>
            </View>
          </View>
        </AnimatedSection>

        {/* CTA Card */}
        <AnimatedSection delay={600} direction="up">
          <View className="mb-8">
            <Text
              className="text-[32px] text-center font-black leading-10 mb-4"
              style={{ color: THEME.colors.primary }}
            >
              Your Time.{'\n'}Optimized.
            </Text>

            <Text className="text-textSecondary text-base text-center leading-7">
              Fast bookings, real-time availability, and effortless appointment management.
            </Text>
          </View>

          <PremiumButton
            title="Get Started"
            onPress={() => router.push('/(public)/onboarding')}
            variant="primary"
            className="w-full"
          />
        </AnimatedSection>

        {/* Footer */}
        <AnimatedSection delay={900} direction="up">
          <View className="items-center pt-6">
            <Text
              className="text-xs uppercase"
              style={{ letterSpacing: 4, color: THEME.colors.textSecondary }}
            >
              Modern Scheduling Platform
            </Text>
          </View>
        </AnimatedSection>
      </View>
    </PremiumBackground>
  );
}
