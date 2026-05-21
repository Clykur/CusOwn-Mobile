import { Booking, BookingStatus } from '@/types/booking.types';
import { Business, Service, BusinessCategory, BusinessStats } from '@/types/business.types';
import { UserProfile } from '@/types/user.types';
import { logger, LogTag } from '@/utils/logger';
import { supabase } from '@/lib/supabase';
import { SUPABASE_ONLY_MODE } from '@/services/supabase/migration';
import { listBusinessCategories } from '@/services/supabase/categories';
import {
  createBusiness as createBusinessSupabase,
  deleteBusiness as deleteBusinessSupabase,
  getBusinessById as getBusinessByIdSupabase,
  listBusinesses as listBusinessesSupabase,
  listOwnerBusinesses,
  searchBusinesses as searchBusinessesSupabase,
  updateBusiness as updateBusinessSupabase,
} from '@/services/supabase/businesses';
import {
  deleteUserAccount,
  getProfilePayload,
  updateProfile as updateProfileSupabase,
} from '@/services/supabase/profiles';
import {
  listBusinessMedia,
  resolveMediaPublicUrl,
  softDeleteMedia,
  uploadBusinessGalleryImage,
  uploadProfileAvatar,
  type MediaListItem,
} from '@/services/supabase/storage';
import {
  getPendingRatingBookings,
  getReviewsForBusiness,
  ignoreReviewPrompt,
  submitReview,
} from '@/services/supabase/reviews';
import {
  addBusinessClosure,
  addBusinessHoliday,
  deleteBusinessClosure,
  deleteBusinessHoliday,
  getBusinessQrCode,
  listBusinessClosures,
  listBusinessHolidays,
} from '@/services/supabase/hub';
import {
  confirmBooking as confirmBookingSupabase,
  cancelBooking as cancelBookingSupabase,
  createBooking as createBookingSupabase,
  getBookingById as getBookingByIdSupabase,
  listBookings as listBookingsSupabase,
  markBookingNoShow,
  rejectBooking as rejectBookingSupabase,
  rescheduleBooking as rescheduleBookingSupabase,
  undoConfirm,
  undoReject,
} from '@/services/supabase/bookings';
import {
  createService as createServiceSupabase,
  deleteService as deleteServiceSupabase,
  listOwnerServices,
  listPublicServices,
  updateService as updateServiceSupabase,
} from '@/services/supabase/services';
import {
  getOwnerAnalytics as getOwnerAnalyticsSupabase,
  getOwnerDashboard as getOwnerDashboardSupabase,
  getOwnerStats as getOwnerStatsSupabase,
  type OwnerAnalyticsPayload,
} from '@/services/supabase/owner';
import { listSlotsForBusiness } from '@/services/supabase/slots';
import { checkSupabaseHealth } from '@/services/supabase/health';
import { getBookingPrice } from '@/services/supabase/mappers';
import { businessHoursService } from '@/services/supabase/business-hours';

export { getBookingPrice } from '@/services/supabase/mappers';

function assertSupabaseOnly(label: string): void {
  if (!SUPABASE_ONLY_MODE) {
    logger.error(
      LogTag.API,
      `[${label}] REST removed — enable SUPABASE_ONLY_MODE or restore Phase 4 fallback`,
    );
    throw new Error(`Supabase-only mode required for ${label}`);
  }
}

/**
 * App-facing data facade. All methods call Supabase directly (Phase 5).
 */
export const apiService = {
  getProfile: async () => {
    assertSupabaseOnly('getProfile');
    return getProfilePayload();
  },

  updateProfile: async (payload: {
    full_name?: string;
    phone_number?: string;
  }): Promise<UserProfile> => {
    assertSupabaseOnly('updateProfile');
    return updateProfileSupabase(payload);
  },

  getSignedUrl: async (mediaId: string) => {
    assertSupabaseOnly('getSignedUrl');
    return resolveMediaPublicUrl(mediaId);
  },

  uploadProfileImage: async (file: { uri: string; name?: string; type?: string }) => {
    assertSupabaseOnly('uploadProfileImage');
    const result = await uploadProfileAvatar(file);
    return { media: { id: result.mediaId }, url: result.url };
  },

  uploadBusinessMedia: async (
    businessId: string,
    file: { uri: string; name?: string; type?: string },
  ): Promise<MediaListItem> => {
    assertSupabaseOnly('uploadBusinessMedia');
    return uploadBusinessGalleryImage(businessId, file);
  },

  deleteMedia: async (mediaId: string): Promise<void> => {
    assertSupabaseOnly('deleteMedia');
    return softDeleteMedia(mediaId);
  },

  getBusinessQr: async (businessId: string, regenerate?: boolean) => {
    assertSupabaseOnly('getBusinessQr');
    return getBusinessQrCode(businessId, regenerate);
  },

  getBusinessHolidays: async (businessId: string) => {
    assertSupabaseOnly('getBusinessHolidays');
    return listBusinessHolidays(businessId);
  },

  getBusinessClosures: async (businessId: string) => {
    assertSupabaseOnly('getBusinessClosures');
    return listBusinessClosures(businessId);
  },

  addBusinessHoliday: async (
    businessId: string,
    payload: { holiday_date: string; holiday_name?: string },
  ) => {
    assertSupabaseOnly('addBusinessHoliday');
    return addBusinessHoliday(businessId, payload);
  },

  deleteBusinessHoliday: async (businessId: string, holidayId: string) => {
    assertSupabaseOnly('deleteBusinessHoliday');
    return deleteBusinessHoliday(businessId, holidayId);
  },

  addBusinessClosure: async (
    businessId: string,
    payload: { start_date: string; end_date: string; reason?: string },
  ) => {
    assertSupabaseOnly('addBusinessClosure');
    return addBusinessClosure(businessId, payload);
  },

  deleteBusinessClosure: async (businessId: string, closureId: string) => {
    assertSupabaseOnly('deleteBusinessClosure');
    return deleteBusinessClosure(businessId, closureId);
  },

  deleteAccount: async (reason?: string): Promise<void> => {
    assertSupabaseOnly('deleteAccount');
    return deleteUserAccount(reason);
  },

  confirmBooking: async (id: string) => {
    assertSupabaseOnly('confirmBooking');
    return confirmBookingSupabase(id);
  },

  rejectBooking: async (id: string) => {
    assertSupabaseOnly('rejectBooking');
    return rejectBookingSupabase(id);
  },

  undoConfirm: async (id: string) => {
    assertSupabaseOnly('undoConfirm');
    return undoConfirm(id);
  },

  undoReject: async (id: string) => {
    assertSupabaseOnly('undoReject');
    return undoReject(id);
  },

  markNoShow: async (id: string) => {
    assertSupabaseOnly('markNoShow');
    return markBookingNoShow(id);
  },

  getCategories: async (): Promise<BusinessCategory[]> => {
    assertSupabaseOnly('getCategories');
    return listBusinessCategories();
  },

  getBusinesses: async (categoryId?: string): Promise<Business[]> => {
    assertSupabaseOnly('getBusinesses');
    return listBusinessesSupabase(categoryId);
  },

  getBusinessById: async (id: string): Promise<Business> => {
    assertSupabaseOnly('getBusinessById');
    return getBusinessByIdSupabase(id);
  },

  searchBusinesses: async (params: {
    query?: string;
    categoryId?: string;
    city?: string;
  }): Promise<Business[]> => {
    assertSupabaseOnly('searchBusinesses');
    return searchBusinessesSupabase(params);
  },

  createBusiness: async (payload: Record<string, unknown>): Promise<Business> => {
    assertSupabaseOnly('createBusiness');
    return createBusinessSupabase(payload);
  },

  deleteBusiness: async (id: string): Promise<void> => {
    assertSupabaseOnly('deleteBusiness');
    return deleteBusinessSupabase(id);
  },

  updateBusiness: async (id: string, payload: Record<string, unknown>): Promise<Business> => {
    assertSupabaseOnly('updateBusiness');
    return updateBusinessSupabase(id, payload);
  },

  getOwnerBusinesses: async (): Promise<Business[]> => {
    assertSupabaseOnly('getOwnerBusinesses');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) throw new Error('Not authenticated');
    return listOwnerBusinesses(user.id);
  },

  getOwnerServices: async (businessId?: string): Promise<Service[]> => {
    assertSupabaseOnly('getOwnerServices');
    return listOwnerServices(businessId);
  },

  createService: async (payload: Record<string, unknown>): Promise<Service> => {
    assertSupabaseOnly('createService');
    return createServiceSupabase(payload as Parameters<typeof createServiceSupabase>[0]);
  },

  updateService: async (serviceId: string, payload: Record<string, unknown>): Promise<Service> => {
    assertSupabaseOnly('updateService');
    return updateServiceSupabase(serviceId, payload);
  },

  deleteService: async (serviceId: string): Promise<void> => {
    assertSupabaseOnly('deleteService');
    return deleteServiceSupabase(serviceId);
  },

  getBookings: async (role: 'Customer' | 'Owner'): Promise<Booking[]> => {
    assertSupabaseOnly('getBookings');
    return listBookingsSupabase(role);
  },

  getBookingById: async (id: string): Promise<Booking> => {
    assertSupabaseOnly('getBookingById');
    return getBookingByIdSupabase(id);
  },

  createBooking: async (payload: Record<string, unknown>): Promise<Booking> => {
    assertSupabaseOnly('createBooking');
    const booking = await createBookingSupabase(
      payload as Parameters<typeof createBookingSupabase>[0],
    );
    return {
      ...booking,
      id: booking.id,
      booking_id: booking.booking_id || booking.id,
      reference: booking.reference,
    } as Booking;
  },

  updateBookingStatus: async (
    id: string,
    status: BookingStatus,
    reason?: string,
  ): Promise<Booking> => {
    logger.info(LogTag.API, `updateBookingStatus ${id} → ${status}`);
    switch (status) {
      case 'confirmed':
        return apiService.confirmBooking(id);
      case 'rejected':
        return apiService.rejectBooking(id);
      case 'cancelled':
        return apiService.cancelBooking(id, reason);
      case 'no_show':
        return apiService.markNoShow(id);
      default:
        throw new Error(`Unsupported explicit status update: ${status}`);
    }
  },

  cancelBooking: async (id: string, reason?: string): Promise<Booking> => {
    assertSupabaseOnly('cancelBooking');
    return cancelBookingSupabase(id, reason, 'customer');
  },

  rescheduleBooking: async (
    id: string,
    payload: {
      business_id?: string;
      slot_id?: string | null;
      new_slot_id?: string;
      service_id?: string[];
      date?: string;
      time?: string;
      customer_name?: string;
      customer_phone?: string;
      reason?: string;
      rescheduled_by?: 'customer' | 'owner';
    },
  ): Promise<Booking> => {
    assertSupabaseOnly('rescheduleBooking');
    return rescheduleBookingSupabase(id, {
      ...payload,
      rescheduled_by: payload.rescheduled_by ?? 'customer',
    });
  },

  getOwnerStats: async (businessId?: string): Promise<BusinessStats> => {
    assertSupabaseOnly('getOwnerStats');
    return getOwnerStatsSupabase(businessId);
  },

  getOwnerDashboard: async (params?: {
    businessId?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    assertSupabaseOnly('getOwnerDashboard');
    return getOwnerDashboardSupabase(params);
  },

  getOwnerAnalytics: async (params: {
    businessId: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    aggregated?: boolean;
  }): Promise<OwnerAnalyticsPayload | null> => {
    assertSupabaseOnly('getOwnerAnalytics');
    return getOwnerAnalyticsSupabase(params);
  },

  getSlots: async (businessId: string, date: string, _serviceIds?: string) => {
    assertSupabaseOnly('getSlots');
    // availableOnly: false → return both 'available' and 'booked' slots so the
    // UI can show booked slots as disabled. Past slots and after-closing slots
    // are still filtered out inside listSlotsForBusiness.
    const result = await listSlotsForBusiness(businessId, date, { availableOnly: false });
    return result.slots;
  },

  getPublicServices: async (businessId: string) => {
    assertSupabaseOnly('getPublicServices');
    return listPublicServices(businessId);
  },

  getReviews: async (businessId: string) => {
    assertSupabaseOnly('getReviews');
    return getReviewsForBusiness(businessId);
  },

  getPendingRatings: async () => {
    assertSupabaseOnly('getPendingRatings');
    return getPendingRatingBookings();
  },

  submitRating: async (bookingId: string, rating: number, comment?: string) => {
    assertSupabaseOnly('submitRating');
    return submitReview(bookingId, rating, comment);
  },

  ignoreRating: async (bookingId: string) => {
    assertSupabaseOnly('ignoreRating');
    return ignoreReviewPrompt(bookingId);
  },

  getBusinessMedia: async (businessId: string) => {
    assertSupabaseOnly('getBusinessMedia');
    return listBusinessMedia(businessId);
  },

  checkHealth: async () => {
    assertSupabaseOnly('checkHealth');
    return checkSupabaseHealth();
  },

  getEffectiveHours: async (businessId: string, date: string) => {
    assertSupabaseOnly('getEffectiveHours');
    return businessHoursService.getEffectiveHours(businessId, date);
  },

  validateSlot: async (
    businessId: string,
    slotDate: string,
    startTime: string,
    endTime: string,
  ) => {
    assertSupabaseOnly('validateSlot');
    return businessHoursService.validateSlot(businessId, slotDate, startTime, endTime);
  },
};
