import { supabase } from '@/lib/supabase';
import { Business } from '@/types/business.types';
import { logger, LogTag } from '@/utils/logger';
import { enrichBusinessesWithImages, mapBusinessRow, mapServiceRow } from './mappers';
import { getActorUserId, invokeBookingRpc } from './booking-rpc';
import { createService, listPublicServices } from './services';
import { assertBusinessOwnedByUser, listOwnedBusinessIds } from './owner-access';
import { isMissingColumnError, logQueryFallback } from './select-fallback';
import { logSupabaseFailure } from './errors';

/** List/browse: avoid nested `services` embed — often blocked by RLS and fails the whole row. */
const BUSINESS_LIST_SELECT = '*, category:business_categories(id, name, slug, icon_name)';

const BUSINESS_DETAIL_SELECT =
  '*, category:business_categories(id, name, slug, icon_name), services(id, business_id, name, description, price_cents, duration_minutes, duration, price)';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function queryBusinessList(categoryFilter?: string): Promise<Record<string, unknown>[]> {
  let result = await (async () => {
    let q = supabase.from('businesses').select(BUSINESS_LIST_SELECT);
    if (categoryFilter && isUuid(categoryFilter)) {
      q = q.eq('category_id', categoryFilter);
    }
    return q.is('deleted_at', null);
  })();

  if (result.error && isMissingColumnError(result.error)) {
    logQueryFallback('listBusinesses', 'retry without deleted_at filter', result.error);
    let q = supabase.from('businesses').select(BUSINESS_LIST_SELECT);
    if (categoryFilter && isUuid(categoryFilter)) {
      q = q.eq('category_id', categoryFilter);
    }
    result = await q;
  }

  if (result.error) {
    logQueryFallback('listBusinesses', 'retry select *', result.error);
    let q = supabase.from('businesses').select('*');
    if (categoryFilter && isUuid(categoryFilter)) {
      q = q.eq('category_id', categoryFilter);
    }
    result = await q;
  }

  if (result.error) {
    logSupabaseFailure('listBusinesses', result.error);
    throw result.error;
  }

  return (result.data || []) as Record<string, unknown>[];
}

export async function listBusinesses(categoryFilter?: string): Promise<Business[]> {
  let rows = await queryBusinessList(categoryFilter);

  if (categoryFilter && !isUuid(categoryFilter) && rows.length > 0) {
    const slug = categoryFilter.toLowerCase();
    rows = rows.filter((row: Record<string, unknown>) => {
      const cat = row.category as Record<string, unknown> | undefined;
      const rowCat = row.category as string | undefined;
      return (
        String(cat?.slug ?? '').toLowerCase() === slug ||
        String(rowCat ?? '').toLowerCase() === slug
      );
    });
  }

  const mapped = rows
    .map((row) => mapBusinessRow(row as Record<string, unknown>))
    .filter((b) => Boolean(b.id));

  if (__DEV__) {
    logger.info(LogTag.API, `listBusinesses mapped count=${mapped.length}`);
  }

  return enrichBusinessesWithImages(mapped);
}

export async function getBusinessById(id: string): Promise<Business> {
  let { data, error } = await supabase
    .from('businesses')
    .select(BUSINESS_DETAIL_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    logQueryFallback('getBusinessById', 'retry without services embed', error);
    ({ data, error } = await supabase
      .from('businesses')
      .select(BUSINESS_LIST_SELECT)
      .eq('id', id)
      .single());
  }
  if (error) {
    ({ data, error } = await supabase.from('businesses').select('*').eq('id', id).single());
  }
  if (error) {
    logSupabaseFailure('getBusinessById', error, { id });
    throw error;
  }

  let mapped = mapBusinessRow(data as Record<string, unknown>);
  if (!mapped.services?.length) {
    try {
      const pub = await listPublicServices(id);
      mapped = {
        ...mapped,
        services: pub.map((s) =>
          mapServiceRow({
            id: s.id,
            business_id: id,
            name: s.name,
            description: s.description,
            duration_minutes: s.duration,
            price: Number(s.price) || 0,
          }),
        ),
      };
    } catch (svcErr) {
      logger.warn(LogTag.API, 'getBusinessById attach services failed', svcErr);
    }
  }
  const [enriched] = await enrichBusinessesWithImages([mapped]);
  return enriched;
}

export async function listOwnerBusinesses(ownerUserId: string): Promise<Business[]> {
  const ids = await listOwnedBusinessIds(ownerUserId);
  if (!ids.length) return [];

  let { data, error } = await supabase
    .from('businesses')
    .select(BUSINESS_LIST_SELECT)
    .in('id', ids);

  if (error) {
    logQueryFallback('listOwnerBusinesses', 'retry select *', error);
    ({ data, error } = await supabase.from('businesses').select('*').in('id', ids));
  }
  if (error) {
    logSupabaseFailure('listOwnerBusinesses', error, { ownerUserId });
    throw error;
  }

  const mapped = (data || []).map((row) => mapBusinessRow(row as Record<string, unknown>));
  return enrichBusinessesWithImages(mapped);
}

function mapBusinessPayloadToRow(payload: Record<string, unknown>, ownerUserId: string) {
  return {
    owner_user_id: ownerUserId,
    salon_name: payload.salon_name,
    owner_name: payload.owner_name,
    whatsapp_number: payload.whatsapp_number,
    address: payload.address,
    city: payload.city,
    area: payload.area,
    location: payload.location,
    pincode: payload.pincode,
    latitude: payload.latitude,
    longitude: payload.longitude,
    category: payload.category,
    opening_time: payload.opening_time,
    closing_time: payload.closing_time,
    slot_duration: payload.slot_duration ?? 30,
    concurrent_booking_capacity: payload.concurrent_booking_capacity ?? 1,
    booking_link: payload.booking_link,
  };
}

export async function createBusiness(payload: Record<string, unknown>): Promise<Business> {
  const ownerId = await getActorUserId();
  const row = mapBusinessPayloadToRow(payload, ownerId);

  const { data, error } = await supabase
    .from('businesses')
    .insert(row)
    .select(BUSINESS_DETAIL_SELECT)
    .single();

  if (error) {
    logger.error(LogTag.API, 'createBusiness failed', error);
    throw error;
  }

  const business = mapBusinessRow(data as Record<string, unknown>);
  const services = payload.services as
    | { name: string; duration_minutes: number; price_cents: number }[]
    | undefined;

  if (services?.length) {
    await Promise.all(
      services.map((s) =>
        createService({
          business_id: business.id,
          name: s.name,
          duration_minutes: s.duration_minutes,
          price_cents: s.price_cents,
        }),
      ),
    );
  }

  const [enriched] = await enrichBusinessesWithImages([business]);
  return enriched;
}

export async function updateBusiness(
  businessId: string,
  payload: Record<string, unknown>,
): Promise<Business> {
  const ownerId = await getActorUserId();
  await assertBusinessOwnedByUser(businessId, ownerId);

  const { data: current, error: loadErr } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (loadErr) {
    logSupabaseFailure('updateBusiness load', loadErr, { businessId });
    throw loadErr;
  }

  const updates: Record<string, unknown> = {};
  const allowed = [
    'salon_name',
    'owner_name',
    'whatsapp_number',
    'address',
    'city',
    'area',
    'location',
    'pincode',
    'latitude',
    'longitude',
    'category',
    'opening_time',
    'closing_time',
    'slot_duration',
    'concurrent_booking_capacity',
    'booking_link',
  ] as const;
  for (const key of allowed) {
    if (payload[key] !== undefined) updates[key] = payload[key];
  }

  try {
    await invokeBookingRpc('update_business_with_version', {
      p_id: businessId,
      p_version: (current as { version?: number }).version ?? 1,
      p_updates: updates,
    });
  } catch (rpcErr) {
    logger.warn(LogTag.API, 'update_business_with_version failed, using direct update', rpcErr);
    const { error } = await supabase.from('businesses').update(updates).eq('id', businessId);
    if (error) {
      logSupabaseFailure('updateBusiness direct', error, { businessId });
      throw error;
    }
  }

  return getBusinessById(businessId);
}

export async function deleteBusiness(
  businessId: string,
  reason = 'owner_requested',
): Promise<void> {
  const ownerId = await getActorUserId();
  await invokeBookingRpc('soft_delete_business', {
    p_business_id: businessId,
    p_actor_id: ownerId,
    p_reason: reason,
  });
}

export async function searchBusinesses(params: {
  query?: string;
  categoryId?: string;
  city?: string;
}): Promise<Business[]> {
  let query = supabase.from('businesses').select(BUSINESS_LIST_SELECT);

  if (params.categoryId && isUuid(params.categoryId)) {
    query = query.eq('category_id', params.categoryId);
  }
  if (params.city?.trim()) {
    query = query.ilike('city', `%${params.city.trim()}%`);
  }
  if (params.query?.trim()) {
    const q = `%${params.query.trim()}%`;
    query = query.or(`salon_name.ilike.${q},address.ilike.${q},location.ilike.${q}`);
  }

  let { data, error } = await query;

  if (error && isMissingColumnError(error)) {
    logQueryFallback('searchBusinesses', 'retry without embed', error);
    let q = supabase.from('businesses').select('*');
    if (params.categoryId && isUuid(params.categoryId)) q = q.eq('category_id', params.categoryId);
    if (params.city?.trim()) q = q.ilike('city', `%${params.city.trim()}%`);
    if (params.query?.trim()) {
      const term = `%${params.query.trim()}%`;
      q = q.or(`salon_name.ilike.${term},address.ilike.${term},location.ilike.${term}`);
    }
    ({ data, error } = await q);
  }

  if (error) {
    logSupabaseFailure('searchBusinesses', error);
    throw error;
  }

  const mapped = (data || []).map((row) => mapBusinessRow(row as Record<string, unknown>));
  return enrichBusinessesWithImages(mapped);
}
