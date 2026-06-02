import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RatingPromptProvider } from '@/features/reviews/components/RatingPromptProvider';
import { responsiveFontSize, verticalScale } from '@/utils/responsive';
import { useEditModeStore } from '@/store/editMode.store';
import { useModal } from '@/hooks/useModal';

export default function CustomerTabsLayout() {
  const insets = useSafeAreaInsets();
  const isEditing = useEditModeStore((s) => s.isEditing);
  const { showModal } = useModal();

  return (
    <>
      <Tabs
        screenListeners={{
          tabPress: (e) => {
            if (isEditing) {
              e.preventDefault();
              showModal({
                variant: 'warning',
                title: 'Unsaved Changes',
                description: 'You have unsaved changes. Please save or cancel before leaving.',
                hideCancel: true,
                actions: [
                  {
                    label: 'OK',
                    onPress: () => {},
                    variant: 'primary',
                  },
                ],
              });
            }
          },
        }}
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
            tabBarIcon: ({ color, size: _size }: { color: string; size: number }) => (
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
            tabBarIcon: ({ color, size: _size }: { color: string; size: number }) => (
              <Ionicons name="calendar" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerTitle: 'MAESTRO',
            tabBarIcon: ({ color, size: _size }: { color: string; size: number }) => (
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
