import { supabase } from '@/lib/supabase';
import { LoginFormValues, RegisterFormValues } from '@/schemas/auth.schema';
import { AuthTokenResponsePassword, AuthResponse, OAuthResponse } from '@supabase/supabase-js';

export const authService = {
  signInWithEmail: async (values: LoginFormValues): Promise<AuthTokenResponsePassword> => {
    return await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
  },

  signUpWithEmail: async (values: RegisterFormValues): Promise<AuthResponse> => {
    return await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          role: values.role,
        },
      },
    });
  },

  updateUserProfileOnSignUp: async (userId: string, role: string, fullName: string) => {
    return await supabase
      .from('user_profiles')
      .update({
        user_type: role.toLowerCase(),
        full_name: fullName,
      })
      .eq('id', userId);
  },

  signInWithGoogle: async (redirectUri: string): Promise<OAuthResponse> => {
    return await supabase.auth.signInWithOAuth({
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
  },

  exchangeCodeForSession: async (code: string) => {
    return await supabase.auth.exchangeCodeForSession(code);
  },

  upsertGoogleProfile: async (userId: string, role: string) => {
    return await supabase.from('user_profiles').upsert({
      id: userId,
      user_type: role.toLowerCase(),
    });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  getSession: async () => {
    return await supabase.auth.getSession();
  },
};
