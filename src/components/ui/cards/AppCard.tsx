import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View, ViewProps, ViewStyle } from 'react-native';
import { GlassCard } from '@/components/ui/GlassCard'; // Assuming GlassCard is the underlying material style
import { useDeviceType } from '@/hooks/useDeviceType';

type AppCardVariant = 'business' | 'booking' | 'analytics' | 'service' | 'deal' | 'default';

interface AppCardProps extends ViewProps {
  variant?: AppCardVariant;
  onPress?: () => void;
  activeOpacity?: number;
  fixedWidth?: number; // Only for horizontal scroll views where flex-1 isn't appropriate
  className?: string;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  variant = 'default',
  onPress,
  activeOpacity = 0.7,
  fixedWidth,
  className = '',
  style,
  ...props
}) => {
  const { isTablet } = useDeviceType();

  // Unified Base styling: same radius, same shadow, same glass effect padding
  // 3xl is 24px radius, 2xl is 16px radius.
  const baseCardStyle = 'bg-card shadow-sm rounded-3xl overflow-hidden';

  // Specific padding based on variant to maintain visual hierarchy
  const getVariantPadding = () => {
    switch (variant) {
      case 'business':
        return 'p-2';
      case 'booking':
        return 'p-2';
      case 'service':
        return 'p-2';
      case 'deal':
        return 'p-2';
      case 'analytics':
        return 'p-2';
      default:
        return 'p-2';
    }
  };

  const dynamicStyle: ViewStyle = fixedWidth ? { width: fixedWidth } : {};

  const CardContent = (
    <GlassCard
      className={`${baseCardStyle} ${getVariantPadding()} ${className}`}
      style={[dynamicStyle, style]}
      {...props}
    >
      {children}
    </GlassCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        style={dynamicStyle}
        className={fixedWidth ? '' : 'flex-1'}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  // If no onPress, but it's part of a flex grid, we wrap it so it expands properly if needed,
  // or just return the GlassCard
  return (
    <View style={dynamicStyle} className={fixedWidth ? '' : 'flex-1'}>
      {CardContent}
    </View>
  );
};
