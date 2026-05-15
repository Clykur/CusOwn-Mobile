import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

/**
 * Production-Grade OAuth Callback Handler
 * 
 * This screen handles incoming deep links for 'cusown://google-callback'.
 * It works in two scenarios:
 * 1. As a fallback for WebBrowser.openAuthSessionAsync()
 * 2. As the primary handler if the app is cold-booted from a redirect
 */
export default function GoogleCallbackScreen() {
  const { code, error, error_description } = useLocalSearchParams<{ 
    code?: string; 
    error?: string;
    error_description?: string;
  }>();
  
  const { setSession, role, session, isLoading: isAuthLoading } = useAuthStore();

  useEffect(() => {
    async function handleCallback() {
      // 1. Check for OAuth errors from the provider
      if (error) {
        console.error('[CALLBACK] OAuth Error:', error, error_description);
        Alert.alert('Authentication Failed', error_description || 'An error occurred during Google sign-in.');
        router.replace('/(auth)/welcome');
        return;
      }

      // 2. If we already have a session and role, just route
      if (session && role) {
        const target = role === 'Owner' ? '/(owner)' : '/(customer)';
        router.replace(target as any);
        return;
      }

      // 3. If we have a PKCE code, exchange it for a session
      if (code) {
        try {
          console.log('[CALLBACK] Exchanging code for session...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) throw exchangeError;
          
          if (data.session) {
            console.log('[CALLBACK] Session established successfully');
            await setSession(data.session);
            // The useEffect will re-run with the new session/role and handle routing
          } else {
            throw new Error('No session returned after code exchange.');
          }
        } catch (err: any) {
          console.error('[CALLBACK] Exchange failed:', err.message);
          Alert.alert('Sign In Failed', 'We could not establish your session. Please try again.');
          router.replace('/(auth)/welcome');
        }
      } else if (!isAuthLoading && !session) {
        // No code and no session? Go back to start.
        router.replace('/(auth)/welcome');
      }
    }

    handleCallback();
  }, [code, error, error_description, session, role, isAuthLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.text}>Completing sign-in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0B0F19',
  },
  text: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
