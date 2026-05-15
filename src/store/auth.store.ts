import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SECURE_STORE_SESSION_KEY = 'cusown_session';

export type Role = 'Customer' | 'Owner' | null;

interface AuthState {
  user: User | null;
  session: Session | null;
  role: Role;
  isLoading: boolean;
  setSession: (session: Session | null) => Promise<void>;
  clearSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setLoading: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  role: null,
  isLoading: true,
  setSession: async (session) => {
    const user = session?.user || null;
    const role = (user?.user_metadata?.role as Role) || null;
    set({ session, user, role, isLoading: false });
  },
  clearSession: async () => {
    set({ session: null, user: null, role: null, isLoading: false });
  },
  restoreSession: async () => {
    // Session is restored automatically by the Supabase client.
    // The onAuthStateChange listener in RootLayout will sync it to this store.
    set({ isLoading: false });
  },
  setLoading: (val) => {
    set({ isLoading: val });
  },
}));