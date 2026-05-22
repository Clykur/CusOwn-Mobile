import { supabase } from '@/lib/supabase';
import { Service } from '@/types/business.types';
import { logger, LogTag } from '@/utils/logger';
import { mapServiceRow } from './mappers';
import { getActorUserId } from './booking-rpc';
import { assertBusinessOwnedByUser, listOwnedBusinessIds } from './owner-access';
import { logSupabaseFailure } from './errors';
import { isMissingColumnError, logQueryFallback } from './select-fallback';

const SERVICE_SELECT =
  'id, business_id, name, description, duration_minutes, price_cents, is_active, created_at, updated_at';

async function queryServices(
  businessIds: string[],
  options?: { activeOnly?: boolean; singleBusinessId?: string },
): Promise<Record<string, unknown>[]> {
  const activeOnly = options?.activeOnly === true;
  const filterIds = options?.singleBusinessId ? [options.singleBusinessId] : businessIds;
  if (!filterIds.length) return [];

  const run = async (select: string, withActiveFilter: boolean) => {
    let q = supabase.from('services').select(select).in('business_id', filterIds).order('name');
    if (withActiveFilter && activeOnly) {
      q = q.eq('is_active', true);
    }
    return q;
  };

  let result = await run(SERVICE_SELECT, true);
  if (result.error && isMissingColumnError(result.error)) {
    logQueryFallback('queryServices', 'retry without is_active filter', result.error);
    result = await run(SERVICE_SELECT, false);
  }
  if (result.error) {
    logQueryFallback('queryServices', 'retry select *', result.error);
    result = await run('*', false);
  }
  if (result.error) {
    logSupabaseFailure('queryServices', result.error, { businessIds: filterIds });
    throw result.error;
  }

  let rows = (result.data || []) as unknown as Record<string, unknown>[];
  if (activeOnly) {
    rows = rows.filter((r) => r.is_active !== false);
  }
  return rows;
}

export function mapServiceRecord(row: Record<string, unknown>): Service {
  return mapServiceRow(row);
}

export async function listOwnerServices(
  businessId?: string,
  ownerUserId?: string,
): Promise<Service[]> {
  const ownerId = ownerUserId ?? (await getActorUserId());

  const ids = await listOwnedBusinessIds(ownerId);
  if (!ids.length) return [];

  const targetIds = businessId ? ids.filter((id) => id === businessId) : ids;
  const rows = await queryServices(targetIds, { activeOnly: false, singleBusinessId: businessId });
  return rows.map((r) => mapServiceRecord(r));
}

export async function listPublicServices(
  businessId: string,
): Promise<{ id: string; name: string; description?: string; duration: number; price: string }[]> {
  const rows = await queryServices([businessId], {
    activeOnly: true,
    singleBusinessId: businessId,
  });

  return rows.map((s) => {
    const mapped = mapServiceRecord(s as Record<string, unknown>);
    return {
      id: mapped.id,
      name: mapped.name,
      description: mapped.description,
      duration: mapped.duration,
      price: mapped.price ? String(Math.round(mapped.price)) : '0',
    };
  });
}

export async function createService(payload: {
  business_id: string;
  name: string;
  description?: string;
  duration_minutes?: number;
  duration?: number;
  price_inr?: number;
  price?: number;
  price_cents?: number;
}): Promise<Service> {
  const ownerId = await getActorUserId();
  await assertBusinessOwnedByUser(payload.business_id, ownerId);

  const duration_minutes = payload.duration_minutes ?? payload.duration ?? 30;
  const price_cents =
    payload.price_cents !== undefined
      ? payload.price_cents
      : payload.price_inr !== undefined
        ? Math.round(payload.price_inr * 100)
        : payload.price !== undefined
          ? Math.round(Number(payload.price) * 100)
          : 0;

  const { data, error } = await supabase
    .from('services')
    .insert({
      business_id: payload.business_id,
      name: payload.name,
      description: payload.description ?? null,
      duration_minutes,
      price_cents,
      is_active: true,
    })
    .select(SERVICE_SELECT)
    .single();

  if (error) throw error;
  return mapServiceRecord(data as Record<string, unknown>);
}

export async function updateService(
  serviceId: string,
  payload: {
    name?: string;
    description?: string;
    duration_minutes?: number;
    duration?: number;
    price_inr?: number;
    price?: number;
    price_cents?: number;
    is_active?: boolean;
  },
): Promise<Service> {
  const ownerId = await getActorUserId();
  const { data: existing, error: loadErr } = await supabase
    .from('services')
    .select('id, business_id')
    .eq('id', serviceId)
    .single();

  if (loadErr) throw loadErr;
  await assertBusinessOwnedByUser(
    String((existing as { business_id: string }).business_id),
    ownerId,
  );

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.name !== undefined) patch.name = payload.name;
  if (payload.description !== undefined) patch.description = payload.description;
  if (payload.duration_minutes !== undefined) patch.duration_minutes = payload.duration_minutes;
  else if (payload.duration !== undefined) patch.duration_minutes = payload.duration;
  if (payload.price_cents !== undefined) patch.price_cents = payload.price_cents;
  else if (payload.price_inr !== undefined) patch.price_cents = Math.round(payload.price_inr * 100);
  else if (payload.price !== undefined) patch.price_cents = Math.round(Number(payload.price) * 100);
  if (payload.is_active !== undefined) patch.is_active = payload.is_active;

  const { data, error } = await supabase
    .from('services')
    .update(patch)
    .eq('id', serviceId)
    .select(SERVICE_SELECT)
    .single();

  if (error) throw error;
  return mapServiceRecord(data as Record<string, unknown>);
}

export async function deleteService(serviceId: string): Promise<void> {
  const ownerId = await getActorUserId();
  const { data: existing, error: loadErr } = await supabase
    .from('services')
    .select('id, business_id')
    .eq('id', serviceId)
    .single();

  if (loadErr) throw loadErr;
  await assertBusinessOwnedByUser(
    String((existing as { business_id: string }).business_id),
    ownerId,
  );

  const { error } = await supabase.from('services').delete().eq('id', serviceId);

  if (error) throw error;
}
