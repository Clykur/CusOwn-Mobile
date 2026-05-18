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
  if (!params.businessId || params.businessId === 'all') {
    logger.warn(LogTag.API, 'get_owner_analytics_advanced requires a specific business id');
    return null;
  }

  try {
    const data = await invokeBookingRpc<OwnerAnalyticsPayload>(OWNER_ANALYTICS_RPC, {
      p_business_id: params.businessId,
      p_start_date: params.startDate,
      p_end_date: params.endDate,
      p_service_rank_limit: 10,
    });
    return data ?? null;
  } catch (err) {
    logger.error(LogTag.API, 'get_owner_analytics_advanced failed', err);
    throw err;
  }
}
