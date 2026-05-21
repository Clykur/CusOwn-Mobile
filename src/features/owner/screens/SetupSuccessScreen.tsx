import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/theme/theme';

export default function SuccessScreen() {
  return (
    <PremiumBackground>
      <View className="flex-1 items-center justify-center px-luxury">
        <AnimatedSection direction="down" className="items-center">
          <View className="w-24 h-24 rounded-full bg-slate-100 items-center justify-center mb-8 border border-slate-200">
            <Ionicons name="checkmark-done" size={48} color={THEME.colors.background} />
          </View>
          <Text className="text-slate-900 text-3xl font-black tracking-tight text-center mb-6">
            Identity{'\n'}
            <Text className="text-slate-500">Established.</Text>
          </Text>
          <Text className="text-slate-500 text-base text-center leading-relaxed mb-16 font-medium">
            Your premium business profile has been successfully integrated into the CusOwn network.
          </Text>
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
