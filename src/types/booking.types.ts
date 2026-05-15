import { Salon, Service } from './salon.types';
import { Slot } from './slot.types';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  reference: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  salon_id: string;
  service_id: string;
  slot_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: BookingStatus;
  price: number;
  created_at: string;
  salon?: Salon;
  service?: Service;
  slot?: Slot;
}

export interface CreateBookingPayload {
  salon_id: string;
  service_id: string;
  slot_id: string;
  date: string;
  time: string;
  price: number;
}
