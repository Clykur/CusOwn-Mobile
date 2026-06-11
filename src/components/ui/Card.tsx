import React from 'react';
import { View } from 'react-native';

import type { ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <View
      className={`bg-luxury-charcoal card-border-treatment p-4 shadow-xl shadow-black/40 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};
