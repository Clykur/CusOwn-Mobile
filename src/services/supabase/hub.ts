import { supabase } from '@/lib/supabase';
import { getActorUserId } from './booking-rpc';
import { logger, LogTag } from '@/utils/logger';
import { logSupabaseFailure } from './errors';
import { assertBusinessOwnedByUser } from './owner-access';

async function assertBusinessOwner(businessId: string): Promise<string> {
  const ownerId = await getActorUserId();
  await assertBusinessOwnedByUser(businessId, ownerId);
  return ownerId;
}

export async function getBusinessQrCode(
  businessId: string,
  _regenerate?: boolean,
): Promise<{ qr_code?: string; booking_link?: string }> {
  await assertBusinessOwner(businessId);

  const { data, error } = await supabase
    .from('businesses')
    .select('qr_code, booking_link')
    .eq('id', businessId)
    .is('deleted_at', null)
    .single();

  if (error) {
    logSupabaseFailure('getBusinessQrCode', error, { businessId });
    throw error;
  }

  return {
    qr_code: data.qr_code ?? undefined,
    booking_link: data.booking_link ?? undefined,
  };
}

export async function listBusinessHolidays(businessId: string): Promise<Record<string, unknown>[]> {
  await assertBusinessOwner(businessId);
  const { data, error } = await supabase
    .from('business_holidays')
    .select('*')
    .eq('business_id', businessId)
    .order('holiday_date', { ascending: true });

  if (error) {
    logSupabaseFailure('listBusinessHolidays', error, { businessId });
    throw error;
  }
  return (data || []) as Record<string, unknown>[];
}

export async function listBusinessClosures(businessId: string): Promise<Record<string, unknown>[]> {
  await assertBusinessOwner(businessId);
  const { data, error } = await supabase
    .from('business_closures')
    .select('*')
    .eq('business_id', businessId)
    .order('start_date', { ascending: true });

  if (error) {
    logSupabaseFailure('listBusinessClosures', error, { businessId });
    throw error;
  }
  return (data || []) as Record<string, unknown>[];
}

export async function addBusinessHoliday(
  businessId: string,
  payload: { holiday_date: string; holiday_name?: string },
): Promise<void> {
  await assertBusinessOwner(businessId);
  const { error } = await supabase.from('business_holidays').insert({
    business_id: businessId,
    holiday_date: payload.holiday_date,
    holiday_name: payload.holiday_name || 'Holiday',
  });

  if (error) {
    logger.error(LogTag.API, 'addBusinessHoliday failed', error);
    throw error;
  }
}

export async function deleteBusinessHoliday(businessId: string, holidayId: string): Promise<void> {
  await assertBusinessOwner(businessId);
  const { error } = await supabase
    .from('business_holidays')
    .delete()
    .eq('id', holidayId)
    .eq('business_id', businessId);

  if (error) {
    logSupabaseFailure('deleteBusinessHoliday', error, { businessId, holidayId });
    throw error;
  }
}

export async function addBusinessClosure(
  businessId: string,
  payload: { start_date: string; end_date: string; reason?: string },
): Promise<void> {
  await assertBusinessOwner(businessId);
  const { error } = await supabase.from('business_closures').insert({
    business_id: businessId,
    start_date: payload.start_date,
    end_date: payload.end_date,
    reason: payload.reason || 'Downtime',
  });

  if (error) {
    logger.error(LogTag.API, 'addBusinessClosure failed', error);
    throw error;
  }
}

export async function deleteBusinessClosure(businessId: string, closureId: string): Promise<void> {
  await assertBusinessOwner(businessId);
  const { error } = await supabase
    .from('business_closures')
    .delete()
    .eq('id', closureId)
    .eq('business_id', businessId);

  if (error) {
    logSupabaseFailure('deleteBusinessClosure', error, { businessId, closureId });
    throw error;
  }
}
