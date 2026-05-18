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
  const cardClass = variant === 'light' ? 'glass-card' : 'glass-card-dark';

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
          intensity={variant === 'light' ? 60 : 80}
          tint={variant === 'light' ? 'light' : 'prominent'}
          className="absolute inset-0"
        />
      ) : (
        <View
          className="absolute inset-0"
          style={{
            backgroundColor:
              variant === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(248,250,252,0.95)',
          }}
        />
      )}
      <View className="p-6 relative">{children}</View>
    </View>
  );
};
