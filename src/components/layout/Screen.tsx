import React from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ViewProps } from 'react-native';

interface ScreenProps extends ViewProps {
  safeArea?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  className?: string;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  safeArea = true,
  edges = ['top', 'bottom', 'left', 'right'],
  className = '',
  style,
  ...props
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const insets = useSafeAreaInsets();

  if (safeArea) {
    return (
      <SafeAreaView
        edges={edges}
        className={`flex-1 bg-background ${className}`}
        style={style}
        {...props}
      >
        {children}
      </SafeAreaView>
    );
  }

  return (
    <View className={`flex-1 bg-background ${className}`} style={style} {...props}>
      {children}
    </View>
  );
};
