import React from 'react';
import { Pressable, Text, PressableProps, View, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PremiumButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  textClassName?: string;
  loading?: boolean;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
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
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const getButtonClass = () => {
    switch (variant) {
      case 'outline':
        return 'premium-button-outline';
      case 'secondary':
        return 'bg-white/10 h-14 rounded-premium items-center justify-center';
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
      className={`${getButtonClass()} ${className} ${loading ? 'opacity-70' : ''}`}
      {...props}
    >
      <View className="flex-row items-center justify-center">
        {loading && <ActivityIndicator size="small" color="#FFF" className="mr-2" />}
        <Text
          className={`text-lg font-bold tracking-tight ${
            variant === 'primary' ? 'text-white' : 'text-accent-premium'
          } ${textClassName}`}
        >
          {title}
        </Text>
      </View>
    </AnimatedPressable>
  );
};
