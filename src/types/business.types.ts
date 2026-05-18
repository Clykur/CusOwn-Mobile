export interface BusinessCategory {
  value: string;
  label: string;
  icon?: string;
}

export interface Service {
  length: number;
  map(arg0: (s: any) => any): unknown;
  id: string;
  business_id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
}

export interface Business {
  cover_photo_url: string | undefined;
  created_at: string | number | Date;
  id: string;
  owner_user_id: string;
  salon_name: string;
  owner_name: string;
  whatsapp_number: string;
  opening_time: string;
  closing_time: string;
  slot_duration: number;
  concurrent_booking_capacity?: number;
  booking_link: string;
  address: string;
  location?: string;
  city?: string;
  area?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  image_url?: string;
  rating_avg: number;
  review_count: number;
  is_featured?: boolean;
  services?: Service[];
  owner_image?: string;
}

export interface BusinessStats {
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  total_businesses: number;
  revenue: number;
}
