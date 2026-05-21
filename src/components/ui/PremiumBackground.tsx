import React from 'react';
import { View } from 'react-native';

interface PremiumBackgroundProps {
  children?: React.ReactNode;
  variant?: 'dark' | 'gold';
}

export const PremiumBackground: React.FC<PremiumBackgroundProps> = ({ children }) => {
  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 relative z-10">{children}</View>
    </View>
  );
};
