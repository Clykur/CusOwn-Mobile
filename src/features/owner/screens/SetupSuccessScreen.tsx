import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/theme/theme';

export default function SuccessScreen() {
  return (
    <PremiumBackground>
      <View className="flex-1 items-center justify-center px-luxury">
        <AnimatedSection direction="down" className="items-center w-full mb-10">
          {/* Success Icon */}
          <View className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 items-center justify-center mb-8">
            <Ionicons name="checkmark-done" size={48} color={THEME.colors.primary} />
          </View>

          <Text className="text-text text-3xl font-black tracking-tight text-center mb-4">
            Identity{'\n'}
            <Text className="text-primary">Established.</Text>
          </Text>

          <Text className="text-textSecondary text-base text-center leading-relaxed font-medium px-4">
            Your premium business profile has been successfully integrated into the CusOwn network.
          </Text>
        </AnimatedSection>

        {/* Info card */}
        <AnimatedSection delay={200} direction="up" className="w-full mb-8">
          <GlassCard className="bg-card rounded-[22px] p-1">
            <View className="flex-row items-start gap-x-3">
              <View className="w-9 h-9 rounded-full bg-success/10 border border-success/20 items-center justify-center mt-0.5">
                <Ionicons name="checkmark" size={16} color={THEME.colors.success} />
              </View>
              <View className="flex-1">
                <Text className="text-text font-extrabold text-sm mb-1">Profile Live</Text>
                <Text className="text-textSecondary text-xs leading-5">
                  Customers can now discover and book your services through the CusOwn platform.
                </Text>
              </View>
            </View>
          </GlassCard>
        </AnimatedSection>

        <AnimatedSection delay={400} direction="up" className="w-full">
          <PremiumButton
            title="Enter Dashboard"
            onPress={() => router.replace('/(owner)/')}
            className="w-full"
          />
        </AnimatedSection>
      </View>
    </PremiumBackground>
  );
}
