import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user.types';
import { logger, LogTag } from '@/utils/logger';
import { invokeBookingRpc } from './booking-rpc';

const ACCOUNT_RPC = {
  softDeleteUser: 'soft_delete_user_account',
} as const;

export type ProfileApiPayload = {
  profile: UserProfile | null;
  user?: {
    id: string;
    email?: string;
  };
  /** Legacy REST shape — optional for UI compatibility */
  profile_image_url?: string | null;
};

/**
 * Matches legacy GET /user/profile shape used by screens and auth.store.
 */
export async function getProfilePayload(): Promise<ProfileApiPayload> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    logger.error(LogTag.AUTH, 'getProfilePayload auth.getUser failed', authError);
    throw authError;
  }

  if (!user) {
    return { profile: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    const msg = profileError.message || '';
    if (msg.includes('infinite recursion')) {
      logger.error(
        LogTag.API,
        'user_profiles RLS infinite recursion — apply supabase/migrations/20260519100001_fix_user_profiles_rls_recursion.sql (see docs/supabase-migration/RLS_USER_PROFILES.md)',
        profileError,
      );
    } else {
      logger.error(
        LogTag.API,
        'getProfilePayload user_profiles failed (returning null profile)',
        profileError,
      );
    }
    return {
      profile: null,
      user: { id: user.id, email: user.email },
    };
  }

  return {
    profile: profile as UserProfile | null,
    user: {
      id: user.id,
      email: user.email,
    },
  };
}

export async function updateProfile(payload: {
  full_name?: string;
  phone_number?: string;
}): Promise<UserProfile> {
  const userId = await getActorUserId();

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...(payload.full_name !== undefined ? { full_name: payload.full_name } : {}),
      ...(payload.phone_number !== undefined ? { phone_number: payload.phone_number } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    logger.error(LogTag.API, 'updateProfile failed', error);
    throw error;
  }

  return data as UserProfile;
}

async function getActorUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.id) {
    throw error || new Error('Not authenticated');
  }
  return user.id;
}

/**
 * Account deletion via production RPC `soft_delete_user_account`, then sign out.
 */
export async function deleteUserAccount(reason?: string): Promise<void> {
  const userId = await getActorUserId();

  try {
    // Matches production overload: (p_user_id, p_actor_id, p_reason) — not the admin overload with p_ip_address / p_override_legal_hold.
    await invokeBookingRpc(ACCOUNT_RPC.softDeleteUser, {
      p_user_id: userId,
      p_actor_id: userId,
      p_reason: reason || 'user_requested',
    });
  } catch (rpcError) {
    logger.error(LogTag.API, 'soft_delete_user_account failed', { rpcError, userId, reason });
    throw rpcError;
  }

  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    logger.error(LogTag.AUTH, 'signOut after deleteAccount failed', signOutError);
    throw signOutError;
  }
}
