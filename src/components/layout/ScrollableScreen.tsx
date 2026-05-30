import React from 'react';
import { ScrollView } from 'react-native';

import type { ScrollViewProps } from 'react-native';
import { Screen } from './Screen';

interface ScrollableScreenProps extends ScrollViewProps {
  safeArea?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  containerClassName?: string;
  contentContainerClassName?: string;
}

export const ScrollableScreen: React.FC<ScrollableScreenProps> = ({
  children,
  safeArea = true,
  edges,
  containerClassName = '',
  contentContainerClassName = '',
  ...props
}) => {
  return (
    <Screen safeArea={safeArea} edges={edges} className={containerClassName}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerClassName={contentContainerClassName}
        keyboardShouldPersistTaps="handled"
        {...props}
      >
        {children}
      </ScrollView>
    </Screen>
  );
};
