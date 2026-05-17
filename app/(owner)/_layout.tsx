import React from 'react';
import { Tabs, Slot, router } from 'expo-router';
import { useColorScheme, Platform, View, ActivityIndicator } from 'react-native';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useOwnerStats } from '@/hooks/useOwner';

export default function OwnerTabsLayout() {
  const { data: stats, isLoading } = useOwnerStats();
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.dark : THEME.light;

  const businessCount = stats?.total_businesses ?? null;

  React.useEffect(() => {
    // Only redirect if we explicitly know they have 0 businesses
    if (!isLoading && businessCount === 0) {
      router.replace('/setup/create');
    }
  }, [businessCount, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#010409', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.card,
        },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: 'rgba(255,255,255,0.05)',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="businesses"
        options={{
          title: 'Businesses',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="analytics" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-business"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="hub/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
