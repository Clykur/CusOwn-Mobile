import { THEME } from '@/theme/theme';
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const Loader = ({ message, fullScreen = false }: LoaderProps) => {
  const content = (
    <View className="items-center justify-center p-4">
      <ActivityIndicator size="large" color={THEME.colors.background} />
      {message && <Text className="mt-4 text-textLight text-sm font-medium">{message}</Text>}
    </View>
  );

  if (fullScreen) {
    return <View className="flex-1 items-center justify-center bg-background">{content}</View>;
  }

  return content;
};
