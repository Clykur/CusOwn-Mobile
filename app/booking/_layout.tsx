import { Stack } from 'expo-router';
import React from 'react';

export default function BookingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="select-service" options={{ headerShown: false }} />
      <Stack.Screen name="select-slot" options={{ headerShown: false }} />
      <Stack.Screen name="confirm" options={{ headerShown: false }} />
      <Stack.Screen name="success" options={{ headerShown: false }} />
    </Stack>
  );
}
