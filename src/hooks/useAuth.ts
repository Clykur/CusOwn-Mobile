import { useState, useEffect } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { LoginFormValues, RegisterFormValues } from '@/schemas/auth.schema';
import { STRINGS } from '@/constants/strings';

// Ensure any in-progress auth sessions can complete (required by expo-web-browser).
WebBrowser.maybeCompleteAuthSession();

const LOG_TAG = '[OAUTH]';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSession, clearSession } = useAuthStore();

  // ─── Environment-Adaptive Redirect URI ────────────────────────────────
  // We hardcode the Proxy URL for dev to ensure Android stability.
  // Prod uses the native 'cusown://' scheme.
  const redirectUrl = __DEV__
    ? "https://auth.expo.io/@karthiknaramala9949/cusown"
    : AuthSession.makeRedirectUri({ scheme: 'cusown', path: 'google-callback' });

  useEffect(() => {
    console.log(LOG_TAG, '--- AUTH CONFIG ---');
    console.log(LOG_TAG, 'Platform:', Platform.OS);
    console.log(LOG_TAG, 'Redirect URI:', redirectUrl);
    console.log(LOG_TAG, '-------------------');
  }, [redirectUrl]);

  // ─── Email Sign-In ────────────────────────────────────────────────────
  const signInWithEmail = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) throw new Error(authError.message);
      if (data.session) await setSession(data.session);
      return data;
    } catch (err: any) {
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

      if (authError) throw new Error(authError.message);
      if (data.session) await setSession(data.session);
      return data;
    } catch (err: any) {
      setError(err.message || STRINGS.ERRORS.GENERIC);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(LOG_TAG, '1. Starting Official PKCE Flow...');
      console.log(LOG_TAG, '   Redirecting to:', redirectUrl);

      // 1. Let Supabase start the OAuth process
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) throw oauthError;
      if (!data?.url) throw new Error('No auth URL returned');

      // 2. Open the browser and wait for the redirect
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success') {
        const { url } = result;
        
        // 3. Extract the code from the URL (handles both # and ? formats)
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
        const code = params.get('code');

        if (!code) throw new Error('Auth code missing from redirect');

        console.log(LOG_TAG, '2. Exchanging code for session...');
        const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (sessionError) throw sessionError;
        
        if (sessionData.session) {
          console.log(LOG_TAG, '3. ✅ Sign-in successful!');
          await setSession(sessionData.session);
        }
      }
    } catch (err: any) {
      console.error(LOG_TAG, '   AUTH_ERROR:', err.message);
      setError(err.message || 'Authentication failed');
      Alert.alert('Sign In Failed', err.message);
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
