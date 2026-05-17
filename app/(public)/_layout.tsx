import React from 'react';
import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="role-selection" />
    </Stack>
  );
}
