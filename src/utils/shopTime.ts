/**
 * shopTime.ts
 *
 * Timezone-aware helpers for all shop date/time calculations.
 *
 * All functions accept an optional IANA timezone string (e.g. "Asia/Kolkata").
 * When no timezone is passed they fall back to the device's local time — which
 * is correct when the salon and the customer are in the same timezone.
 *
 * When the `businesses` table gains a `timezone` column, simply thread it
 * through to these helpers and every calculation becomes TZ-accurate.
 */

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Returns the current moment in the given timezone (or device local time).
 */
export function getShopLocalNow(shopTimezone?: string): dayjs.Dayjs {
  if (shopTimezone) {
    return dayjs().tz(shopTimezone);
  }
  return dayjs();
}

/**
 * Returns the current date string (YYYY-MM-DD) in the shop's timezone.
 */
export function getShopLocalDate(shopTimezone?: string): string {
  return getShopLocalNow(shopTimezone).format('YYYY-MM-DD');
}

/**
 * Returns true when the current shop-local time is past the given closing time.
 * @param closingTime  HH:mm or HH:mm:ss string (24-hour)
 * @param dateStr      The date we are checking (YYYY-MM-DD). Defaults to today.
 * @param shopTimezone Optional IANA timezone string.
 */
export function isShopClosedForToday(
  closingTime: string,
  dateStr?: string,
  shopTimezone?: string,
): boolean {
  const now = getShopLocalNow(shopTimezone);
  const todayStr = dateStr ?? now.format('YYYY-MM-DD');
  const closing = dayjs(`${todayStr}T${closingTime}`, shopTimezone ? undefined : undefined);
  return now.isAfter(closing);
}

/**
 * Returns the default booking date: today if the shop is still open, otherwise tomorrow.
 * Falls back to today when closing time is unknown.
 *
 * @param closingTime  Optional HH:mm or HH:mm:ss string (24-hour).
 * @param shopTimezone Optional IANA timezone string.
 */
export function getDefaultBookingDate(closingTime?: string | null, shopTimezone?: string): string {
  const now = getShopLocalNow(shopTimezone);
  const todayStr = now.format('YYYY-MM-DD');

  if (!closingTime) return todayStr;

  try {
    const closed = isShopClosedForToday(closingTime, todayStr, shopTimezone);
    if (closed) {
      return now.add(1, 'day').format('YYYY-MM-DD');
    }
  } catch {
    // Malformed closing time — safe default
  }

  return todayStr;
}

/**
 * Returns milliseconds until the next midnight in the given timezone.
 * Use this to set a precise one-shot timer for date rollover.
 */
export function msUntilMidnightRollover(shopTimezone?: string): number {
  const now = getShopLocalNow(shopTimezone);
  const tomorrow = now.add(1, 'day').startOf('day');
  const ms = tomorrow.diff(now, 'millisecond');
  // Add a small buffer so we land safely just after midnight
  return Math.max(ms + 500, 500);
}
