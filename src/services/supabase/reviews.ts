import { supabase } from '@/lib/supabase';
import { getActorUserId, invokeBookingRpc } from './booking-rpc';
import { logger, LogTag } from '@/utils/logger';
import { isMissingColumnError, logQueryFallback } from './select-fallback';

const REVIEW_RPC = {
  create: 'create_review_atomically',
  ignorePrompt: 'create_rating_prompt_ignore',
  pendingList: 'get_pending_rating_bookings',
} as const;

export type BusinessReviewsPayload = {
  rating_avg: number;
  review_count: number;
  reviews: Record<string, unknown>[];
};

export async function getReviewsForBusiness(businessId: string): Promise<BusinessReviewsPayload> {
  const reviewsQuery = () =>
    supabase
      .from('reviews')
      .select('id, booking_id, business_id, user_id, rating, comment, created_at, is_hidden')
      .eq('business_id', businessId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(50);

  const [businessResult, reviewsResult] = await Promise.all([
    supabase
      .from('businesses')
      .select('rating_avg, review_count')
      .eq('id', businessId)
      .is('deleted_at', null)
      .single(),
    reviewsQuery(),
  ]);

  const business = businessResult.data;
  let reviews: Record<string, unknown>[] | null =
    (reviewsResult.data as Record<string, unknown>[] | null) ?? null;
  let error = reviewsResult.error;
  if (error && isMissingColumnError(error)) {
    logQueryFallback('getReviewsForBusiness', 'retry without is_hidden', error);
    const fallback = await supabase
      .from('reviews')
      .select('id, booking_id, business_id, user_id, rating, comment, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50);
    reviews = (fallback.data as Record<string, unknown>[] | null) ?? null;
    error = fallback.error;
  }

  if (businessResult.error) {
    logger.warn(
      LogTag.API,
      'getReviewsForBusiness business aggregate failed',
      businessResult.error,
    );
  }

  if (error) {
    logger.error(LogTag.API, 'getReviewsForBusiness failed', error);
    throw error;
  }

  // Fetch corresponding user profiles
  const profilesMap: Record<string, { full_name: string | null }> = {};
  if (reviews && reviews.length > 0) {
    const userIds = Array.from(
      new Set(
        reviews.map((r) => r.user_id).filter((uid): uid is string => typeof uid === 'string'),
      ),
    );

    if (userIds.length > 0) {
      try {
        const { data: profilesData } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', userIds);

        if (profilesData) {
          profilesData.forEach((p) => {
            profilesMap[p.id] = {
              full_name: p.full_name,
            };
          });
        }
      } catch (profileFetchErr) {
        logger.warn(LogTag.API, 'Failed to fetch user profiles for reviews', profileFetchErr);
      }
    }
  }

  return {
    rating_avg: Number(business?.rating_avg ?? 0),
    review_count: Number(business?.review_count ?? reviews?.length ?? 0),
    reviews: (reviews || []).map((row) => {
      const r = row as Record<string, unknown>;
      const profile = r.user_id ? profilesMap[String(r.user_id)] : null;
      return {
        ...r,
        id: r.id != null ? String(r.id) : undefined,
        customer: profile
          ? {
              full_name: profile.full_name,
            }
          : null,
        customer_name: profile?.full_name ?? r.customer_name ?? r.author_name ?? 'Customer',
      };
    }),
  };
}

function normalizePendingRatingPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { bookings?: unknown[] }).bookings)
  ) {
    return (data as { bookings: unknown[] }).bookings;
  }
  return [];
}

export async function getPendingRatingBookings(): Promise<unknown[]> {
  const userId = await getActorUserId();
  try {
    const data = await invokeBookingRpc<unknown[] | { bookings?: unknown[] }>(
      REVIEW_RPC.pendingList,
      {
        p_customer_user_id: userId,
      },
    );
    return normalizePendingRatingPayload(data);
  } catch (firstErr) {
    logger.warn(LogTag.API, 'get_pending_rating_bookings retry p_customer_id', firstErr);
    try {
      const data = await invokeBookingRpc<unknown[] | { bookings?: unknown[] }>(
        REVIEW_RPC.pendingList,
        {
          p_customer_id: userId,
        },
      );
      return normalizePendingRatingPayload(data);
    } catch {
      logger.error(LogTag.API, 'getPendingRatingBookings failed', firstErr);
      return [];
    }
  }
}

export async function submitReview(
  bookingId: string,
  rating: number,
  comment?: string,
): Promise<unknown> {
  const userId = await getActorUserId();
  return invokeBookingRpc(REVIEW_RPC.create, {
    p_booking_id: bookingId,
    p_user_id: userId,
    p_rating: rating,
    p_comment: comment ?? null,
  });
}

export async function ignoreReviewPrompt(bookingId: string): Promise<unknown> {
  const userId = await getActorUserId();
  return invokeBookingRpc(REVIEW_RPC.ignorePrompt, {
    p_booking_id: bookingId,
    p_customer_user_id: userId,
  });
}
