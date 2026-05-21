import { supabase } from '@/lib/supabase';
import { parseTimeToMinutes } from '@/utils/time';
import { getShopLocalDate, getShopLocalNow } from '@/utils/shopTime';

export type EffectiveHours = {
  isClosed: boolean;
  isHoliday?: boolean;
  holidayName?: string | null;
  opening_time?: string;
  closing_time?: string;
  break_start_time?: string | null;
  break_end_time?: string | null;
};

export class BusinessHoursService {
  async getEffectiveHours(businessId: string, dateStr: string): Promise<EffectiveHours | null> {
    // 1. Check holiday override
    const { data: holiday } = await supabase
      .from('business_holidays')
      .select('*')
      .eq('business_id', businessId)
      .eq('holiday_date', dateStr)
      .maybeSingle();

    if (holiday) {
      return {
        isClosed: true,
        isHoliday: true,
        holidayName: holiday.holiday_name || null,
      };
    }

    // 2. Check closures
    const { data: closure } = await supabase
      .from('business_closures')
      .select('*')
      .eq('business_id', businessId)
      .lte('start_date', dateStr)
      .gte('end_date', dateStr)
      .maybeSingle();

    if (closure) {
      return {
        isClosed: true,
        holidayName: closure.reason || 'Closure',
      };
    }

    // 3. Weekly special hours
    const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();

    const { data: weekly } = await supabase
      .from('business_special_hours')
      .select('*')
      .eq('business_id', businessId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    if (weekly) {
      if (weekly.is_closed) {
        return { isClosed: true };
      }
      if (!weekly.opening_time || !weekly.closing_time) {
        return null;
      }
      return {
        isClosed: false,
        opening_time: weekly.opening_time,
        closing_time: weekly.closing_time,
        break_start_time: weekly.break_start_time,
        break_end_time: weekly.break_end_time,
      };
    }

    // 4. Fallback: businesses default hours
    const { data: biz } = await supabase
      .from('businesses')
      .select('opening_time, closing_time')
      .eq('id', businessId)
      .maybeSingle();

    if (!biz?.opening_time || !biz?.closing_time) {
      return null;
    }

    return {
      isClosed: false,
      opening_time: biz.opening_time,
      closing_time: biz.closing_time,
      break_start_time: null,
      break_end_time: null,
    };
  }

  async validateSlot(
    businessId: string,
    slotDate: string,
    startTime: string,
    endTime: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    // Use timezone-aware helpers so this stays consistent with slot screen logic.
    const todayStr = getShopLocalDate();
    const nowDayjs = getShopLocalNow();
    const currentMinutes = nowDayjs.hour() * 60 + nowDayjs.minute();

    if (slotDate < todayStr) {
      return { valid: false, reason: 'Cannot book past date' };
    }

    const hours = await this.getEffectiveHours(businessId, slotDate);
    if (!hours) return { valid: false, reason: 'Business hours not configured' };
    if (hours.isClosed) return { valid: false, reason: 'Business closed on this day' };

    if (!hours.opening_time || !hours.closing_time) {
      return { valid: false, reason: 'Business hours not fully configured' };
    }

    const slotStart = parseTimeToMinutes(startTime);
    const slotEnd = parseTimeToMinutes(endTime);
    const open = parseTimeToMinutes(hours.opening_time);
    const close = parseTimeToMinutes(hours.closing_time);

    if (slotStart === null || slotEnd === null || open === null || close === null) {
      return { valid: false, reason: 'Invalid time format' };
    }

    if (slotStart < open || slotEnd > close) {
      return { valid: false, reason: 'Outside business hours' };
    }

    // Break validation
    if (hours.break_start_time && hours.break_end_time) {
      const breakStart = parseTimeToMinutes(hours.break_start_time);
      const breakEnd = parseTimeToMinutes(hours.break_end_time);

      if (breakStart !== null && breakEnd !== null) {
        const overlapsBreak = slotStart < breakEnd && slotEnd > breakStart;
        if (overlapsBreak) {
          return { valid: false, reason: 'Overlaps break time' };
        }
      }
    }

    // Today time validation — uses TZ-aware current minutes
    if (slotDate === todayStr) {
      if (currentMinutes >= close) {
        return { valid: false, reason: 'Shop closed for today' };
      }

      if (slotStart <= currentMinutes) {
        return { valid: false, reason: 'Slot already passed' };
      }
    }

    return { valid: true };
  }
}

export const businessHoursService = new BusinessHoursService();
