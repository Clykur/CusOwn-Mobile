import dayjs from 'dayjs';

import { BookingSupabaseError } from './booking-errors';
import { businessHoursService } from './business-hours';
import { logSupabaseFailure } from './errors';
import { supabase } from '@/lib/supabase';
import { logger, LogTag } from '@/utils/logger';
import { getShopLocalDate, getShopLocalNow } from '@/utils/shopTime';

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
  start_time: string;
  end_time: string;
  status: string;
};

/**
 * Production uses slots.status ('available'|'reserved'|...); older schema used is_available.
 */
export async function listSlotsForBusiness(
  businessId: string,
  date: string,
  options?: { availableOnly?: boolean },
): Promise<{ slots: SlotListItem[] }> {
  // When availableOnly is true we ONLY return 'available' slots (legacy behaviour).
  // When false (default for the booking screen) we return available + booked/reserved
  // slots so the UI can render booked ones as disabled — but we still hide:
  //   • slots whose start_time is in the past (for today only)
  //   • slots that start after the shop's closing time
  const availableOnly = options?.availableOnly === true;

  // Use the shop-timezone-aware date comparison so midnight rollover is correct.
  const todayStr = getShopLocalDate();
  const isToday = date === todayStr;
  const now = getShopLocalNow();

  const businessHours = await businessHoursService.getEffectiveHours(businessId, date);
  const closingTime = businessHours?.closing_time;

  let result = await supabase.rpc('get_or_generate_slots', {
    p_business_id: businessId,
    p_date: date,
  });

  if (result.error) {
    logger.warn(
      LogTag.API,
      'get_or_generate_slots RPC failed, falling back to table query',
      result.error,
    );
    result = await supabase
      .from('slots')
      .select('id, business_id, date, start_time, end_time, status')
      .eq('business_id', businessId)
      .eq('date', date)
      .order('start_time', { ascending: true });
  }

  if (result.error) {
    logSupabaseFailure('listSlotsForBusiness', result.error, { businessId, date });
    throw result.error;
  }

  let rows: SlotRow[] = (result.data || []) as SlotRow[];

  rows = rows.filter((row) => {
    const slotTime = dayjs(`${date}T${row.start_time}`);

    // Always hide slots that start after closing time
    const isAfterClosing = closingTime ? slotTime.isAfter(dayjs(`${date}T${closingTime}`)) : false;

    // Hide past slots for today (regardless of status)
    const isPastSlot = isToday ? slotTime.isBefore(now) : false;

    if (isPastSlot || isAfterClosing) return false;

    // When availableOnly is true, additionally drop non-available slots
    if (availableOnly && row.status !== 'available') return false;

    return true;
  });

  const slots = rows.map((row) => {
    const time = formatSlotTime(row.start_time);
    const available = row.status === 'available';
    return {
      id: row.id,
      business_id: row.business_id,
      date: row.date,
      time,
      start_time: row.start_time,
      end_time: row.end_time,
      is_available: available,
    };
  });

  return { slots };
}
const BOOKABLE_STATUSES = new Set(['available']);

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
    .select('id, start_time, end_time, status')
    .eq('business_id', businessId)
    .eq('date', date);

  if (error) {
    logger.error(LogTag.API, 'resolveSlotIdForBooking query failed', error);
    throw error;
  }

  const rows = data || [];
  const sameTime = rows.filter((row) => {
    const rowTime = normalizeTimeHHmm(String(row.start_time ?? ''));
    return rowTime === target;
  });

  const isBookable = (row: { status: string }) => {
    return BOOKABLE_STATUSES.has(row.status);
  };

  const matches = sameTime.filter(isBookable);
  if (matches.length === 0 && sameTime.length > 0) {
    const existingStatus = sameTime[0].status;
    if (existingStatus === 'booked') {
      throw new BookingSupabaseError('This slot is already booked. Please choose another time.');
    }
    if (existingStatus === 'blocked') {
      throw new BookingSupabaseError('This slot has been blocked by the salon.');
    }
    throw new BookingSupabaseError('This slot is no longer available. Please choose another time.');
  }

  if (matches.length >= 1) {
    return String(matches[0].id);
  }

  // If no slot row exists, auto-create it (Request 2)
  try {
    const { data: bizData } = await supabase
      .from('businesses')
      .select('slot_duration')
      .eq('id', businessId)
      .is('deleted_at', null)
      .single();

    const start_time = `${target}:00`;
    const duration = bizData?.slot_duration ? Number(bizData.slot_duration) : 30;
    const end_time = `${addMinutesToHHmm(target, duration)}:00`;

    const { data: slotId, error: insertError } = await supabase.rpc('create_custom_slot', {
      p_business_id: businessId,
      p_date: date,
      p_start_time: start_time,
      p_end_time: end_time,
    });

    if (insertError) {
      // If unique constraint error, retry the select
      logger.warn(LogTag.API, 'Slot insert failed, trying to select again', insertError);
      const { data: retryData } = await supabase
        .from('slots')
        .select('id')
        .eq('business_id', businessId)
        .eq('date', date)
        .eq('start_time', start_time)
        .maybeSingle();
      if (retryData?.id) {
        return String(retryData.id);
      }
      throw insertError;
    }
    if (slotId) {
      return String(slotId);
    }
  } catch (err) {
    // Retry select one last time
    const start_time = `${target}:00`;
    const { data: retryData } = await supabase
      .from('slots')
      .select('id')
      .eq('business_id', businessId)
      .eq('date', date)
      .eq('start_time', start_time)
      .maybeSingle();
    if (retryData?.id) {
      return String(retryData.id);
    }
    logger.error(LogTag.API, 'resolveSlotIdForBooking fallback creation failed', err);
  }

  throw new BookingSupabaseError(
    'This time is not available to book online. Please pick another slot or ask the salon to open availability for this date.',
  );
}

function addMinutesToHHmm(timeStr: string, minutesToAdd: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const totalMinutes = h * 60 + m + minutesToAdd;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}
