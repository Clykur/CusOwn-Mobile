/**
 * @deprecated Prefer `@/services/supabase` (folder). Kept for backward-compatible imports.
 */
import { supabase } from '@/lib/supabase';
import * as supabaseModules from '@/services/supabase';
import { logger, LogTag } from '@/utils/logger';

import type { CreateServiceFormValues } from '@/schemas/booking.schema';
import type { Booking, CreateBookingPayload, BookingStatus } from '@/types/booking.types';
import type { Service, BusinessStats } from '@/types/business.types';
import type { UserProfile } from '@/types/user.types';

export {
  SUPABASE_ONLY_MODE,
  enrichBusinessesWithImages,
  getBookingPrice,
  mapBooking,
  mapBusinessRow,
  listBusinessCategories,
  listBusinesses,
  getBusinessById,
  listOwnerBusinesses,
  getProfilePayload,
  resolveMediaPublicUrl,
} from '@/services/supabase';

/** Legacy object — migrate callers to `@/services/supabase/*` modules. */
export const supabaseService = {
  getProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      logger.error(LogTag.API, 'Error fetching profile', error);
      return null;
    }
    return data;
  },
  getCategories: supabaseModules.listBusinessCategories,
  getBusinesses: (categoryId?: string) => supabaseModules.listBusinesses(categoryId),
  getBusinessById: supabaseModules.getBusinessById,
  getOwnerServices: async (_ownerId: string): Promise<Service[]> => {
    logger.warn(LogTag.API, 'supabaseService.getOwnerServices: use Phase 3 services module');
    return [];
  },
  createService: async (_payload: CreateServiceFormValues & { business_id: string }) => {
    throw new Error('Not implemented — use api.service until Phase 3');
  },
  getBookings: async (_userId: string, _role: 'Customer' | 'Owner'): Promise<Booking[]> => {
    logger.warn(LogTag.API, 'supabaseService.getBookings: use Phase 2 bookings module');
    return [];
  },
  getBookingById: async (_id: string): Promise<Booking> => {
    throw new Error('Not implemented — use api.service until Phase 2');
  },
  createBooking: async (
    _payload: CreateBookingPayload & { customer_user_id: string; reference: string },
  ) => {
    throw new Error('Not implemented — use api.service until Phase 2');
  },
  updateBookingStatus: async (_id: string, _status: BookingStatus): Promise<Booking> => {
    throw new Error('Not implemented — use api.service until Phase 2');
  },
  getOwnerStats: async (_ownerId: string): Promise<BusinessStats> => ({
    total_bookings: 0,
    pending_bookings: 0,
    confirmed_bookings: 0,
    cancelled_bookings: 0,
    total_businesses: 0,
    revenue: 0,
  }),
  getSlots: async (_businessId: string, _date: string): Promise<unknown[]> => [],
};
