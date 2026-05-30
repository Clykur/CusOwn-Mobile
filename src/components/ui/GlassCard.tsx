import React from 'react';
import { View, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { cssInterop } from 'react-native-css-interop';

cssInterop(BlurView, {
  className: 'style',
});

interface GlassCardProps extends ViewProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'dark',
  className = '',
  ...props
}) => {
  // Both variants use the same dark card styling in the owner dark-mode theme
  const cardClass = 'glass-card-dark';

  return (
    <View className={`${cardClass} ${className}`} {...props}>
      {/*
       * Android: BlurView uses a software-rendered canvas layer which causes
       * "Software rendering doesn't support hardware bitmaps" when hardware
       * textures are nested inside it. Use a semi-transparent View instead.
       *
       * iOS: BlurView renders natively via UIVisualEffectView — safe to use.
       */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={variant === 'light' ? 40 : 60}
          tint="dark"
          className="absolute inset-0"
        />
      ) : (
        <View
          className="absolute inset-0"
          style={[
            {
              // Elevated dark surface with slight transparency for depth
              backgroundColor: 'rgba(20,20,20,0.97)',
            },
          ]}
        />
      )}
      <View className="p-6 relative">{children}</View>
    </View>
  );
};
