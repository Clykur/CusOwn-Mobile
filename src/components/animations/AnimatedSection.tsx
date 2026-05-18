import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(direction === 'left' ? -30 : direction === 'right' ? 30 : 0);
  const translateY = useSharedValue(direction === 'up' ? 30 : direction === 'down' ? -30 : 0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1)) }),
    );
    translateX.value = withDelay(
      delay,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.back(1)) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.back(1)) }),
    );
  }, [delay, direction]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle} className={className}>
      {children}
    </Animated.View>
  );
};
