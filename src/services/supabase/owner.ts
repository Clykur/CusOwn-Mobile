import { Booking } from '@/types/booking.types';
import { Business, BusinessStats } from '@/types/business.types';
import { getActorUserId, invokeBookingRpc } from './booking-rpc';
import { listOwnerBookings } from './bookings';
import { listOwnerBusinesses } from './businesses';
import { logger, LogTag } from '@/utils/logger';

const OWNER_ANALYTICS_RPC = 'get_owner_analytics_advanced';

function bookingDateKey(b: Booking): string {
  return b.date || (b.slot as { date?: string } | undefined)?.date || '';
}

function filterBookingsByRange(bookings: Booking[], fromDate?: string, toDate?: string): Booking[] {
  if (!fromDate && !toDate) return bookings;
  return bookings.filter((b) => {
    const d = bookingDateKey(b);
    if (!d) return true;
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });
}

function computeStats(
  bookings: Booking[],
  businessCount: number,
): BusinessStats & {
  rejected_bookings: number;
  no_show_count: number;
} {
  const pending = bookings.filter((b) => b.status === 'pending').length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const rejected = bookings.filter((b) => b.status === 'rejected').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
  const noShow = bookings.filter((b) => b.status === 'no_show' || b.no_show).length;
  const revenue = bookings
    .filter((b) => b.status === 'completed' || b.status === 'confirmed')
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  return {
    total_bookings: bookings.length,
    pending_bookings: pending,
    confirmed_bookings: confirmed,
    cancelled_bookings: cancelled,
    total_businesses: businessCount,
    revenue,
    rejected_bookings: rejected,
    no_show_count: noShow,
  };
}

export type OwnerDashboardPayload = {
  stats: ReturnType<typeof computeStats>;
  recentBookings: Booking[];
  todaysBookings: Booking[];
  pendingBookingsList: Booking[];
  bookingsByBusiness: Record<string, Booking[]>;
  businesses?: Business[];
};

export async function getOwnerDashboard(params?: {
  businessId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<OwnerDashboardPayload> {
  const ownerId = await getActorUserId();
  const businessId =
    params?.businessId && params.businessId !== 'all' ? params.businessId : undefined;

  const [businesses, allBookings] = await Promise.all([
    listOwnerBusinesses(ownerId),
    listOwnerBookings(ownerId, businessId),
  ]);

  const bookings = filterBookingsByRange(allBookings, params?.fromDate, params?.toDate);
  const today = new Date().toISOString().slice(0, 10);

  const pendingBookingsList = bookings.filter((b) => b.status === 'pending');
  const todaysBookings = bookings.filter((b) => bookingDateKey(b) === today);
  const recentBookings = [...bookings]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 50);

  const bookingsByBusiness: Record<string, Booking[]> = {};
  for (const b of bookings) {
    const bizId = b.business_id || b.business?.id;
    if (!bizId) continue;
    if (!bookingsByBusiness[bizId]) bookingsByBusiness[bizId] = [];
    bookingsByBusiness[bizId].push(b);
  }

  const stats = computeStats(bookings, businesses.length);

  return {
    stats,
    recentBookings,
    todaysBookings,
    pendingBookingsList,
    bookingsByBusiness,
    businesses,
  };
}

export async function getOwnerStats(businessId?: string): Promise<BusinessStats> {
  const dashboard = await getOwnerDashboard({
    businessId: businessId && businessId !== 'all' ? businessId : 'all',
  });
  return dashboard.stats;
}

export type OwnerAnalyticsOverview = {
  confirmedBookings?: number;
  rejectedBookings?: number;
  cancelledBookings?: number;
  totalRevenue?: number;
  totalRevenueCents?: number;
  totalBookings?: number;
  pendingBookings?: number;
  conversionRate?: number;
  noShowRate?: number;
  services?: Array<{ name?: string; serviceName?: string; bookingCount?: number; count?: number }>;
  [key: string]: unknown;
};

export type OwnerAnalyticsPayload = {
  overview?: OwnerAnalyticsOverview;
  daily?: Array<{ date: string; totalBookings?: number; revenue?: number }>;
  peakHours?: Array<{ hour: number; bookingCount?: number }>;
  advanced?: {
    peakHoursHeatmap?: Array<{ hour: number; bookingCount?: number }>;
    servicePopularityRanking?: Array<{
      serviceName?: string;
      name?: string;
      bookingCount?: number;
      count?: number;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export async function getOwnerAnalytics(params: {
  businessId: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  aggregated?: boolean;
}): Promise<OwnerAnalyticsPayload | null> {
  try {
    const ownerId = await getActorUserId();
    const targetBusinessId =
      params.businessId && params.businessId !== 'all' ? params.businessId : undefined;

    const [businesses, allBookings] = await Promise.all([
      listOwnerBusinesses(ownerId),
      listOwnerBookings(ownerId, targetBusinessId),
    ]);

    // Filter bookings by date range if provided
    const bookings = filterBookingsByRange(allBookings, params.startDate, params.endDate);

    // 1. Overview metrics
    const confirmed = bookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'completed',
    ).length;
    const rejected = bookings.filter((b) => b.status === 'rejected').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const noShow = bookings.filter((b) => b.status === 'no_show' || b.no_show).length;

    const totalRevenueCents = bookings
      .filter((b) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (Number(b.total_price_cents) || Number(b.price) * 100 || 0), 0);

    const conversionRate = total > 0 ? (confirmed / total) * 100 : 0;
    const noShowRate = total > 0 ? (noShow / total) * 100 : 0;

    // 2. Services popularity
    const serviceCounts: Record<string, { name: string; count: number }> = {};
    for (const b of bookings) {
      const services = b.services || (b.service ? [b.service] : []);
      for (const s of services) {
        if (!s || !s.name) continue;
        if (!serviceCounts[s.name]) {
          serviceCounts[s.name] = { name: s.name, count: 0 };
        }
        serviceCounts[s.name].count++;
      }
    }
    const sortedServices = Object.values(serviceCounts)
      .sort((a, b) => b.count - a.count)
      .map((s) => ({
        serviceName: s.name,
        bookingCount: s.count,
      }));

    // 3. Peak traffic hours (initialize standard hours: 9 AM to 9 PM)
    const hourCounts: Record<number, number> = {};
    for (let h = 9; h <= 21; h++) {
      hourCounts[h] = 0;
    }
    for (const b of bookings) {
      const slotStart = (b as any).slot_start || b.time || (b.slot as any)?.start_time;
      if (slotStart) {
        const hour = parseInt(String(slotStart).split(':')[0], 10);
        if (!isNaN(hour)) {
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      }
    }
    const peakHours = Object.entries(hourCounts)
      .map(([h, count]) => ({
        hour: parseInt(h, 10),
        bookingCount: count,
      }))
      .sort((a, b) => a.hour - b.hour);

    // 4. Daily Trend
    const dailyGroups: Record<
      string,
      { date: string; totalBookings: number; revenueCents: number }
    > = {};

    let datesToFill: string[] = [];
    if (params.startDate && params.endDate) {
      let curr = new Date(params.startDate);
      const end = new Date(params.endDate);
      let limit = 0;
      while (curr <= end && limit < 40) {
        const dateStr = curr.toISOString().slice(0, 10);
        datesToFill.push(dateStr);
        curr.setDate(curr.getDate() + 1);
        limit++;
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        datesToFill.push(d.toISOString().slice(0, 10));
      }
    }

    datesToFill.forEach((d) => {
      dailyGroups[d] = { date: d, totalBookings: 0, revenueCents: 0 };
    });

    for (const b of bookings) {
      const dateStr = bookingDateKey(b);
      if (!dateStr) continue;
      if (!dailyGroups[dateStr]) {
        dailyGroups[dateStr] = { date: dateStr, totalBookings: 0, revenueCents: 0 };
      }
      dailyGroups[dateStr].totalBookings++;
      if (b.status === 'confirmed' || b.status === 'completed') {
        dailyGroups[dateStr].revenueCents +=
          Number(b.total_price_cents) || Number(b.price) * 100 || 0;
      }
    }

    const dailyTrend = Object.values(dailyGroups)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((dg) => ({
        date: dg.date,
        totalBookings: dg.totalBookings,
        revenue: dg.revenueCents,
      }));

    return {
      overview: {
        confirmedBookings: confirmed,
        rejectedBookings: rejected,
        cancelledBookings: cancelled,
        totalRevenueCents: totalRevenueCents,
        totalRevenue: totalRevenueCents / 100,
        totalBookings: total,
        pendingBookings: pending,
        conversionRate,
        noShowRate,
        services: sortedServices.map((s) => ({ name: s.serviceName, count: s.bookingCount })),
      },
      daily: dailyTrend,
      peakHours: peakHours,
      advanced: {
        peakHoursHeatmap: peakHours,
        servicePopularityRanking: sortedServices,
      },
    };
  } catch (err) {
    logger.error(LogTag.API, 'getOwnerAnalytics client computation failed', err);
    throw err;
  }
}
