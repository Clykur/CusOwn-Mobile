import { THEME } from '@/theme/theme';
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { logger, LogTag } from '@/utils/logger';

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
      logger.info(LogTag.AUTH, '[CALLBACK] 📥 Callback screen reached', { code: !!code, error });

      // 1. Check for OAuth errors from the provider
      if (error) {
        logger.error(
          LogTag.AUTH,
          `[CALLBACK] ❌ OAuth Error: ${error}`,
          new Error(error_description),
        );
        Alert.alert(
          'Authentication Failed',
          error_description || 'An error occurred during Google sign-in.',
        );
        router.replace('/(public)/welcome');
        return;
      }

      // 2. Wait for auth store to finish any initial checks
      if (isAuthLoading) {
        logger.info(LogTag.AUTH, '[CALLBACK] ⏳ Auth store is loading, waiting...');
        return;
      }

      // 3. If we already have a session, RootLayout will handle the redirection.
      if (session) {
        logger.info(
          LogTag.AUTH,
          '[CALLBACK] ✅ Session already exists, waiting for RootLayout to redirect...',
        );
        return;
      }

      // 4. If we have a code but no session, it means useAuth.ts might have missed the return
      // or the app was cold-booted from the redirect.
      if (code) {
        try {
          logger.info(
            LogTag.AUTH,
            '[CALLBACK] 🔑 Exchanging code for session (Fallback handler)...',
          );
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) throw exchangeError;

          if (data.session) {
            logger.info(LogTag.AUTH, '[CALLBACK] ✨ Session established via fallback');
            await setSession(data.session);
          }
        } catch (err: any) {
          logger.warn(
            LogTag.AUTH,
            '[CALLBACK] ⚠️ Exchange failed or already handled:',
            err.message,
          );

          // Double check if a session appeared while we were trying (race condition)
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();
          if (currentSession) {
            logger.info(
              LogTag.AUTH,
              '[CALLBACK] 🔍 Session found after failed exchange, proceeding...',
            );
            await setSession(currentSession);
            return;
          }

          // If it's a real error and we still don't have a session, go back
          if (
            !err.message?.includes('verifier not found') &&
            !err.message?.includes('already used')
          ) {
            logger.error(LogTag.AUTH, '[CALLBACK] ❌ Real exchange error', err);
            Alert.alert('Sign In Failed', 'We could not establish your session. Please try again.');
            router.replace('/(public)/welcome');
          }
        }
      } else {
        // No code and no session? Wait a moment or go back.
        // Sometimes the onAuthStateChange listener in RootLayout is faster.
        logger.info(LogTag.AUTH, '[CALLBACK] ℹ️ No code found yet, waiting for session...');

        const timeout = setTimeout(() => {
          if (!useAuthStore.getState().session) {
            logger.info(
              LogTag.AUTH,
              '[CALLBACK] ⏹️ No session after timeout, returning to welcome',
            );
            router.replace('/(public)/welcome');
          }
        }, 3000);

        return () => clearTimeout(timeout);
      }
    }

    handleCallback();
  }, [code, error, error_description, session, role, isAuthLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={THEME.colors.text} />
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
    backgroundColor: '#010409', // primary-obsidian
  },
  text: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
});
