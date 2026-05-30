import React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { PressableProps } from 'react-native';
import { THEME } from '@/theme/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PremiumButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  textClassName?: string;
  loading?: boolean;
}

const PremiumButtonBase: React.FC<PremiumButtonProps> = ({
  title,
  variant = 'primary',
  className = '',
  textClassName = '',
  loading = false,
  ...props
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };

  const onPressOut = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const getButtonClass = () => {
    switch (variant) {
      case 'outline':
        return 'premium-button-outline';
      case 'secondary':
        return 'border border-border bg-input h-14 rounded-premium items-center justify-center';
      default:
        return 'premium-button';
    }
  };

  return (
    <AnimatedPressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={animatedStyle}
      disabled={loading || props.disabled}
      className={`w-full ${getButtonClass()} ${className} ${loading ? 'opacity-70' : ''}`}
      {...props}
    >
      <View className="flex-row items-center justify-center">
        {loading && <ActivityIndicator size="small" color={THEME.colors.text} className="mr-2" />}
        <Text
          className={`text-lg font-bold tracking-tight ${
            variant === 'primary' ? 'text-background' : 'text-accent-premium'
          } ${textClassName}`}
        >
          {title}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

export const PremiumButton = React.memo(PremiumButtonBase);
