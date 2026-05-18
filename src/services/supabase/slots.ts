import { supabase } from '@/lib/supabase';
import { logger, LogTag } from '@/utils/logger';
import { isMissingColumnError, logQueryFallback } from './select-fallback';
import { logSupabaseFailure } from './errors';
import { BookingSupabaseError } from './booking-errors';

export function normalizeTimeHHmm(raw: string): string {
  if (!raw) return '';
  const part = raw.includes('T') ? raw.split('T')[1]! : raw;
  const [h, m] = part.split(':');
  const hh = Number(h);
  const mm = Number(m ?? 0);
  if (!Number.isFinite(hh)) return '';
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function formatSlotTime(raw: string): string {
  if (!raw) return '09:00';
  const part = raw.includes('T') ? raw.split('T')[1] : raw;
  const [h, m] = part.split(':');
  if (h == null) return '09:00';
  return `${h.padStart(2, '0')}:${(m ?? '00').padStart(2, '0')}`;
}

export type SlotListItem = {
  id: string;
  business_id: string;
  date: string;
  time: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

type SlotRow = {
  id: string;
  business_id: string;
  date: string;
  time?: string;
  start_time?: string;
  status?: string;
  is_available?: boolean;
};

/**
 * Production uses slots.status ('available'|'reserved'|...); older schema used is_available.
 */
export async function listSlotsForBusiness(
  businessId: string,
  date: string,
  options?: { availableOnly?: boolean },
): Promise<{ slots: SlotListItem[] }> {
  const availableOnly = options?.availableOnly !== false;

  let result = await supabase
    .from('slots')
    .select('id, business_id, date, time, start_time, status, is_available')
    .eq('business_id', businessId)
    .eq('date', date)
    .order('time', { ascending: true });

  if (result.error && isMissingColumnError(result.error)) {
    logQueryFallback('listSlotsForBusiness', 'order by start_time', result.error);
    result = await supabase
      .from('slots')
      .select('id, business_id, date, time, start_time, status, is_available')
      .eq('business_id', businessId)
      .eq('date', date)
      .order('start_time', { ascending: true });
  }

  let rows: SlotRow[] = (result.data || []) as SlotRow[];

  if (availableOnly && !result.error) {
    rows = rows.filter((row) => {
      if (row.status) {
        return row.status === 'available' || row.status === 'reserved';
      }
      return row.is_available !== false;
    });
  }

  if (result.error && isMissingColumnError(result.error)) {
    logQueryFallback('listSlotsForBusiness', 'retry without status column', result.error);
    let q = supabase
      .from('slots')
      .select('id, business_id, date, time, is_available')
      .eq('business_id', businessId)
      .eq('date', date)
      .order('time', { ascending: true });
    if (availableOnly) {
      q = q.eq('is_available', true);
    }
    let fallback = await q;
    if (fallback.error && isMissingColumnError(fallback.error)) {
      logQueryFallback('listSlotsForBusiness', 'fallback order by start_time', fallback.error);
      let q2 = supabase
        .from('slots')
        .select('id, business_id, date, time, is_available')
        .eq('business_id', businessId)
        .eq('date', date)
        .order('start_time', { ascending: true });
      if (availableOnly) {
        q2 = q2.eq('is_available', true);
      }
      fallback = await q2;
    }
    if (fallback.error) {
      logSupabaseFailure('listSlotsForBusiness', fallback.error, { businessId, date });
      throw fallback.error;
    }
    rows = (fallback.data || []) as SlotRow[];
  } else if (result.error) {
    logSupabaseFailure('listSlotsForBusiness', result.error, { businessId, date });
    throw result.error;
  }

  const slots = rows.map((row) => {
    const time = formatSlotTime(String(row.time ?? row.start_time ?? ''));
    const available =
      row.status != null
        ? row.status === 'available' || row.status === 'reserved'
        : row.is_available !== false;
    return {
      id: row.id,
      business_id: row.business_id,
      date: String(row.date),
      time,
      start_time: time,
      end_time: time,
      is_available: available,
    };
  });

  return { slots };
}

const BOOKABLE_STATUSES = new Set(['available', 'reserved']);

/**
 * Maps UI selection (including gen-slot fallbacks) to a real slots.id for booking RPCs.
 */
export async function resolveSlotIdForBooking(params: {
  businessId: string;
  date: string;
  time: string;
  hintSlotId?: string | null;
}): Promise<string> {
  const { businessId, date, time, hintSlotId } = params;

  if (hintSlotId && !String(hintSlotId).startsWith('gen-slot-')) {
    return String(hintSlotId);
  }

  const target = normalizeTimeHHmm(time);
  if (!target) {
    throw new BookingSupabaseError('Booking time is required');
  }

  const { data, error } = await supabase
    .from('slots')
    .select('id, time, start_time, status, is_available')
    .eq('business_id', businessId)
    .eq('date', date);

  if (error) {
    logger.error(LogTag.API, 'resolveSlotIdForBooking query failed', error);
    throw error;
  }

  const rows = data || [];
  const sameTime = rows.filter((row) => {
    const rowTime = normalizeTimeHHmm(String(row.time ?? row.start_time ?? ''));
    return rowTime === target;
  });

  const isBookable = (row: { status?: string | null; is_available?: boolean | null }) => {
    if (row.status != null && typeof row.status === 'string') {
      if (row.status === 'booked' || row.status === 'cancelled') return false;
      return BOOKABLE_STATUSES.has(row.status) || row.status === 'available';
    }
    return row.is_available !== false;
  };

  let matches = sameTime.filter(isBookable);
  if (matches.length === 0 && sameTime.length > 0) {
    logQueryFallback('resolveSlotIdForBooking', 'using time match without status filter');
    matches = sameTime;
  }

  if (matches.length >= 1) {
    return String(matches[0].id);
  }

  logger.warn(LogTag.API, 'resolveSlotIdForBooking: no slot row for time', {
    businessId,
    date,
    time: target,
    rowCount: data?.length ?? 0,
  });

  throw new BookingSupabaseError(
    'This time is not available to book online. Please pick another slot or ask the salon to open availability for this date.',
  );
}
