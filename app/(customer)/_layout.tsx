import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { RatingPromptProvider } from '@/components/customer/RatingPromptProvider';

export default function CustomerTabsLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: '#000000', // pure black
          },
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 18,
            letterSpacing: 0.5,
            color: '#F8FAFC',
          },
          headerTintColor: '#F8FAFC',
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: '#000000', // pure black
            borderTopColor: 'rgba(255,255,255,0.05)',
            height: Platform.OS === 'ios' ? 94 : 70,
            paddingBottom: Platform.OS === 'ios' ? 32 : 12,
            paddingTop: 12,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: '#FFFFFF', // luxury gold
          tabBarInactiveTintColor: '#64748B',
          tabBarLabelStyle: {
            fontWeight: '700',
            fontSize: 10,
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
          name="browse"
          options={{
            title: 'Browse',
            headerTitle: 'DISCOVER',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
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
      </Tabs>
      <RatingPromptProvider />
    </>
  );
}
