import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { GlassCard } from '@/components/ui/GlassCard';
import { THEME } from '@/theme/theme';

const { width } = Dimensions.get('window');

interface OnboardingStepProps {
  title: string;
  points: string[];
  icon: keyof typeof Ionicons.glyphMap;
  variant?: 'customer' | 'owner' | 'platform';
}

export const OnboardingStep: React.FC<OnboardingStepProps> = ({
  title,
  points,
  icon,
  variant = 'platform',
}) => {
  const getVariantColor = () => {
    switch (variant) {
      case 'customer':
        return THEME.colors.text;
      case 'owner':
        return THEME.colors.text;
      default:
        return THEME.colors.primary;
    }
  };

  const color = getVariantColor();

  return (
    <View style={[{ width }]} className="px-luxury items-center justify-center">
      <Animated.View entering={FadeInUp.delay(200).duration(800)} className="mb-12">
        <View className="w-28 h-28 rounded-full items-center justify-center bg-border/20 border border-border shadow-2xl">
          <Ionicons name={icon} size={56} color={color} />
        </View>
      </Animated.View>

      <GlassCard className="w-full">
        <Animated.View entering={FadeInDown.delay(400).duration(1000)}>
          <Text className="text-text text-3xl font-bold mb-8 text-center tracking-tight">
            {title}
          </Text>
        </Animated.View>

        <View className="gap-y-5">
          {points.map((point, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(600 + index * 100).duration(800)}
              className="flex-row items-center"
            >
              <View className="w-8 h-8 rounded-full bg-border/20 items-center justify-center mr-4 border border-border">
                <Ionicons name="checkmark-sharp" size={18} color={color} />
              </View>
              <Text className="text-textLight text-lg flex-1 leading-6">{point}</Text>
            </Animated.View>
          ))}
        </View>
      </GlassCard>
    </View>
  );
};
