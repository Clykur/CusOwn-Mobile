import apiClient from '@/lib/api-client';
import { Booking, CreateBookingPayload, BookingStatus } from '@/types/booking.types';
import { Business, Service, BusinessCategory, BusinessStats } from '@/types/business.types';
import { UserProfile } from '@/types/user.types';
import { logger, LogTag } from '@/utils/logger';

// Owner API Services

/**
 * Maps backend booking structure to mobile type
 */
function mapBooking(b: any): Booking {
  // Compute price robustly, summing all services if total_price_cents/price is empty/0
  let price = 0;
  if (b.total_price_cents) {
    price = b.total_price_cents / 100;
  } else if (b.price) {
    price = b.price;
  } else if (Array.isArray(b.services) && b.services.length > 0) {
    price = b.services.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0);
  } else if (b.service?.price) {
    price = b.service.price;
  }


  // Backend enriched bookings have 'services' array. Defensive parsing for service_name.
  let serviceName = 'Standard Service';
  if (typeof b.service_name === 'string') {
    serviceName = b.service_name;
  } else if (Array.isArray(b.service_name) && b.service_name.length > 0) {
    serviceName = b.service_name[0]?.name || b.service_name[0]?.service_name || 'Standard Service';
  } else if (b.service_name && typeof b.service_name === 'object') {
    serviceName = b.service_name.name || 'Standard Service';
  } else if (b.services && b.services.length > 0) {
    serviceName = b.services[0]?.name || 'Standard Service';
  }

  return {
    ...b,
    date: b.date || b.slot?.date || '',
    time: b.time || b.slot?.start_time || '',
    price: price,
    service: {
      id: b.service_id || (b.services && b.services[0]?.id) || '',
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
    return await apiClient.get('/media/signed-url', {
      params: { mediaId },
    });
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
    return await apiClient.get('/salons/list', { params });
  },

  getBusinessById: async (id: string): Promise<Business> => {
    return await apiClient.get(`/salons/${id}`);
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
    return await apiClient.get('/owner/businesses');
  },

  // --- Services ---
  getOwnerServices: async (businessId?: string): Promise<Service[]> => {
    return await apiClient.get('/owner/services', {
      params: businessId ? { businessId } : undefined
    });
  },

  createService: async (payload: any): Promise<Service> => {
    return await apiClient.post('/owner/services', payload);
  },

  updateService: async (serviceId: string, payload: any): Promise<Service> => {
    return await apiClient.put('/owner/services', { serviceId, ...payload });
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
      return bookings.map(mapBooking);
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

      return unique.map(mapBooking);
    }
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const data = await apiClient.get(`/bookings/${id}`);
    return mapBooking(data);
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

  updateBookingStatus: async (id: string, status: BookingStatus): Promise<Booking> => {
    return await apiClient.patch(`/bookings/${id}`, { status });
  },

  // --- Owner Stats ---
  getOwnerStats: async (businessId?: string): Promise<BusinessStats> => {
    const response = await apiClient.get<any>('/owner/dashboard', {
      params: businessId && businessId !== 'all'
        ? { business_id: businessId }
        : undefined
    });

    console.log('OWNER DASHBOARD RESPONSE:', JSON.stringify(response, null, 2));

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

