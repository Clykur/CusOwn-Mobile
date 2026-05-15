import { create } from 'zustand';
import { Salon, Service } from '@/types/salon.types';
import { Slot } from '@/types/slot.types';

interface BookingState {
  selectedSalon: Salon | null;
  selectedService: Service | null;
  selectedSlot: Slot | null;
  setSalon: (salon: Salon) => void;
  setService: (service: Service) => void;
  setSlot: (slot: Slot) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedSalon: null,
  selectedService: null,
  selectedSlot: null,
  setSalon: (salon) => set({ selectedSalon: salon, selectedService: null, selectedSlot: null }),
  setService: (service) => set({ selectedService: service, selectedSlot: null }),
  setSlot: (slot) => set({ selectedSlot: slot }),
  resetBooking: () => set({ selectedSalon: null, selectedService: null, selectedSlot: null }),
}));
