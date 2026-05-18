import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useOnboardingStore } from '@/store/onboarding.store';

export default function Index() {
  const { session, role, isLoading } = useAuthStore();
  const { onboardingCompleted, splashShown } = useOnboardingStore();

  if (isLoading) return null;

  // Always show the cinematic splash screen on first load
  if (!splashShown) {
    return <Redirect href="/(public)/splash" />;
  }

  if (session && role) {
    return role === 'Owner' 
      ? <Redirect href="/(owner)" /> 
      : <Redirect href="/(customer)" />;
  }

  if (!onboardingCompleted) {
    return <Redirect href="/(public)/welcome" />;
  }

  return <Redirect href="/(public)/welcome" />;
}
