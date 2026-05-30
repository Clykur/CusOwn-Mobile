import 'react-native-get-random-values';
import { ensureWebCryptoForSupabasePkce } from '@/lib/webCryptoPolyfill';

ensureWebCryptoForSupabasePkce();

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import * as WebBrowser from 'expo-web-browser';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (__DEV__) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. All data queries will fail. Restart with: npx expo start -c',
    );
  } else if (!supabaseUrl.includes('.supabase.co')) {
    console.warn(
      '[Supabase] EXPO_PUBLIC_SUPABASE_URL does not look like a Supabase project URL:',
      supabaseUrl,
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Set a custom URL opener for OAuth flows
// This allows Supabase to handle the "redirectTo" logic internally
// while using Expo's WebBrowser for the actual window.
supabase.auth.onAuthStateChange((event, session) => {
  // Just to ensure connectivity
});

// We wrap the OAuth opener in a helper
export const openAuthSession = async (url: string, returnUrl: string) => {
  return await WebBrowser.openAuthSessionAsync(url, returnUrl);
};
