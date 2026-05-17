import { supabase } from '@/lib/supabase';
import { Booking, CreateBookingPayload, BookingStatus } from '@/types/booking.types';
import { Business, Service, BusinessCategory, BusinessStats } from '@/types/business.types';
import { UserProfile } from '@/types/user.types';
import { CreateServiceFormValues } from '@/schemas/booking.schema';
import { logger, LogTag } from '@/utils/logger';

export const supabaseService = {
  // --- Profiles ---
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

  // --- Categories ---
  getCategories: async (): Promise<BusinessCategory[]> => {
    const { data, error } = await supabase
      .from('business_categories')
      .select('*')
      .order('name');

    if (error) {
      logger.error(LogTag.API, 'Error fetching categories', error);
      throw error;
    }
    return data || [];
  },

  // --- Businesses ---
  getBusinesses: async (categoryId?: string): Promise<Business[]> => {
    let query = supabase
      .from('businesses')
      .select('*, category:business_categories(*), services(*)');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error(LogTag.API, 'Error fetching businesses', error);
      throw error;
    }
    return data || [];
  },

  getBusinessById: async (id: string): Promise<Business> => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*, category:business_categories(*), services(*)')
      .eq('id', id)
      .single();

    if (error) {
      logger.error(LogTag.API, `Error fetching business ${id}`, error);
      throw error;
    }
    return data;
  },

  // --- Services ---
  getOwnerServices: async (ownerId: string): Promise<Service[]> => {
    const { data, error } = await supabase
      .from('services')
      .select('*, business:businesses!inner(*)')
      .eq('business.owner_user_id', ownerId);

    if (error) {
      logger.error(LogTag.API, 'Error fetching owner services', error);
      throw error;
    }
    return data || [];
  },

  createService: async (payload: CreateServiceFormValues & { business_id: string }): Promise<Service> => {
    const { data, error } = await supabase
      .from('services')
      .insert([payload])
      .select()
      .single();

    if (error) {
      logger.error(LogTag.API, 'Error creating service', error);
      throw error;
    }
    return data;
  },

  // --- Bookings ---
  getBookings: async (userId: string, role: 'Customer' | 'Owner'): Promise<Booking[]> => {
    let query = supabase
      .from('bookings')
      .select('*, business:businesses!inner(*), service:services(*)');

    if (role === 'Customer') {
      query = query.eq('customer_user_id', userId);
    } else {
      query = query.eq('business.owner_user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error(LogTag.API, 'Error fetching bookings', error);
      // If relationship error, try alternative join or return empty
      if (error.code === 'PGRST200') {
        const { data: simpleData } = await supabase
          .from('bookings')
          .select('*, business:businesses!inner(*)')
          .eq(role === 'Customer' ? 'customer_user_id' : 'business.owner_user_id', userId)
          .order('created_at', { ascending: false });
        return simpleData || [];
      }
      throw error;
    }
    return data || [];
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, business:businesses(*), service:services(*)')
      .eq('id', id)
      .single();

    if (error) {
      logger.error(LogTag.API, `Error fetching booking ${id}`, error);
      throw error;
    }
    return data;
  },

  createBooking: async (payload: CreateBookingPayload & { customer_user_id: string; reference: string }): Promise<Booking> => {
    const { data, error } = await supabase
      .from('bookings')
      .insert([payload])
      .select('*, business:businesses(*), service:services(*)')
      .single();

    if (error) {
      logger.error(LogTag.API, 'Error creating booking', error);
      throw error;
    }
    return data;
  },

  updateBookingStatus: async (id: string, status: BookingStatus): Promise<Booking> => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select('*, business:businesses(*), service:services(*)')
      .single();

    if (error) {
      logger.error(LogTag.API, `Error updating booking ${id} status`, error);
      throw error;
    }
    return data;
  },

  // --- Stats ---
  getOwnerStats: async (ownerId: string): Promise<BusinessStats> => {
    try {
      const { data, error } = await supabase
        .from('business_stats')
        .select('*')
        .eq('owner_user_id', ownerId)
        .single();

      if (!error && data) return data;
      
      // Fallback: Calculate from bookings if view fails
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, price, business:businesses!inner(owner_user_id)')
        .eq('business.owner_user_id', ownerId);

      if (!bookings) {
        return {
          total_bookings: 0,
          pending_bookings: 0,
          confirmed_bookings: 0,
          cancelled_bookings: 0,
          total_businesses: 0,
          revenue: 0,
        };
      }

      return {
        total_bookings: bookings.length,
        pending_bookings: bookings.filter(b => b.status === 'pending').length,
        confirmed_bookings: bookings.filter(b => b.status === 'confirmed').length,
        cancelled_bookings: bookings.filter(b => b.status === 'cancelled').length,
        total_businesses: 1,
        revenue: bookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (Number(b.price) || 0), 0)
      };
    } catch (err) {
      logger.error(LogTag.API, 'Error calculating owner stats', err);
      return {
        total_bookings: 0,
        pending_bookings: 0,
        confirmed_bookings: 0,
        cancelled_bookings: 0,
        total_businesses: 0,
        revenue: 0,
      };
    }
  },

  // --- Slots ---
  getSlots: async (businessId: string, date: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .eq('business_id', businessId)
      .eq('date', date)
      .eq('is_available', true);

    if (error) {
      logger.error(LogTag.API, `Error fetching slots for business ${businessId} on ${date}`, error);
      throw error;
    }
    return data || [];
  },
};
