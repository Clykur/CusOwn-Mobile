import { apiClient } from '../api/client';
import { useAuthStore } from '@/store/auth.store';

export const BookingService = {
  // IMPORTANT: Slots must be fetched from backend canonical URL
  getAvailableSlots: async (salonId: string, serviceId: string, date: string) => {
    const response = await apiClient.get('/slots', {
      params: { 
        salon_id: salonId, 
        service_ids: serviceId, 
        date 
      },
    });
    return response.data;
  },

  createBooking: async (data: { 
    salonId: string; 
    serviceId: string; 
    slotId: string; 
    date: string;
    customerName?: string;
    customerPhone?: string;
  }) => {
    // Generate an Idempotency Key client-side per booking submission attempt
    const idempotencyKey = 'ik-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    
    // Attempt fallback data derivation from user session
    const user = useAuthStore.getState().user;
    const customerName = data.customerName || user?.user_metadata?.full_name || 'Premium Guest';
    const customerPhone = data.customerPhone || user?.user_metadata?.phone || '+1234567890';

    const payload = {
      salon_id: data.salonId,
      slot_id: data.slotId,
      service_ids: [data.serviceId], // Backend expects an array of service ID strings
      customer_name: customerName,
      customer_phone: customerPhone,
      date: data.date,
    };

    const response = await apiClient.post('/bookings', payload, {
      headers: {
        'x-idempotency-key': idempotencyKey,
      },
    });
    return response.data; // Should return booking ID and payment intent
  },

  getMyBookings: async () => {
    const response = await apiClient.get('/customer/bookings');
    return response.data;
  },
  
  getBookingDetails: async (bookingId: string) => {
    const response = await apiClient.get(`/bookings/${bookingId}`);
    return response.data;
  }
};
