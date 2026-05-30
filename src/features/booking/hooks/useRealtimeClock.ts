/**
 * useRealtimeClock.ts
 *
 * A hook that provides a live clock that ticks every minute AND fires an
 * immediate update at exactly midnight (in the shop's timezone) so that
 * the booking date rolls over automatically without requiring a manual reload.
 *
 * Usage:
 *   const { now, todayStr } = useRealtimeClock(shopTimezone);
 *
 * - `now`      — current dayjs moment (refreshed every minute)
 * - `todayStr` — YYYY-MM-DD string in the shop's timezone (changes at midnight)
 */

import { useState, useEffect, useRef } from 'react';

import type dayjs from 'dayjs';
import { getShopLocalNow, getShopLocalDate, msUntilMidnightRollover } from '@/utils/shopTime';

export interface RealtimeClock {
  now: dayjs.Dayjs;
  todayStr: string;
}

export function useRealtimeClock(shopTimezone?: string): RealtimeClock {
  const [now, setNow] = useState<dayjs.Dayjs>(() => getShopLocalNow(shopTimezone));
  const [todayStr, setTodayStr] = useState<string>(() => getShopLocalDate(shopTimezone));

  // Keep a ref to the current timezone so the effects can read the latest value
  // without needing to re-register.
  const tzRef = useRef(shopTimezone);
  // eslint-disable-next-line react-hooks/refs
  tzRef.current = shopTimezone;

  useEffect(() => {
    const tick = () => {
      const next = getShopLocalNow(tzRef.current);
      setNow(next);
      setTodayStr(next.format('YYYY-MM-DD'));
    };

    // 1. Tick every minute to keep time fresh
    const minuteInterval = setInterval(tick, 60_000);

    // 2. One-shot timer that fires at the next midnight boundary
    //    so the date rolls over exactly at 00:00 in the shop's TZ.
    let midnightTimeout: ReturnType<typeof setTimeout>;

    const scheduleMidnightRollover = () => {
      const ms = msUntilMidnightRollover(tzRef.current);
      midnightTimeout = setTimeout(() => {
        tick();
        // Re-schedule for the following midnight
        scheduleMidnightRollover();
      }, ms);
    };

    scheduleMidnightRollover();

    return () => {
      clearInterval(minuteInterval);
      clearTimeout(midnightTimeout);
    };
    // Re-register only if the timezone prop changes (rare)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopTimezone]);

  return { now, todayStr };
}
