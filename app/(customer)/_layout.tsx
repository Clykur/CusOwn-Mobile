import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RatingPromptProvider } from '@/features/reviews/components/RatingPromptProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { responsiveFontSize, verticalScale } from '@/utils/responsive';

export default function CustomerTabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,

          sceneStyle: {
            backgroundColor: '#000000',
          },

          headerStyle: {
            backgroundColor: '#000000',
          },

          headerTitleStyle: {
            fontWeight: '800',
            fontSize: responsiveFontSize(18),
            letterSpacing: 0.5,
            color: '#F8FAFC',
          },

          headerTintColor: '#F8FAFC',

          headerShadowVisible: false,

          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopWidth: 0,
            borderTopColor: 'transparent',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
            height: verticalScale(60) + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom : verticalScale(12),
            paddingTop: verticalScale(12),
          },

          tabBarBackground: () => <View style={{ flex: 1, backgroundColor: '#000000' }} />,
          tabBarActiveTintColor: '#FFFFFF',

          tabBarInactiveTintColor: '#64748B',

          tabBarLabelStyle: {
            fontWeight: '700',
            fontSize: responsiveFontSize(10),
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerTitle: 'SIGNATURE',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="home" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Browse',
            headerTitle: 'DISCOVER',
            tabBarIcon: ({ color }: { color: string; size: number }) => (
              <Ionicons name="search" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'Bookings',
            headerTitle: 'RESERVATIONS',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="calendar" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerTitle: 'MAESTRO',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="person" size={22} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="book"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="booking-success"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="browse"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <RatingPromptProvider />
    </>
  );
}
