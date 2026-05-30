import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'Customer' | 'Owner';

interface OnboardingState {
  onboardingCompleted: boolean;
  selectedRole: UserRole | null;
  splashShown: boolean;
  setSplashShown: (shown: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setSelectedRole: (role: UserRole | null) => void;
  resetOnboarding: () => void;
}

const secureStorageAdapter = {
  getItem: (name: string): string | null | Promise<string | null> => {
    return SecureStore.getItemAsync(name);
  },
  setItem: (name: string, value: string): void | Promise<void> => {
    return SecureStore.setItemAsync(name, value);
  },
  removeItem: (name: string): void | Promise<void> => {
    return SecureStore.deleteItemAsync(name);
  },
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      onboardingCompleted: false,
      selectedRole: null,
      splashShown: false,
      setSplashShown: (shown) => set({ splashShown: shown }),
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      setSelectedRole: (role) => set({ selectedRole: role }),
      resetOnboarding: () =>
        set({ onboardingCompleted: false, selectedRole: null, splashShown: false }),
    }),
    {
      name: 'cusown-onboarding-storage',
      storage: createJSONStorage(() => secureStorageAdapter),
    },
  ),
);
