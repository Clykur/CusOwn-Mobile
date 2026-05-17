import React from 'react';
import { View, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { cssInterop } from 'react-native-css-interop';

cssInterop(BlurView, {
  className: 'style',
});

interface GlassViewProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
}

export const GlassView: React.FC<GlassViewProps> = ({
  children,
  intensity = 20,
  tint = 'dark',
  borderRadius = 16,
  style,
  className,
  ...props
}) => {
  return (
    <View
      className={`overflow-hidden ${className}`}
      style={[{ borderRadius }, style]}
      {...props}
    >
      {/*
       * Android: BlurView internally uses a software-rendered canvas. Nesting
       * hardware-accelerated views (e.g. Animated.View with hardware texture) inside
       * it triggers "Software rendering doesn't support hardware bitmaps".
       * Use a plain semi-transparent View as a safe fallback on Android.
       *
       * iOS: BlurView uses UIVisualEffectView natively — no crash risk.
       */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          tint={tint}
          className="absolute inset-0"
        />
      ) : (
        <View
          className="absolute inset-0"
          style={{
            backgroundColor:
              tint === 'light'
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(15,23,42,0.70)',
          }}
        />
      )}
      <View className="p-4">{children}</View>
    </View>
  );
};
