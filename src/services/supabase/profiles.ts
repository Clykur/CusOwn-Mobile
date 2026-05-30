import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user.types';
import { logger, LogTag } from '@/utils/logger';
import { invokeBookingRpc } from './booking-rpc';
import { resolveMediaPublicUrl } from './storage';

const ACCOUNT_RPC = {
  softDeleteUser: 'soft_delete_user_account',
  recoverUser: 'recover_user_account',
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

  if (!profile) {
    return {
      profile: null,
      user: { id: user.id, email: user.email },
    };
  }

  const enrichedProfile: UserProfile = {
    ...profile,
    email: user.email,
    media: null,
  };

  return {
    profile: enrichedProfile,
    user: {
      id: user.id,
      email: user.email,
    },
    profile_image_url: null,
  };
}

export async function updateProfile(payload: {
  full_name?: string;
  phone_number?: string;
}): Promise<UserProfile> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw authError || new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...(payload.full_name !== undefined ? { full_name: payload.full_name } : {}),
      ...(payload.phone_number !== undefined ? { phone_number: payload.phone_number } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('*')
    .single();

  if (error) {
    logger.error(LogTag.API, 'updateProfile failed', error);
    throw error;
  }

  let profileImageUrl: string | null = null;
  if (data.profile_media_id) {
    try {
      const { url } = await resolveMediaPublicUrl(data.profile_media_id);
      profileImageUrl = url;
    } catch (err: unknown) {
      logger.warn(
        LogTag.API,
        `Failed to resolve media for updated profile: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return {
    ...data,
    email: user.email,
    media: profileImageUrl ? { url: profileImageUrl, signed_url: profileImageUrl } : null,
  } as UserProfile;
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
  const now = new Date();
  const permanentDeletion = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        deleted_at: now.toISOString(),
        permanent_deletion_at: permanentDeletion.toISOString(),
        deletion_reason: reason || 'user_requested',
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }
  } catch (err) {
    logger.error(LogTag.API, 'Direct soft delete of user failed', { err, userId, reason });
    throw err;
  }

  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    logger.error(LogTag.AUTH, 'signOut after deleteAccount failed', signOutError);
    throw signOutError;
  }
}

export async function restoreUserAccount(): Promise<void> {
  const userId = await getActorUserId();
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        deleted_at: null,
        permanent_deletion_at: null,
        deletion_reason: null,
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (err) {
    logger.error(LogTag.API, 'Failed to restore user account', { err, userId });
    throw err;
  }
}

export async function hardDeleteUserAccount(): Promise<void> {
  const userId = await getActorUserId();
  try {
    const { error } = await supabase.from('user_profiles').delete().eq('id', userId);

    if (error) throw error;
  } catch (err) {
    logger.error(LogTag.API, 'Failed to hard delete user account', { err, userId });
    throw err;
  }
}

/**
 * Account recovery via RPC `recover_user_account`.
 */
export async function recoverUserAccount(): Promise<void> {
  const userId = await getActorUserId();

  try {
    await invokeBookingRpc(ACCOUNT_RPC.recoverUser, {
      p_user_id: userId,
    });
    logger.info(LogTag.API, 'User account recovered successfully', { userId });
  } catch (rpcError) {
    logger.error(LogTag.API, 'recover_user_account failed', { rpcError, userId });
    throw rpcError;
  }
}

export async function upsertProfile(payload: {
  id: string;
  user_type: 'customer' | 'owner' | 'both' | 'admin';
  full_name?: string | null;
}): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        id: payload.id,
        user_type: payload.user_type,
        full_name: payload.full_name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();

  if (error) {
    logger.error(LogTag.API, 'Failed to upsert user profile', error);
    throw error;
  }
  return data as unknown as UserProfile;
}
