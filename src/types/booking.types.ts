import { Business, Service } from './business.types';
import { Slot } from './slot.types';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'rejected' | 'cancelled' | 'no_show' | 'expired';

export interface Booking {
  id: string;
  reference: string;
  booking_id: string; // From backend
  customer_user_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  business_id: string;
  service_id: string;
  slot_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: BookingStatus;
  price: number;
  total_price?: number;
  totalPrice?: number;
  services?: Service[];
  total_price_cents?: number;
  total_duration_minutes?: number;
  no_show?: boolean;
  no_show_marked_at?: string | null;
  undo_used_at?: string | null;
  created_at: string;
  updated_at: string;
  business?: Business;
  service?: Service;
  slot?: Slot;
  customer_profile?: {
    id: string;
    full_name: string | null;
    profile_media?: {
      id: string;
      bucket_name: string;
      storage_path: string;
    } | null;
  } | null;
}

export type BookingWithDetails = Booking & {
  salon?: any; // Backend sometimes uses salon
  services?: { id: string; name: string }[];
  review?: {
    rating: number;
    comment: string | null;
  };
};

export interface CreateBookingPayload {
  business_id: string;
  service_id: string;
  slot_id: string;
  date: string;
  time: string;
  price: number;
}
