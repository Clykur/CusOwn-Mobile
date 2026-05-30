import React from 'react';
import { View } from 'react-native';

import type { ViewProps } from 'react-native';

export const GlowContainer: React.FC<ViewProps & { className?: string }> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <View className={`glow-border ${className}`} {...props}>
      {children}
    </View>
  );
};
