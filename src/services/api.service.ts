import apiClient from '@/lib/api-client';
import { Booking, CreateBookingPayload, BookingStatus } from '@/types/booking.types';
import { Business, Service, BusinessCategory, BusinessStats } from '@/types/business.types';
import { UserProfile } from '@/types/user.types';
import { logger, LogTag } from '@/utils/logger';
import { supabase } from '@/lib/supabase';

// Owner API Services

/**
 * Resolves booking price robustly by summing all services or falling back to top-level price fields
 */
export function getBookingPrice(
  b: any
): number {
  if (!b) return 0;

  const totalFromCents =
    b.total_price_cents !== undefined && b.total_price_cents !== null
      ? Number(b.total_price_cents) / 100
      : undefined;

  // Robustly extract services from either services or booking_services relation
  let rawServices = b.services;
  
  if (Array.isArray(rawServices)) {
    rawServices = rawServices.map((bs: any) => {
      if (bs.service) {
        return {
          ...bs.service,
          price_cents: bs.price_cents !== undefined && bs.price_cents !== null
            ? bs.price_cents
            : bs.service.price_cents,
        };
      }
      return bs;
    });
  } else if (!rawServices && Array.isArray(b.booking_services)) {
    rawServices = b.booking_services.map((bs: any) => {
      if (bs.service) {
        return {
          ...bs.service,
          price_cents: bs.price_cents !== undefined && bs.price_cents !== null
            ? bs.price_cents
            : bs.service.price_cents,
        };
      }
      return null;
    }).filter(Boolean);
  }

  const services = rawServices || [];
  const servicesSum =
    Array.isArray(services) && services.length > 0
      ? services.reduce(
        (sum: number, s: any) => {
          const price =
            s?.price_cents !== undefined && s?.price_cents !== null
              ? Number(s.price_cents) / 100
              : Number(s?.price || 0);
          return sum + price;
        },
        0
      )
      : 0;

  const servicePrice = b.service
    ? (b.service.price_cents !== undefined && b.service.price_cents !== null
        ? Number(b.service.price_cents) / 100
        : Number(b.service.price || 0))
    : 0;

  const priceCents = b.price_cents !== undefined && b.price_cents !== null
    ? Number(b.price_cents) / 100
    : 0;

  const totalFromTotalField = Number(b.total_price || 0);
  const totalFromTotalPriceField = Number(b.totalPrice || 0);
  const priceFromPriceField = Number(b.price || 0);

  const candidates = [
    totalFromCents, 
    servicesSum, 
    servicePrice, 
    priceCents, 
    totalFromTotalField, 
    totalFromTotalPriceField, 
    priceFromPriceField
  ].filter(
    (v) => typeof v === 'number' && !isNaN(v)
  ) as number[];

  // Prioritize totalFromCents, then servicesSum, then other fields.
  // Ensure we don't return 0 if a valid non-zero price exists.
  let resolvedPrice = 0;
  if (totalFromCents !== undefined && totalFromCents > 0) {
    resolvedPrice = totalFromCents;
  } else if (servicesSum > 0) {
    resolvedPrice = servicesSum;
  } else {
    // Fallback to other candidates, picking the first non-zero one
    for (const candidate of candidates) {
      if (candidate > 0) {
        resolvedPrice = candidate;
        break;
      }
    }
  }
  return resolvedPrice;
}

/**
 * Maps backend booking structure to mobile type
 */
function mapBooking(b: any): Booking {
  // Try to extract services from either b.services or b.booking_services relation
  let rawServices = b.services;
  
  if (Array.isArray(rawServices)) {
    rawServices = rawServices.map((bs: any) => {
      if (bs.service) {
        return {
          ...bs.service,
          price_cents: bs.price_cents !== undefined && bs.price_cents !== null
            ? bs.price_cents
            : bs.service.price_cents,
        };
      }
      return bs;
    });
  } else if (!rawServices && Array.isArray(b.booking_services)) {
    rawServices = b.booking_services.map((bs: any) => {
      if (bs.service) {
        return {
          ...bs.service,
          price_cents: bs.price_cents !== undefined && bs.price_cents !== null
            ? bs.price_cents
            : bs.service.price_cents,
        };
      }
      return null;
    }).filter(Boolean);
  }

  // Map individual services price_cents to price robustly
  const mappedServices = Array.isArray(rawServices)
    ? rawServices.map((s: any) => {
      const sPrice =
        s.price_cents !== undefined &&
          s.price_cents !== null
          ? Number(s.price_cents) / 100
          : (
            s.price !== undefined &&
            s.price !== null
          )
            ? Number(s.price)
            : 0;
      return {
        ...s,
        price: sPrice,
      };
    })
    : undefined;

  if (__DEV__) {
    logger.info(LogTag.API, '[mapBooking price debug]', {
      bookingId: b?.id || b?.booking_id,
      total_price_cents: b?.total_price_cents,
      total_price: b?.total_price,
      totalPrice: b?.totalPrice,
      price: b?.price,
      servicesCount: Array.isArray(rawServices) ? rawServices.length : null,
      servicesPrices: Array.isArray(rawServices)
        ? rawServices.map((s: any) => ({ price: s?.price, price_cents: s?.price_cents }))
        : null,
    });
  }

  const price = getBookingPrice(b);

  // Backend enriched bookings have 'services' array. Defensive parsing for service_name.
  let serviceName = 'Standard Service';
  if (typeof b.service_name === 'string') {
    serviceName = b.service_name;
  } else if (Array.isArray(b.service_name) && b.service_name.length > 0) {
    serviceName = b.service_name[0]?.name || b.service_name[0]?.service_name || 'Standard Service';
  } else if (typeof b.service_name === 'object' && b.service_name !== null && b.service_name.name) {
    serviceName = b.service_name.name;
  } else if (mappedServices && mappedServices.length > 0) {
    serviceName = mappedServices[0]?.name || 'Standard Service';
  } else if (b.service && typeof b.service === 'object' && b.service.name) {
    serviceName = b.service.name;
  } else if (b.service && typeof b.service === 'object' && b.service.service_name) {
    serviceName = b.service.service_name;
  }

  return {
    ...b,
    date: b.date || b.slot?.date || '',
    time: b.time || b.slot?.start_time || '',
    price: price,
    total_price: price,
    totalPrice: price,
    services:
      mappedServices && mappedServices.length > 0
        ? mappedServices
        : (
          b.service
            ? [{
              ...b.service,
              price:
                b.service.price_cents !== undefined && b.service.price_cents !== null
                  ? Number(
                    b.service.price_cents
                  ) / 100
                  : Number(
                    b.service.price || 0
                  ),
            }]
            : []
        ),
    service: {
      id: b.service_id || (mappedServices && mappedServices[0]?.id) || '',
      name: serviceName,
      price: price,
      duration: b.total_duration_minutes || 30,
      business_id: b.business_id || '',
    },
    reference: b.reference || b.booking_id || '',
    business: b.business || b.salon || undefined,
    salon: b.salon || b.business || undefined,
  };
}

/**
 * Client-side helper to query the media table in Supabase, find the first business
 * media item, resolve signed URLs from the backend, and populate business.image_url.
 */
async function enrichBusinessesWithImages(businesses: Business[]): Promise<Business[]> {
  if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
    return businesses || [];
  }

  try {
    const businessIds = businesses.map(b => b.id).filter(Boolean);
    const ownerUserIds = businesses.map(b => b.owner_user_id).filter(Boolean);
    if (businessIds.length === 0) return businesses;

    // Fetch active business cover photos and owner profile photos in parallel from Supabase
    const [bizMediaResult, profileMediaResult] = await Promise.all([
      supabase
        .from('media')
        .select('id, entity_id, storage_path, bucket_name')
        .eq('entity_type', 'business')
        .in('entity_id', businessIds)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true }),
      ownerUserIds.length > 0
        ? supabase
          .from('media')
          .select('id, entity_id, storage_path, bucket_name')
          .eq('entity_type', 'profile')
          .in('entity_id', ownerUserIds)
          .is('deleted_at', null)
        : Promise.resolve({ data: null, error: null })
    ]);

    // Map businessId -> first business media item
    const bizMediaMap: Record<string, any> = {};
    if (bizMediaResult?.data) {
      for (const item of bizMediaResult.data) {
        if (!bizMediaMap[item.entity_id]) {
          bizMediaMap[item.entity_id] = item;
        }
      }
    }

    // Map ownerUserId -> owner profile media item
    const profileMediaMap: Record<string, any> = {};
    if (profileMediaResult?.data) {
      for (const item of profileMediaResult.data) {
        if (!profileMediaMap[item.entity_id]) {
          profileMediaMap[item.entity_id] = item;
        }
      }
    }

    for (const biz of businesses) {
      // Business cover photo gets priority, owner profile image is fallback (matching web app)
      const firstMedia = bizMediaMap[biz.id] || (biz.owner_user_id ? profileMediaMap[biz.owner_user_id] : null);
      if (firstMedia) {
        try {
          const publicUrl = supabase.storage
            .from(firstMedia.bucket_name || 'business-media')
            .getPublicUrl(firstMedia.storage_path).data.publicUrl;
          if (publicUrl) {
            biz.image_url = publicUrl;
            biz.cover_photo_url = publicUrl;
          }
        } catch (e) {
          if (__DEV__) {
            logger.info(LogTag.API, `[ENRICH] Failed to get public URL for media ${firstMedia.id}:`, e);
          }
        }
      }

      // Also explicitly enrich the owner's profile picture separately for UI avatar displays
      const ownerMedia = biz.owner_user_id ? profileMediaMap[biz.owner_user_id] : null;
      if (ownerMedia) {
        try {
          const ownerPublicUrl = supabase.storage
            .from(ownerMedia.bucket_name || 'profile-media')
            .getPublicUrl(ownerMedia.storage_path).data.publicUrl;
          if (ownerPublicUrl) {
            biz.owner_image = ownerPublicUrl;
          }
        } catch (e) {
          if (__DEV__) {
            logger.info(LogTag.API, `[ENRICH] Failed to get public URL for owner media:`, e);
          }
        }
      }
    }
  } catch (err) {
    if (__DEV__) {
      logger.info(LogTag.API, '[ENRICH] Failed to enrich businesses with images:', err);
    }
  }

  return businesses;
}

/**
 * Service to communicate with the Next.js backend API.
 * Replaces direct Supabase queries to ensure business logic is preserved.
 */
export const apiService = {
  // --- Profiles ---
  // --- Profiles ---
  getProfile: async (): Promise<any> => {
    return await apiClient.get('/user/profile');
  },

  updateProfile: async (
    payload: {
      full_name?: string;
      phone_number?: string;
    }
  ): Promise<UserProfile> => {
    return await apiClient.patch('/user/profile', payload);
  },

  getSignedUrl: async (mediaId: string): Promise<any> => {
    try {
      const res = await apiClient.get<any>('/media/signed-url', {
        params: { mediaId },
      });
      if (res?.url) return res;
    } catch (e) {
      if (__DEV__) {
        logger.info(LogTag.API, '[getSignedUrl] Backend failed, falling back to direct Supabase query:', e);
      }
    }

    try {
      const { data, error } = await supabase
        .from('media')
        .select('storage_path, bucket_name')
        .eq('id', mediaId)
        .single();

      if (data) {
        const publicUrl = supabase.storage
          .from(data.bucket_name || 'business-media')
          .getPublicUrl(data.storage_path).data.publicUrl;
        return { url: publicUrl };
      }
    } catch (err) {
      logger.error(LogTag.API, '[getSignedUrl] Supabase fallback query failed:', err);
    }
    return { url: null };
  },

  deleteAccount: async (reason?: string): Promise<void> => {
    return await apiClient.delete('/user/profile', { data: { reason } });
  },

  // --- Owner Actions ---
  acceptBooking: async (id: string) => {
    return await apiClient.post(`/bookings/${id}/accept`);
  },

  rejectBooking: async (id: string) => {
    return await apiClient.post(`/bookings/${id}/reject`);
  },

  undoAccept: async (id: string) => {
    return await apiClient.post(`/bookings/${id}/undo-accept`);
  },

  undoReject: async (id: string) => {
    return await apiClient.post(`/bookings/${id}/undo-reject`);
  },

  markNoShow: async (id: string) => {
    return await apiClient.post(`/bookings/${id}/no-show`);
  },

  // --- Categories ---
  getCategories: async (): Promise<BusinessCategory[]> => {
    return await apiClient.get('/business-categories');
  },

  // --- Businesses ---
  getBusinesses: async (categoryId?: string): Promise<Business[]> => {
    // Backend expects 'location' param for /salons/list, category filter might be different
    // Aligning with web app's /api/salons/list
    const params = categoryId ? { category: categoryId } : {};
    const businesses = await apiClient.get<Business[]>('/salons/list', { params });
    const enriched = await enrichBusinessesWithImages(businesses);
    return enriched;
  },

  getBusinessById: async (id: string): Promise<Business> => {
    const business = await apiClient.get<Business>(`/salons/${id}`);
    const enriched = await enrichBusinessesWithImages([business]);
    return enriched[0];
  },

  searchBusinesses: async (params: any): Promise<any> => {
    return await apiClient.post('/businesses/search', params);
  },

  createBusiness: async (payload: any): Promise<Business> => {
    return await apiClient.post('/salons', payload);
  },

  deleteBusiness: async (id: string): Promise<void> => {
    return await apiClient.delete(`/owner/businesses/${id}`);
  },

  updateBusiness: async (id: string, payload: any): Promise<Business> => {
    return await apiClient.patch(`/owner/businesses/${id}`, payload);
  },

  getOwnerBusinesses: async (): Promise<Business[]> => {
    const businesses = await apiClient.get<Business[]>('/owner/businesses');
    return await enrichBusinessesWithImages(businesses);
  },

  // --- Services ---
  getOwnerServices: async (businessId?: string): Promise<Service[]> => {
    const res = await apiClient.get<any[]>('/owner/services', {
      params: businessId ? { businessId } : undefined
    });
    const dataList = Array.isArray(res) ? res : [];
    return dataList.map((s: any) => ({
      ...s,
      duration: s.duration_minutes !== undefined && s.duration_minutes !== null
        ? s.duration_minutes
        : s.duration !== undefined && s.duration !== null
          ? s.duration
          : 30,
      price: (s.price_cents !== undefined && s.price_cents !== null)
        ? s.price_cents / 100
        : (s.price !== undefined && s.price !== null)
          ? Number(s.price)
          : 0,
    })) as Service[];
  },

  createService: async (payload: any): Promise<Service> => {
    const res = await apiClient.post('/owner/services', payload);
    return {
      ...res,
      duration: res.duration_minutes || res.duration || 30,
      price: (res.price_cents !== undefined && res.price_cents !== null)
        ? res.price_cents / 100
        : Number(res.price || 0),
    } as Service;
  },

  updateService: async (serviceId: string, payload: any): Promise<Service> => {
    const res = await apiClient.put('/owner/services', { serviceId, ...payload });
    return {
      ...res,
      duration: res.duration_minutes || res.duration || 30,
      price: (res.price_cents !== undefined && res.price_cents !== null)
        ? res.price_cents / 100
        : Number(res.price || 0),
    } as Service;
  },

  deleteService: async (serviceId: string): Promise<void> => {
    return await apiClient.delete('/owner/services', {
      params: { serviceId }
    });
  },

  // --- Bookings ---
  getBookings: async (role: 'Customer' | 'Owner'): Promise<Booking[]> => {
    if (role === 'Customer') {
      const bookings = await apiClient.get<any[]>('/customer/bookings');
      const mapped = bookings.map(mapBooking);
      const businesses = mapped.map(b => b.business).filter(Boolean) as Business[];
      if (businesses.length > 0) {
        await enrichBusinessesWithImages(businesses);
      }
      return mapped;
    } else {
      // Owners get their bookings from the dashboard endpoint
      const response = await apiClient.get<any>('/owner/dashboard');

      if (__DEV__) {
        logger.info(LogTag.API, '[getBookings] Dashboard Response:', {
          hasRecent: !!response?.recentBookings,
          recentCount: response?.recentBookings?.length,
          hasByBusiness: !!response?.bookingsByBusiness,
        });
      }

      if (!response) return [];

      const recent = response.recentBookings || [];
      const byBusiness = response.bookingsByBusiness ? Object.values(response.bookingsByBusiness).flat() : [];

      // Combine and deduplicate
      const all = [...recent, ...byBusiness];
      const unique = Array.from(new Map(all.map(b => [b.id, b])).values());

      const mapped = unique.map(mapBooking);
      const businesses = mapped.map(b => b.business).filter(Boolean) as Business[];
      if (businesses.length > 0) {
        await enrichBusinessesWithImages(businesses);
      }
      return mapped;
    }
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const data = await apiClient.get(`/bookings/${id}`);
    const mapped = mapBooking(data);
    if (mapped.business) {
      await enrichBusinessesWithImages([mapped.business]);
    }
    return mapped;
  },

  createBooking: async (payload: any): Promise<any> => {
    // Add idempotency key for the backend
    const idempotencyKey = `mob-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Map mobile fields to backend fields (salons in backend often use salon_id)
    const backendPayload = {
      salon_id: payload.business_id || payload.salon_id,
      slot_id: payload.slot_id,
      customer_name: payload.customer_name || 'Guest',
      customer_phone: payload.customer_phone || '',
      service_ids: Array.isArray(payload.service_id) ? payload.service_id : [payload.service_id],
      date: payload.date,
    };

    return await apiClient.post('/bookings', backendPayload, {
      headers: {
        'x-idempotency-key': idempotencyKey,
      }
    });
  },

  updateBookingStatus: async (id: string, status: BookingStatus, reason?: string): Promise<Booking> => {
    logger.info(LogTag.API, `Attempting to update booking ${id} to status: ${status}`);
    switch (status) {
      case 'confirmed':
        return await apiService.acceptBooking(id);
      case 'rejected':
        return await apiService.rejectBooking(id);
      case 'cancelled':
        return await apiService.cancelBooking(id, reason);
      case 'no_show':
        return await apiService.markNoShow(id);
      default:
        logger.warn(LogTag.API, `No specific API endpoint for status ${status}. Attempting generic PATCH.`);
        return await apiClient.patch(`/bookings/${id}`, { status });
    }
  },
  cancelBooking: async (
    id: string,
    reason?: string
  ): Promise<any> => {
    return await apiClient.post(
      `/bookings/${id}/cancel`,
      {
        cancelled_by: 'customer',
        reason: reason || '',
      }
    );
  },

  rescheduleBooking: async (
    id: string,
    payload: {
      business_id: string;
      slot_id: string | null;
      service_id: string[];
      date: string;
      customer_name: string;
      customer_phone: string;
    }
  ): Promise<any> => {
    const backendPayload = {
      salon_id: payload.business_id,
      slot_id: payload.slot_id,
      service_ids: payload.service_id,
      date: payload.date,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      rescheduled_by: 'customer',
    };
    return await apiClient.post(
      `/bookings/${id}/reschedule`,
      backendPayload
    );
  },
  // --- Owner Stats ---
  getOwnerStats: async (businessId?: string): Promise<BusinessStats> => {
    const response = await apiClient.get<any>('/owner/dashboard', {
      params: businessId && businessId !== 'all'
        ? { business_id: businessId }
        : undefined
    });
    const stats = response?.stats || {};

    return {
      total_bookings:
        stats.totalBookings ||
        stats.total_bookings ||
        0,

      pending_bookings:
        stats.pendingBookings ||
        stats.pending_bookings ||
        0,

      confirmed_bookings:
        stats.confirmedBookings ||
        stats.confirmed_bookings ||
        0,

      cancelled_bookings:
        stats.cancelledBookings ||
        stats.cancelled_bookings ||
        0,

      total_businesses:
        stats.totalBusinesses ||
        stats.total_businesses ||
        0,

      revenue: stats.revenue || 0,
    };
  },
  getOwnerDashboard: async (params?: {
    businessId?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const response = await apiClient.get<any>('/owner/dashboard', {
      params: {
        ...(params?.businessId &&
          params.businessId !== 'all'
          ? { business_id: params.businessId }
          : {}),
        ...(params?.fromDate
          ? { fromDate: params.fromDate }
          : {}),
        ...(params?.toDate
          ? { toDate: params.toDate }
          : {}),
      },
    });

    if (!response) return null;

    // Map stats from camelCase to snake_case for UI compatibility
    const rawStats = response.stats || {};
    const stats = {
      total_businesses: rawStats.totalBusinesses ?? rawStats.total_businesses ?? 0,
      total_bookings: rawStats.totalBookings ?? rawStats.total_bookings ?? 0,
      confirmed_bookings: rawStats.confirmedBookings ?? rawStats.confirmed_bookings ?? 0,
      pending_bookings: rawStats.pendingBookings ?? rawStats.pending_bookings ?? 0,
      rejected_bookings: rawStats.rejectedBookings ?? rawStats.rejected_bookings ?? 0,
      cancelled_bookings: rawStats.cancelledBookings ?? rawStats.cancelled_bookings ?? 0,
      no_show_count: rawStats.noShowCount ?? rawStats.no_show_count ?? 0,
      revenue: rawStats.revenue ?? 0,
    };

    // Map all booking arrays safely
    const recentBookings = (response.recentBookings || []).map(mapBooking);
    const todaysBookings = (response.todaysBookings || []).map(mapBooking);
    const pendingBookingsList = (response.pendingBookingsList || []).map(mapBooking);

    // Map bookingsByBusiness Record safely
    const bookingsByBusiness: Record<string, Booking[]> = {};
    if (response.bookingsByBusiness) {
      Object.keys(response.bookingsByBusiness).forEach((bizId) => {
        bookingsByBusiness[bizId] = (response.bookingsByBusiness[bizId] || []).map(mapBooking);
      });
    }

    return {
      ...response,
      stats,
      recentBookings,
      todaysBookings,
      pendingBookingsList,
      bookingsByBusiness,
    };
  },
  getOwnerAnalytics: async (params: {
    businessId: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    aggregated?: boolean
  }): Promise<any> => {
    return await apiClient.get('/owner/analytics', {
      params: {
        business_id: params.businessId === 'all' ? 'all' : params.businessId,
        type: params.type || 'overview',
        start_date: params.startDate,
        end_date: params.endDate,
        aggregated: params.aggregated ? 'true' : 'false',
      }
    });
  },

  // --- Slots ---
  getSlots: async (businessId: string, date: string, serviceIds?: string): Promise<any> => {
    return await apiClient.get('/slots', {
      params: {
        salon_id: businessId,
        date,
        service_ids: serviceIds
      }
    });
  },

  // --- Public Services ---
  getPublicServices: async (businessId: string): Promise<any[]> => {
    const res = await apiClient.get('/public/services', {
      params: { businessId }
    });
    const dataList = Array.isArray(res) ? res : [];
    return dataList.map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      duration: s.duration_minutes || s.duration || 30,
      price: s.price_cents ? (s.price_cents / 100).toFixed(0) : s.price || '0',
    }));
  },

  // --- Reviews ---
  getReviews: async (businessId: string): Promise<any> => {
    return await apiClient.get('/reviews', {
      params: { business_id: businessId }
    });
  },

  getPendingRatings: async (): Promise<any[]> => {
    const res = await apiClient.get<any>('/reviews/pending-rating');
    return res?.bookings || res || [];
  },

  submitRating: async (bookingId: string, rating: number, comment?: string): Promise<any> => {
    return await apiClient.post('/reviews/pending-rating', {
      booking_id: bookingId,
      rating,
      comment: comment || null,
    });
  },

  ignoreRating: async (bookingId: string): Promise<any> => {
    return await apiClient.post('/reviews/ignore', {
      booking_id: bookingId,
    });
  },

  // --- Media ---
  getBusinessMedia: async (businessId: string): Promise<any> => {
    return await apiClient.get(`/media/business/${businessId}`);
  },

  // --- Health Check ---
  checkHealth: async () => {
    try {
      const data = await apiClient.get('/health');
      return {
        status: 'success',
        message: 'Backend is reachable',
        details: data
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Backend unreachable: ${error.message}`,
        details: error.data || error
      };
    }
  }
};