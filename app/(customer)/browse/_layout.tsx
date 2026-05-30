import { Stack } from 'expo-router';
import React from 'react';

export default function BrowseLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="salons/[id]" />
    </Stack>
  );
}
