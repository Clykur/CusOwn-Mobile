import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { logger, LogTag } from '@/utils/logger';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { LoginFormValues, RegisterFormValues } from '@/schemas/auth.schema';
import { STRINGS } from '@/constants/strings';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { parseOAuthParamsFromUrl } from '@/lib/oauthParams';

const OAUTH_PENDING_ROLE_KEY = 'oauth_pending_role';
const NATIVE_GOOGLE_CALLBACK = 'cusown://google-callback';

// Ensure any in-progress auth sessions can complete (required by expo-web-browser).
WebBrowser.maybeCompleteAuthSession();

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSession, clearSession } = useAuthStore();

  // ─── Email Sign-In ────────────────────────────────────────────────────
  const signInWithEmail = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      logger.info(LogTag.AUTH, `Attempting email sign-in for: ${values.email}`);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        logger.error(LogTag.AUTH, `Sign-in failed: ${authError.message}`);
        throw new Error(authError.message);
      }

      if (data.session) {
        logger.info(LogTag.AUTH, `Sign-in successful for: ${values.email}`);
        await setSession(data.session);
      }
      return data;
    } catch (err: any) {
      logger.error(LogTag.AUTH, `Unexpected error during sign-in`, err);
      setError(err.message || STRINGS.ERRORS.GENERIC);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ─── Email Sign-Up ────────────────────────────────────────────────────
  const signUpWithEmail = async (values: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      logger.info(LogTag.AUTH, `Attempting email sign-up for: ${values.email} as ${values.role}`);
      const { data, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            role: values.role,
          },
        },
      });

      if (authError) {
        logger.error(LogTag.AUTH, `Sign-up failed: ${authError.message}`);
        throw new Error(authError.message);
      }

      if (data.session) {
        logger.info(LogTag.AUTH, `Sign-up successful for: ${values.email}`);

        // Ensure the profile is created/updated with the correct user_type immediately
        try {
          await supabase
            .from('user_profiles')
            .update({
              user_type: values.role.toLowerCase(),
              full_name: values.fullName,
            })
            .eq('id', data.session.user.id);
        } catch (syncErr) {
          logger.error(LogTag.AUTH, 'Failed to sync profile after signup', syncErr);
        }

        await setSession(data.session);
      } else {
        logger.info(LogTag.AUTH, `Sign-up request sent. Verification may be required.`);
      }
      return data;
    } catch (err: any) {
      logger.error(LogTag.AUTH, `Unexpected error during sign-up`, err);
      setError(err.message || STRINGS.ERRORS.GENERIC);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (role: string) => {
    setLoading(true);
    setError(null);
    try {
      logger.info(LogTag.AUTH, '1. 🚀 Initializing Google OAuth Flow...');

      await SecureStore.setItemAsync(OAUTH_PENDING_ROLE_KEY, role);

      // APK / dev client: must match Android intentFilters in app.json (cusown://google-callback).
      const redirectUri =
        Constants.executionEnvironment === ExecutionEnvironment.StoreClient
          ? AuthSession.makeRedirectUri({ path: 'google-callback' })
          : NATIVE_GOOGLE_CALLBACK;

      logger.info(LogTag.AUTH, `2. 🔗 Generated Redirect URI: ${redirectUri}`);
      logger.info(
        LogTag.AUTH,
        `   ⚠️  IMPORTANT: Copy the URI above and add it to your Supabase "Redirect URLs" whitelist!`,
      );

      // 1. Get the OAuth URL from Supabase
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
            skip_http_redirect: 'true',
          },
        },
      });

      if (oauthError) throw oauthError;
      if (!data?.url) throw new Error('Could not generate authentication URL');

      logger.info(LogTag.AUTH, `3. 🌐 Opening Auth Session...`);

      // 2. Open the auth session
      // For universal apps, using the redirectUri as the second param is critical
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      logger.info(LogTag.AUTH, `4. 📥 Browser Result Type: ${result.type}`);

      // 3. Handle the result
      if (result.type === 'success') {
        const { url } = result;
        logger.info(LogTag.AUTH, `5. 🔎 Parsing Callback URL: ${url}`);

        const {
          code: parsedCode,
          error: oauthErr,
          error_description: oauthErrDesc,
        } = parseOAuthParamsFromUrl(url);
        const code = parsedCode ?? undefined;
        const errorMsg = oauthErrDesc || oauthErr;

        if (errorMsg) {
          logger.error(LogTag.AUTH, `❌ OAuth Error returned: ${errorMsg}`);
          throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
        }

        if (!code) {
          logger.warn(
            LogTag.AUTH,
            '⚠️ No code found in result URL. This might be handled by google-callback.tsx',
          );
          return;
        }

        // Check if session was already handled by google-callback.tsx (deep link)
        const currentStoreSession = useAuthStore.getState().session;
        if (currentStoreSession) {
          logger.info(LogTag.AUTH, '✅ Session already handled by deep link listener.');
          return;
        }

        logger.info(LogTag.AUTH, '6. 🔑 Exchanging code for session...');
        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
          if (
            sessionError.message.includes('already used') ||
            sessionError.message.includes('verifier not found')
          ) {
            logger.info(LogTag.AUTH, 'ℹ️ Code already exchanged (likely by google-callback.tsx).');
            return;
          }
          throw sessionError;
        }

        if (sessionData.session) {
          logger.info(LogTag.AUTH, '7. ✨ Session established! Updating state...');

          await setSession(sessionData.session);

          // Save selected role
          await supabase.from('user_profiles').upsert({
            id: sessionData.session.user.id,
            user_type: role.toLowerCase(),
          });

          // Route based on selected role
          if (role === 'Owner') {
            router.replace('/(owner)');
          } else {
            router.replace('/(customer)');
          }
        }
      } else if (result.type === 'cancel') {
        logger.info(LogTag.AUTH, '⏹️ Sign-in cancelled by user');
      } else {
        logger.warn(LogTag.AUTH, `⚠️ Unexpected browser result type: ${result.type}`);
      }
    } catch (err: any) {
      logger.error(LogTag.AUTH, `❌ OAuth Flow Failed: ${err.message}`, err);
      const userFriendlyError = err.message || 'Failed to sign in with Google';
      setError(userFriendlyError);
      Alert.alert('Sign In Failed', userFriendlyError);
    } finally {
      setLoading(false);
    }
  };

  // ─── Sign Out ─────────────────────────────────────────────────────────
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      await clearSession();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    loading,
    error,
  };
};
