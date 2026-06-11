import React from 'react';
import { Tabs, router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOwnerStats } from '@/hooks/useOwner';
import { responsiveFontSize, verticalScale } from '@/utils/responsive';
import { useEditModeStore } from '@/store/editMode.store';
import { useModal } from '@/hooks/useModal';

export default function OwnerTabsLayout() {
  const { data: stats, isLoading } = useOwnerStats();

  const insets = useSafeAreaInsets();

  const businessCount = stats?.total_businesses ?? null;

  const isEditing = useEditModeStore((s) => s.isEditing);
  const { showModal } = useModal();

  React.useEffect(() => {
    // Only redirect if we explicitly know they have 0 businesses
    if (!isLoading && businessCount === 0) {
      router.replace('/setup/create');
    }
  }, [businessCount, isLoading]);

  if (isLoading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={[
          {
            backgroundColor: '#010409',
          },
        ]}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
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
        sceneStyle: { backgroundColor: '#000000' },
        headerShown: false,
        headerStyle: {
          backgroundColor: '#000000', // pure black
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
        tabBarActiveTintColor: '#FFFFFF', // pure white
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
          title: 'Dashboard',
          tabBarIcon: ({ color, size: _size }: { color: string; size: number }) => (
            <Ionicons name="grid" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="businesses"
        options={{
          title: 'Businesses',
          tabBarIcon: ({ color, size: _size }: { color: string; size: number }) => (
            <Ionicons name="business" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size: _size }: { color: string; size: number }) => (
            <Ionicons name="analytics" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size: _size }: { color: string; size: number }) => (
            <Ionicons name="person" size={22} color={color} />
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
