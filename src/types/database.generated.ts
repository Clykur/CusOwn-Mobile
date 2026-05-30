/**
 * CusOwn Mobile — Database Type Definitions
 *
 * This file was generated from the schema inferred from the active service layer.
 * It mirrors the Supabase public schema used by src/services/supabase/*.
 *
 * To regenerate with the actual Supabase CLI:
 *   npx supabase gen types typescript --project-id <project-id> > src/types/database.generated.ts
 *
 * Tables: bookings, business_categories, business_closures, business_holidays,
 *         business_special_hours, businesses, media, reviews, services, slots, user_profiles
 * RPCs:   create_custom_slot, expire_pending_bookings_atomically, get_active_deals,
 *         get_nearby_available_salons, get_or_generate_slots, get_trending_services
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone_number: string | null;
          user_type: 'customer' | 'owner' | 'both' | 'admin';
          profile_media_id: string | null;
          admin_note: string | null;
          legal_hold: boolean | null;
          data_classification: 'public' | 'internal' | 'confidential' | 'regulated' | null;
          deleted_at: string | null;
          permanent_deletion_at: string | null;
          deletion_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone_number?: string | null;
          user_type?: 'customer' | 'owner' | 'both' | 'admin';
          profile_media_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          phone_number?: string | null;
          user_type?: 'customer' | 'owner' | 'both' | 'admin';
          profile_media_id?: string | null;
          updated_at?: string;
        };
      };
      businesses: {
        Row: {
          id: string;
          owner_user_id: string;
          salon_name: string;
          owner_name: string;
          whatsapp_number: string;
          phone_number: string | null;
          address: string;
          location: string | null;
          city: string | null;
          area: string | null;
          pincode: string | null;
          latitude: number | null;
          longitude: number | null;
          opening_time: string;
          closing_time: string;
          slot_duration: number;
          concurrent_booking_capacity: number | null;
          booking_link: string;
          category: string | null;
          category_id: string | null;
          rating_avg: number;
          review_count: number;
          is_featured: boolean | null;
          suspended: boolean | null;
          deleted_at: string | null;
          permanent_deletion_at: string | null;
          deletion_reason: string | null;
          legal_hold: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          owner_user_id: string;
          salon_name: string;
          owner_name: string;
          whatsapp_number: string;
          phone_number?: string | null;
          address: string;
          opening_time: string;
          closing_time: string;
          slot_duration: number;
          booking_link?: string;
        };
        Update: {
          salon_name?: string;
          owner_name?: string;
          whatsapp_number?: string;
          phone_number?: string | null;
          address?: string;
          city?: string | null;
          area?: string | null;
          opening_time?: string;
          closing_time?: string;
          slot_duration?: number;
          concurrent_booking_capacity?: number | null;
          suspended?: boolean | null;
          deleted_at?: string | null;
        };
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          duration: number;
          price: number;
          is_active: boolean | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          name: string;
          description?: string | null;
          duration: number;
          price: number;
        };
        Update: {
          name?: string;
          description?: string | null;
          duration?: number;
          price?: number;
          is_active?: boolean | null;
        };
      };
      bookings: {
        Row: {
          id: string;
          booking_id: string;
          reference: string;
          customer_user_id: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          business_id: string;
          service_id: string;
          slot_id: string;
          date: string;
          time: string;
          status:
            | 'pending'
            | 'confirmed'
            | 'completed'
            | 'rejected'
            | 'cancelled'
            | 'no_show'
            | 'expired';
          price: number;
          total_price: number | null;
          total_price_cents: number | null;
          total_duration_minutes: number | null;
          no_show: boolean | null;
          no_show_marked_at: string | null;
          undo_used_at: string | null;
          rescheduled_by: 'customer' | 'owner' | null;
          cancelled_by: 'customer' | 'owner' | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          customer_user_id: string;
          customer_name: string;
          customer_phone: string;
          business_id: string;
          service_id: string;
          slot_id: string;
          date: string;
          time: string;
          status?:
            | 'pending'
            | 'confirmed'
            | 'completed'
            | 'rejected'
            | 'cancelled'
            | 'no_show'
            | 'expired';
          price: number;
        };
        Update: {
          status?:
            | 'pending'
            | 'confirmed'
            | 'completed'
            | 'rejected'
            | 'cancelled'
            | 'no_show'
            | 'expired';
          no_show?: boolean | null;
          no_show_marked_at?: string | null;
          undo_used_at?: string | null;
          rescheduled_by?: 'customer' | 'owner' | null;
          cancelled_by?: 'customer' | 'owner' | null;
          cancellation_reason?: string | null;
        };
      };
      slots: {
        Row: {
          id: string;
          business_id: string;
          date: string;
          time: string;
          start_time: string;
          end_time: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          business_id: string;
          date: string;
          time: string;
          start_time: string;
          end_time: string;
          is_available?: boolean;
        };
        Update: {
          is_available?: boolean;
        };
      };
      media: {
        Row: {
          id: string;
          entity_type: 'business' | 'profile';
          entity_id: string;
          bucket_name: string;
          storage_path: string;
          content_type: string | null;
          size_bytes: number | null;
          sort_order: number | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          entity_type: 'business' | 'profile';
          entity_id: string;
          bucket_name: string;
          storage_path: string;
          content_type?: string | null;
          size_bytes?: number | null;
          sort_order?: number | null;
        };
        Update: {
          sort_order?: number | null;
          deleted_at?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          business_id: string;
          customer_user_id: string;
          rating: number;
          comment: string | null;
          ignored: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          booking_id: string;
          business_id: string;
          customer_user_id: string;
          rating: number;
          comment?: string | null;
        };
        Update: {
          rating?: number;
          comment?: string | null;
        };
      };
      business_categories: {
        Row: {
          id: string;
          value: string;
          label: string;
          icon: string | null;
          sort_order: number | null;
          created_at: string;
        };
        Insert: {
          value: string;
          label: string;
          icon?: string | null;
        };
        Update: {
          label?: string;
          icon?: string | null;
        };
      };
      business_holidays: {
        Row: {
          id: string;
          business_id: string;
          holiday_date: string;
          holiday_name: string | null;
          created_at: string;
        };
        Insert: {
          business_id: string;
          holiday_date: string;
          holiday_name?: string | null;
        };
        Update: {
          holiday_name?: string | null;
        };
      };
      business_closures: {
        Row: {
          id: string;
          business_id: string;
          start_date: string;
          end_date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          business_id: string;
          start_date: string;
          end_date: string;
          reason?: string | null;
        };
        Update: {
          reason?: string | null;
        };
      };
      business_special_hours: {
        Row: {
          id: string;
          business_id: string;
          date: string;
          opening_time: string;
          closing_time: string;
          is_closed: boolean | null;
          created_at: string;
        };
        Insert: {
          business_id: string;
          date: string;
          opening_time: string;
          closing_time: string;
          is_closed?: boolean | null;
        };
        Update: {
          opening_time?: string;
          closing_time?: string;
          is_closed?: boolean | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_nearby_available_salons: {
        Args: {
          user_lat: number;
          user_lng: number;
          radius_km?: number;
        };
        Returns: Array<{
          id: string;
          salon_name: string;
          address: string;
          city: string | null;
          rating_avg: number;
          review_count: number;
          distance_km: number;
          latitude: number | null;
          longitude: number | null;
          image_url: string | null;
          category: string | null;
        }>;
      };
      get_trending_services: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          name: string;
          business_id: string;
          business_name: string;
          price: number;
          duration: number;
          booking_count: number;
          image_url: string | null;
        }>;
      };
      get_active_deals: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          salon_name: string;
          discount_percentage: number;
          original_price: number;
          discounted_price: number;
          valid_until: string;
          image_url: string | null;
        }>;
      };
      get_or_generate_slots: {
        Args: {
          p_business_id: string;
          p_date: string;
        };
        Returns: Array<{
          id: string;
          business_id: string;
          date: string;
          time: string;
          start_time: string;
          end_time: string;
          is_available: boolean;
        }>;
      };
      create_custom_slot: {
        Args: {
          p_business_id: string;
          p_date: string;
          p_start_time: string;
          p_end_time: string;
        };
        Returns: {
          id: string;
          business_id: string;
          date: string;
          start_time: string;
          end_time: string;
          is_available: boolean;
        };
      };
      expire_pending_bookings_atomically: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      booking_status:
        | 'pending'
        | 'confirmed'
        | 'completed'
        | 'rejected'
        | 'cancelled'
        | 'no_show'
        | 'expired';
      user_type_enum: 'customer' | 'owner' | 'both' | 'admin';
    };
  };
};

// ─── Convenience row type aliases ────────────────────────────────────────────
export type DbUserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type DbBusiness = Database['public']['Tables']['businesses']['Row'];
export type DbService = Database['public']['Tables']['services']['Row'];
export type DbBooking = Database['public']['Tables']['bookings']['Row'];
export type DbSlot = Database['public']['Tables']['slots']['Row'];
export type DbMedia = Database['public']['Tables']['media']['Row'];
export type DbReview = Database['public']['Tables']['reviews']['Row'];
export type DbBusinessCategory = Database['public']['Tables']['business_categories']['Row'];

// ─── RPC return type aliases ─────────────────────────────────────────────────
export type RpcNearbySalon =
  Database['public']['Functions']['get_nearby_available_salons']['Returns'][number];
export type RpcTrendingService =
  Database['public']['Functions']['get_trending_services']['Returns'][number];
export type RpcActiveDeal = Database['public']['Functions']['get_active_deals']['Returns'][number];
export type RpcSlot = Database['public']['Functions']['get_or_generate_slots']['Returns'][number];
