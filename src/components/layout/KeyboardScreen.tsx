import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import type { KeyboardAvoidingViewProps } from 'react-native';
import { ScrollableScreen } from './ScrollableScreen';

interface KeyboardScreenProps extends Omit<KeyboardAvoidingViewProps, 'behavior'> {
  safeArea?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  containerClassName?: string;
  contentContainerClassName?: string;
  children: React.ReactNode;
}

export const KeyboardScreen: React.FC<KeyboardScreenProps> = ({
  children,
  safeArea = true,
  edges,
  containerClassName = '',
  contentContainerClassName = '',
  ...props
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      {...props}
    >
      <ScrollableScreen
        safeArea={safeArea}
        edges={edges}
        containerClassName={containerClassName}
        contentContainerClassName={contentContainerClassName}
      >
        {children}
      </ScrollableScreen>
    </KeyboardAvoidingView>
  );
};
