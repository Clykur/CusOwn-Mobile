import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <View
      className={`bg-luxury-charcoal border border-white/5 rounded-premium p-4 shadow-xl shadow-black/40 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};
