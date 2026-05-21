import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user.types';
import { useOnboardingStore } from './onboarding.store';
import { useActiveRoleStore } from './active-role.store';
import { logger, LogTag } from '@/utils/logger';
import { resolveMediaPublicUrl } from '@/services/supabase/storage';

export type Role = 'Customer' | 'Owner' | null;

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  profileImageUrl: string | null;
  role: Role;
  isLoading: boolean;
  setSession: (session: Session | null) => Promise<void>;
  clearSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setLoading: (val: boolean) => void;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  profileImageUrl: null,
  role: null,
  isLoading: true,
  setSession: async (session) => {
    const user = session?.user || null;
    const currentSession = get().session;

    // 1. If no session, clear and return
    if (!session) {
      set({
        session: null,
        user: null,
        profile: null,
        profileImageUrl: null,
        role: null,
        isLoading: false,
      });
      return;
    }

    // 2. Skip redundant fetches if session hasn't changed and role is already known
    if (session.access_token === currentSession?.access_token && get().role) {
      set({ session, user, isLoading: false });
      return;
    }

    const shouldShowLoading = !get().role;
    set({ session, user, isLoading: shouldShowLoading });

    let role: Role = null;
    let profile: UserProfile | null = null;

    try {
      // 4. Determine Role & Profile
      const activeRole = useActiveRoleStore.getState().activeRole;
      if (activeRole) {
        role = activeRole;
        logger.info(LogTag.AUTH, `[STORE] Using active role from session: ${role}`);
      }

      // Then fetch fresh profile via API (Source of Truth for profile data)
      try {
        // Dynamic import to avoid circular dependency with api.service
        const { apiService } = await import('@/services/api.service');

        const data = await apiService.getProfile();

        if (data && data.profile) {
          profile = data.profile;
          const userType = profile?.user_type?.toLowerCase();

          // If no active role was set, determine it from the API profile.
          // This handles the case of subsequent app opens where we don't go through role selection.
          if (!role) {
            role =
              userType === 'owner' || userType === 'both' || userType === 'admin'
                ? 'Owner'
                : 'Customer';
            logger.info(LogTag.AUTH, `[STORE] Verified role from API: ${role}`);
          }

          // Mark onboarding as completed if we found a verified profile
          useOnboardingStore.getState().setOnboardingCompleted(true);
        }
      } catch (err: any) {
        logger.warn(LogTag.AUTH, `[STORE] Profile fetch failed: ${err.message}.`);
      }

      // 5. Last resort fallback / First-time login profile sync
      if (user && !profile) {
        // If we have an active role, use it. Otherwise, fallback to onboarding role or 'Customer'
        const selectedRole = activeRole || useOnboardingStore.getState().selectedRole;
        role = role || selectedRole || 'Customer';
        logger.info(LogTag.AUTH, `[STORE] No profile found. Syncing initial profile as ${role}`);

        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .upsert(
              {
                id: user.id,
                user_type: role.toLowerCase() as any,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' },
            )
            .select()
            .single();

          if (error) throw error;
          if (data) {
            profile = data;
            // Mark onboarding as completed after successful sync
            useOnboardingStore.getState().setOnboardingCompleted(true);
          }
        } catch (syncErr) {
          logger.error(LogTag.AUTH, '[STORE] Failed to sync profile to DB:', syncErr);
        }
      }

      // 6. Resolve avatar URL if profile has profile_media_id (Supabase-only)
      let profileImageUrl: string | null = null;
      if (profile?.profile_media_id) {
        try {
          const { url } = await resolveMediaPublicUrl(profile.profile_media_id);
          profileImageUrl = url;
        } catch (err: any) {
          logger.warn(LogTag.AUTH, `[STORE] Failed to resolve profile media URL: ${err.message}`);
        }
      }

      set({ session, user, profile, profileImageUrl, role, isLoading: false });
    } catch (err) {
      logger.error(LogTag.AUTH, '[STORE] setSession failed', err);
      const fallbackRole: Role =
        get().role ||
        useActiveRoleStore.getState().activeRole ||
        useOnboardingStore.getState().selectedRole ||
        'Customer';
      set({
        session,
        user,
        profile: get().profile,
        profileImageUrl: get().profileImageUrl,
        role: fallbackRole,
        isLoading: false,
      });
    }
  },
  clearSession: async () => {
    set({
      session: null,
      user: null,
      profile: null,
      profileImageUrl: null,
      role: null,
      isLoading: false,
    });
  },
  restoreSession: async () => {
    set({ isLoading: false });
  },
  setLoading: (val) => {
    set({ isLoading: val });
  },
  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      // Dynamic import to avoid circular dependency with api.service
      const { apiService } = await import('@/services/api.service');
      const data = await apiService.getProfile();

      if (data?.profile) {
        const profile = data.profile;
        const userType = profile.user_type;
        // 'both' and 'admin' default to Owner role unless an active role is set
        const role: Role =
          userType === 'owner' || userType === 'both' || userType === 'admin'
            ? 'Owner'
            : 'Customer';

        const profileImageUrl = data.profile_image_url ?? null;

        set({
          profile,
          role,
          profileImageUrl,
        });
      }
    } catch (err) {
      logger.error(LogTag.AUTH, '[STORE] Error refreshing profile:', err);
    }
  },
}));
