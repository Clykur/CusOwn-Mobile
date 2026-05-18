import { supabase } from '@/lib/supabase';
import { getActorUserId } from './booking-rpc';
import { assertBusinessOwnedByUser } from './owner-access';
import { isStorageRlsError, logStorageDebug, logStorageError } from './storage-debug';
import { isMissingColumnError, logQueryFallback } from './select-fallback';
import { logSupabaseFailure } from './errors';

export const STORAGE_BUCKETS = {
  business: 'business-media',
  profile: 'profile-media',
} as const;

export type PickedImageFile = {
  uri: string;
  name?: string;
  type?: string;
};

export type MediaListItem = {
  id: string;
  url: string | null;
  storage_path: string;
  bucket_name: string;
  sort_order?: number;
  entity_type?: string;
  entity_id?: string;
};

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to read file: ${response.status}`);
  }
  return response.arrayBuffer();
}

export function getPublicStorageUrl(
  bucketName: string | null | undefined,
  storagePath: string,
): string | null {
  if (!storagePath) return null;
  const bucket = bucketName || STORAGE_BUCKETS.business;
  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl || null;
}

export async function createSignedStorageUrl(
  bucketName: string,
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    logStorageError('createSignedUrl failed', error, { bucketName, storagePath });
    return null;
  }
  return data.signedUrl;
}

export async function resolveMediaPublicUrl(mediaId: string): Promise<{ url: string | null }> {
  const { data, error } = await supabase
    .from('media')
    .select('storage_path, bucket_name')
    .eq('id', mediaId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return { url: null };
  }

  const publicUrl = getPublicStorageUrl(data.bucket_name, data.storage_path);
  if (publicUrl) {
    return { url: publicUrl };
  }

  const signed = await createSignedStorageUrl(
    data.bucket_name || STORAGE_BUCKETS.business,
    data.storage_path,
  );
  return { url: signed };
}

export async function resolveMediaUrlsBatch(
  mediaRows: { id: string; storage_path: string; bucket_name: string }[],
): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {};
  for (const row of mediaRows) {
    out[row.id] = getPublicStorageUrl(row.bucket_name, row.storage_path);
  }
  return out;
}

async function assertBusinessOwner(businessId: string, ownerUserId: string): Promise<void> {
  await assertBusinessOwnedByUser(businessId, ownerUserId);
}

async function insertMediaRow(params: {
  entity_type: 'business' | 'profile';
  entity_id: string;
  bucket_name: string;
  storage_path: string;
  content_type: string;
  sort_order?: number;
}): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('media')
    .insert({
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      bucket_name: params.bucket_name,
      storage_path: params.storage_path,
      content_type: params.content_type,
      sort_order: params.sort_order ?? 0,
      processing_status: 'ready',
    })
    .select('*')
    .single();

  if (error) {
    logStorageError('insert media row failed', error, params);
    if (isStorageRlsError(error)) {
      throw new Error('Permission denied uploading media');
    }
    throw error;
  }
  return data as Record<string, unknown>;
}

export async function uploadToStorage(params: {
  bucket: string;
  storagePath: string;
  file: PickedImageFile;
  upsert?: boolean;
}): Promise<void> {
  const buffer = await uriToArrayBuffer(params.file.uri);
  const contentType = params.file.type || 'image/jpeg';

  logStorageDebug('uploading', { bucket: params.bucket, path: params.storagePath, contentType });

  const { error } = await supabase.storage.from(params.bucket).upload(params.storagePath, buffer, {
    contentType,
    upsert: params.upsert ?? false,
  });

  if (error) {
    logStorageError('storage.upload failed', error, {
      bucket: params.bucket,
      path: params.storagePath,
    });
    throw error;
  }
}

export async function listBusinessMedia(businessId: string): Promise<{ items: MediaListItem[] }> {
  let { data, error } = await supabase
    .from('media')
    .select('id, storage_path, bucket_name, sort_order, entity_type, entity_id')
    .eq('entity_type', 'business')
    .eq('entity_id', businessId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error && isMissingColumnError(error)) {
    logQueryFallback('listBusinessMedia', 'retry without deleted_at', error);
    ({ data, error } = await supabase
      .from('media')
      .select('id, storage_path, bucket_name, sort_order, entity_type, entity_id')
      .eq('entity_type', 'business')
      .eq('entity_id', businessId)
      .order('sort_order', { ascending: true }));
  }

  if (error) {
    logSupabaseFailure('listBusinessMedia', error, { businessId });
    return { items: [] };
  }

  const items = (data || []).map((row) => ({
    id: row.id as string,
    storage_path: row.storage_path as string,
    bucket_name: (row.bucket_name as string) || STORAGE_BUCKETS.business,
    sort_order: row.sort_order as number | undefined,
    entity_type: row.entity_type as string | undefined,
    entity_id: row.entity_id as string | undefined,
    url: getPublicStorageUrl(row.bucket_name as string, row.storage_path as string),
  }));

  return { items };
}

export async function uploadBusinessGalleryImage(
  businessId: string,
  file: PickedImageFile,
): Promise<MediaListItem> {
  const ownerId = await getActorUserId();
  await assertBusinessOwner(businessId, ownerId);

  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
  const storagePath = `${businessId}/gallery/${Date.now()}.${ext}`;
  const bucket = STORAGE_BUCKETS.business;

  await uploadToStorage({ bucket, storagePath, file, upsert: false });

  const row = await insertMediaRow({
    entity_type: 'business',
    entity_id: businessId,
    bucket_name: bucket,
    storage_path: storagePath,
    content_type: file.type || `image/${ext}`,
  });

  return {
    id: String(row.id),
    url: getPublicStorageUrl(bucket, storagePath),
    storage_path: storagePath,
    bucket_name: bucket,
  };
}

export async function uploadProfileAvatar(
  file: PickedImageFile,
): Promise<{ mediaId: string; url: string | null }> {
  const userId = await getActorUserId();
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
  const storagePath = `${userId}/avatar/${Date.now()}.${ext}`;
  const bucket = STORAGE_BUCKETS.profile;

  await uploadToStorage({ bucket, storagePath, file, upsert: true });

  const row = await insertMediaRow({
    entity_type: 'profile',
    entity_id: userId,
    bucket_name: bucket,
    storage_path: storagePath,
    content_type: file.type || `image/${ext}`,
  });

  const mediaId = String(row.id);

  const { error: profileErr } = await supabase
    .from('user_profiles')
    .update({ profile_media_id: mediaId, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (profileErr) {
    logStorageError('link profile_media_id failed', profileErr, { userId, mediaId });
    throw profileErr;
  }

  return {
    mediaId,
    url: getPublicStorageUrl(bucket, storagePath),
  };
}

export async function softDeleteMedia(mediaId: string): Promise<void> {
  const ownerId = await getActorUserId();

  const { data: media, error: loadErr } = await supabase
    .from('media')
    .select('id, entity_type, entity_id')
    .eq('id', mediaId)
    .single();

  if (loadErr) throw loadErr;

  if (media.entity_type === 'business') {
    await assertBusinessOwner(media.entity_id, ownerId);
  } else if (media.entity_type === 'profile' && media.entity_id !== ownerId) {
    throw new Error('Cannot delete another user profile media');
  }

  const { error } = await supabase
    .from('media')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', mediaId);

  if (error) {
    logStorageError('softDeleteMedia failed', error, { mediaId });
    throw error;
  }
}
