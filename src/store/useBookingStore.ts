import { create } from 'zustand';

interface Salon {
  id: string;
  name: string;
  address: string;
  imageUrl?: string;
  rating?: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

interface BookingState {
  selectedSalon: Salon | null;
  selectedService: Service | null;
  selectedDate: string | null; // YYYY-MM-DD format
  selectedSlotId: string | null;
  
  setSalon: (salon: Salon) => void;
  setService: (service: Service) => void;
  setDate: (date: string) => void;
  setSlotId: (slotId: string) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedSalon: null,
  selectedService: null,
  selectedDate: null,
  selectedSlotId: null,

  setSalon: (salon) => set({ selectedSalon: salon, selectedService: null, selectedDate: null, selectedSlotId: null }),
  setService: (service) => set({ selectedService: service, selectedDate: null, selectedSlotId: null }),
  setDate: (date) => set({ selectedDate: date, selectedSlotId: null }),
  setSlotId: (slotId) => set({ selectedSlotId: slotId }),
  resetBooking: () => set({ selectedSalon: null, selectedService: null, selectedDate: null, selectedSlotId: null }),
}));
