import React from 'react';
import { View, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  backgroundColor?: string;
  padding?: boolean;
}

export const ScreenWrapper = ({
  children,
  scrollable = false,
  onRefresh,
  refreshing = false,
  backgroundColor = 'bg-background',
  padding = true,
}: ScreenWrapperProps) => {
  const content = (
    <View className={`flex-1 ${padding ? 'px-4' : ''}`}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${backgroundColor}`}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {scrollable ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};
