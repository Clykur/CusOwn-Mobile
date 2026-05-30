import { create } from 'zustand';

import type { Business, Service } from '@/types/business.types';
import type { Slot } from '@/types/slot.types';

interface BookingState {
  selectedBusiness: Business | null;
  selectedService: Service | null;
  selectedServices: Service[];
  selectedSlot: Slot | null;
  setBusiness: (business: Business) => void;
  setService: (service: Service) => void;
  setSelectedServices: (services: Service[]) => void;
  setSlot: (slot: Slot) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedBusiness: null,
  selectedService: null,
  selectedServices: [],
  selectedSlot: null,
  setBusiness: (business) =>
    set({
      selectedBusiness: business,
      selectedService: null,
      selectedServices: [],
      selectedSlot: null,
    }),
  setService: (service) =>
    set({ selectedService: service, selectedServices: [service], selectedSlot: null }),
  setSelectedServices: (services) =>
    set({ selectedServices: services, selectedService: services[0] || null, selectedSlot: null }),
  setSlot: (slot) => set({ selectedSlot: slot }),
  resetBooking: () =>
    set({
      selectedBusiness: null,
      selectedService: null,
      selectedServices: [],
      selectedSlot: null,
    }),
}));
