import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Role } from './auth.store';

interface ActiveRoleState {
  activeRole: Role;
  setActiveRole: (role: Role) => void;
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

export const useActiveRoleStore = create<ActiveRoleState>()(
  persist(
    (set) => ({
      activeRole: null,
      setActiveRole: (role) => set({ activeRole: role }),
    }),
    {
      name: 'active-role-storage',
      storage: createJSONStorage(() => secureStorageAdapter),
    },
  ),
);
