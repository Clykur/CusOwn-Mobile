import React, { useState, useMemo, useEffect, JSX } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform, // Import Platform
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Ionicons } from '@expo/vector-icons';
import { useBusinessDetail } from '@/hooks/useBusinesses';
import { useBookingStore } from '@/store/booking.store';
import { useSlots } from '@/hooks/useSlots';
import { useAuthStore } from '@/store/auth.store';
import { apiService } from '@/services/api.service';
import { Service } from '@/types/business.types';
import { queryKeys, queryClient } from '@/lib/queryClient';
import { useBookingDetail, useRescheduleBooking } from '@/hooks/useBookings';

export default function BookingScreen() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000000',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return <BookingScreenInner />;
}

function BookingScreenInner(): JSX.Element {
  const { id, bookingId, selectedTime: initialTime } = useLocalSearchParams();
  const { data: business, isLoading: businessLoading } = useBusinessDetail(id as string);
  const { selectedService, selectedServices: storeSelectedServices } = useBookingStore();
  const { user, profile } = useAuthStore();

  const { data: existingBooking, isLoading: existingBookingLoading } = useBookingDetail(
    bookingId as string,
  );

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [customerName, setCustomerName] = useState(
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
  );
  const [customerPhone, setCustomerPhone] = useState(profile?.phone_number || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  // For rescheduling
  const isRescheduling = !!bookingId;
  const { mutateAsync: rescheduleBooking, isPending: isReschedulingPending } =
    useRescheduleBooking();

  // Sync profile details if they load late
  useEffect(() => {
    if (profile?.full_name && !customerName) {
      setCustomerName(profile.full_name);
    }
    if (profile?.phone_number && !customerPhone) {
      setCustomerPhone(profile.phone_number);
    }
  }, [profile]);

  // Fetch services from API
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    apiService
      .getPublicServices(id as string)
      .then(setServices)
      .catch((err) => console.error('Error fetching services on booking page:', err));
  }, [id]);

  // Pre-fill form for rescheduling
  useEffect(() => {
    if (isRescheduling && existingBooking && services.length > 0) {
      // Set selected services
      const preselectedServices = services.filter(
        (srv) =>
          existingBooking.services?.some((es: any) => es.id === srv.id) ||
          existingBooking.service?.id === srv.id,
      );
      if (preselectedServices.length > 0) {
        setSelectedServices(preselectedServices);
      }

      // Set customer details
      setCustomerName(
        existingBooking.customer_name ||
          profile?.full_name ||
          user?.user_metadata?.full_name ||
          user?.email?.split('@')[0] ||
          '',
      );
      setCustomerPhone(existingBooking.customer_phone || profile?.phone_number || '');
    }
  }, [isRescheduling, existingBooking, services, profile, user]);

  // Get active services
  const servicesList = services;

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  useEffect(() => {
    if (storeSelectedServices && storeSelectedServices.length > 0) {
      setSelectedServices(storeSelectedServices);
    } else if (selectedService) {
      if (!selectedServices.some((s) => s.id === selectedService.id)) {
        setSelectedServices([selectedService]);
      }
    } else if (servicesList.length > 0 && selectedServices.length === 0) {
      setSelectedServices([servicesList[0]]);
    }
  }, [selectedService, storeSelectedServices, servicesList]);

  const toggleService = (srv: Service) => {
    if (selectedServices.some((s) => s.id === srv.id)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s.id !== srv.id));
      } else {
        Alert.alert('Selection Required', 'You must keep at least one service selected.');
      }
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const totalPrice = selectedServices.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  const activeService = selectedServices[0] || servicesList[0];

  // Fetch slots from API using selectedDate and serviceId
  const {
    data: slotsResponse,
    isLoading: slotsLoading,
    refetch: refetchSlots,
  } = useSlots(id as string, selectedDate, activeService?.id);

  // Generate fallback slots if backend has no slot template configured
  const generateFallbackSlots = (biz: any, dateStr: string) => {
    const slots: any[] = [];
    const opening = biz.opening_time || '09:00 AM';
    const closing = biz.closing_time || '09:00 PM';
    const duration = biz.slot_duration || 30;

    const parseTimeToMinutes = (timeStr: string) => {
      const parts = timeStr.split(' ');
      const time = parts[0];
      const modifier = parts[1] || 'AM';
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    try {
      const startMinutes = parseTimeToMinutes(opening);
      const endMinutes = parseTimeToMinutes(closing);
      let current = startMinutes;

      while (current + duration <= endMinutes) {
        const hours = Math.floor(current / 60);
        const mins = current % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 === 0 ? 12 : hours % 12;
        const displayMins = mins < 10 ? `0${mins}` : mins;

        const timeValue = `${hours < 10 ? '0' : ''}${hours}:${displayMins}`;
        const label = `${displayHours}:${displayMins} ${ampm}`;

        slots.push({
          id: `gen-slot-${dateStr}-${timeValue}`,
          business_id: biz.id,
          date: dateStr,
          time: timeValue,
          label: label,
          is_available: true,
        });

        current += duration;
      }
    } catch (e) {
      // Return basic fallback slots if parsing fails
      return [
        {
          id: `gen-slot-${dateStr}-09:00`,
          business_id: biz.id,
          date: dateStr,
          time: '09:00',
          label: '9:00 AM',
          is_available: true,
        },
        {
          id: `gen-slot-${dateStr}-10:30`,
          business_id: biz.id,
          date: dateStr,
          time: '10:30',
          label: '10:30 AM',
          is_available: true,
        },
        {
          id: `gen-slot-${dateStr}-13:00`,
          business_id: biz.id,
          date: dateStr,
          time: '13:00',
          label: '1:00 PM',
          is_available: true,
        },
        {
          id: `gen-slot-${dateStr}-15:00`,
          business_id: biz.id,
          date: dateStr,
          time: '15:00',
          label: '3:00 PM',
          is_available: true,
        },
      ];
    }
    return slots;
  };

  // Process, normalize, and filter slots
  const normalizedSlots = useMemo(() => {
    // Determine raw slots list depending on the format returned by endpoint
    let rawSlotsList: any[] = [];
    if (slotsResponse) {
      if (Array.isArray(slotsResponse)) {
        rawSlotsList = slotsResponse;
      } else if (
        typeof slotsResponse === 'object' &&
        'slots' in slotsResponse &&
        Array.isArray((slotsResponse as { slots: unknown[] }).slots)
      ) {
        rawSlotsList = (slotsResponse as { slots: unknown[] }).slots;
      }
    }

    let processedSlots: any[] = [];
    if (rawSlotsList.length === 0) {
      if (business) {
        processedSlots = generateFallbackSlots(business, selectedDate);
      }
    } else {
      processedSlots = rawSlotsList.map((slot: any) => {
        const timeVal = slot.time || slot.start_time || '09:00';
        const [hours, minutes] = timeVal.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 === 0 ? 12 : hours % 12;
        const displayMins = minutes < 10 ? `0${minutes}` : minutes;
        const label = `${displayHours}:${displayMins} ${ampm}`;

        return {
          id: slot.id,
          business_id: slot.business_id,
          date: slot.date,
          time: timeVal,
          label: label,
          is_available: slot.is_available ?? true,
        };
      });
    }

    // Apply filtering: if selecting TODAY, show ONLY future slots relative to current time
    const todayObj = new Date();
    const tYear = todayObj.getFullYear();
    const tMonth = String(todayObj.getMonth() + 1).padStart(2, '0');
    const tDate = String(todayObj.getDate()).padStart(2, '0');
    const todayStr = `${tYear}-${tMonth}-${tDate}`;

    if (selectedDate === todayStr) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      return processedSlots.filter((slot: any) => {
        const [h, m] = slot.time.split(':').map(Number);
        const slotMinutes = h * 60 + m;
        // Keep only slots that start at or after the current time
        return slotMinutes >= currentMinutes;
      });
    }

    return processedSlots;
  }, [slotsResponse, business, selectedDate]);

  // Reset selected slot when date changes
  useEffect(() => {
    setSelectedSlot(null);
    refetchSlots(); // Refetch slots when date changes
  }, [selectedDate]);

  // Pre-select slot if initialTime is provided (for rescheduling)
  useEffect(() => {
    if (initialTime && normalizedSlots.length > 0) {
      const preselectedSlot = normalizedSlots.find((slot) => slot.time === initialTime);
      if (preselectedSlot) {
        setSelectedSlot(preselectedSlot);
      }
    }
  }, [initialTime, normalizedSlots]);

  // Active services are fetched and parsed at the top of the component scope

  const handleCreateOrRescheduleBooking = async () => {
    if (!business || selectedServices.length === 0 || !selectedSlot) {
      Alert.alert('Error', 'Please select a date, time, and service.');
      return;
    }

    if (!customerName.trim()) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }

    try {
      setIsSubmitting(true);

      const bookingPayload = {
        business_id: business.id,
        slot_id: selectedSlot.id.startsWith('gen-slot-') ? null : selectedSlot.id, // Handle fallback slot IDs
        service_id: selectedServices.map((s) => s.id),
        date: selectedDate,
        time: selectedSlot.time,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
      };

      if (isRescheduling && bookingId) {
        await rescheduleBooking({ bookingId: bookingId as string, payload: bookingPayload });
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
        router.replace('/(customer)/bookings'); // Go back to bookings list after reschedule
      } else {
        const response = await apiService.createBooking(bookingPayload);

        // Invalidate the cache to trigger refetching
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });

        // Extract booking identifiers safely
        const bookingId =
          response?.id ||
          response?.booking_id ||
          response?.reference ||
          `BK-${Math.floor(10000 + Math.random() * 90000)}`;

        // Format date for success screen
        const options: Intl.DateTimeFormatOptions = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        };
        const friendlyDate = new Date(selectedDate).toLocaleDateString('en-US', options);

        router.replace({
          pathname: '/(customer)/booking-success',
          params: {
            salonName: business.salon_name,

            serviceName: selectedServices.map((s) => s.name).join(', '),

            bookingDate: friendlyDate,

            bookingTime: selectedSlot.label,

            bookingId: bookingId,

            totalPrice: String(totalPrice),

            salonImage: business.owner_image || '',
          },
        });
      }
    } catch (err: any) {
      Alert.alert(
        isRescheduling ? 'Rescheduling Failed' : 'Booking Failed',
        err.response?.data?.message ||
          err.message ||
          'An error occurred while reserving your slot. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (businessLoading || (isRescheduling && existingBookingLoading)) {
    return (
      <PremiumBackground>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000000" />
          <Text className="text-slate-500 font-medium mt-4 font-semibold">
            Preparing schedule...
          </Text>
        </View>
      </PremiumBackground>
    );
  }

  if (!business) {
    return (
      <PremiumBackground>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-slate-900 text-xl font-bold mt-4">Invalid Business ID</Text>
          <PremiumButton
            title="Go Back"
            onPress={() => router.replace('/(customer)/browse')}
            className="w-48 h-12 mt-6"
          />
        </View>
      </PremiumBackground>
    );
  }

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View
          className="px-6 py-4 flex-row items-center border-b border-slate-100"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
        >
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(`/(customer)/browse/salons/${id}`);
              }
            }}
            className="w-10 h-10 rounded-full items-center justify-center mr-4"
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </Pressable>
          <View>
            <Text className="text-slate-900 font-black text-xl tracking-tight">
              {isRescheduling ? 'Reschedule Appointment' : 'Book Appointment'}
            </Text>
            <Text className="text-slate-500 text-xs font-semibold" numberOfLines={1}>
              {business.salon_name}
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          <View className="px-5 mt-5">
            <View
              className="rounded-[36px] border border-slate-200 overflow-hidden bg-white"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 14,
                elevation: 4,
              }}
            >
              {/* SERVICES */}
              <View className="px-6 pt-6">
                <Text className="text-slate-400 text-[11px] font-black uppercase tracking-[2px] mb-4">
                  Services
                </Text>

                <View>
                  {servicesList.map((service: Service) => {
                    const isSelected = selectedServices.some((s) => s.id === service.id);

                    return (
                      <Pressable
                        key={service.id}
                        onPress={() => toggleService(service)}
                        className={`mb-3 rounded-[26px] border p-4 flex-row items-center justify-between bg-white ${
                          isSelected ? 'border-black' : 'border-slate-200'
                        }`}
                      >
                        <View className="flex-row items-center flex-1">
                          <View
                            className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-4 ${
                              isSelected ? 'border-black' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Ionicons name="checkmark" size={14} color="#000" />}
                          </View>

                          <View className="flex-1">
                            <Text className="font-black text-base text-slate-900">
                              {service.name}
                            </Text>

                            <Text className="text-xs mt-1 text-slate-500">
                              {service.duration || 30} mins
                            </Text>
                          </View>
                        </View>

                        <Text className="font-black text-base text-slate-900">
                          ₹{service.price}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* SLOT HEADER */}
              <View className="px-6 mt-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-slate-400 text-[11px] font-black uppercase tracking-[2px]">
                    Available Slots
                  </Text>

                  <View className="flex-row items-center">
                    <Text className="text-slate-500 text-xs font-bold mr-0">
                      {new Date(selectedDate).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>

                    <Pressable
                      onPress={() => setShowCalendar(!showCalendar)}
                      className="px-4 h-10 rounded-2xl flex-row items-center"
                    >
                      <Ionicons name="calendar-outline" size={16} color="#0F172A" />
                    </Pressable>
                  </View>
                </View>

                {showCalendar && (
                  <View className="mb-5 rounded-[28px] border border-slate-200 overflow-hidden bg-white">
                    <Calendar
                      current={selectedDate}
                      minDate={new Date().toISOString().split('T')[0]}
                      maxDate={
                        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      }
                      onDayPress={(day) => {
                        setSelectedDate(day.dateString);
                        setShowCalendar(false);
                      }}
                      markedDates={{
                        [selectedDate]: {
                          selected: true,
                          selectedColor: '#000000',
                        },
                      }}
                      theme={{
                        backgroundColor: '#ffffff',
                        calendarBackground: '#ffffff',
                        textSectionTitleColor: '#94A3B8',
                        selectedDayBackgroundColor: '#000000',
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: '#000000',
                        dayTextColor: '#0F172A',
                        monthTextColor: '#0F172A',
                        arrowColor: '#000000',
                        textDisabledColor: '#CBD5E1',
                        textDayFontWeight: '700',
                        textMonthFontWeight: '900',
                      }}
                    />
                  </View>
                )}

                {slotsLoading ? (
                  <View className="py-16 items-center justify-center">
                    <ActivityIndicator size="small" color="#000" />

                    <Text className="text-slate-500 text-xs mt-3 font-bold">Loading Slots...</Text>
                  </View>
                ) : normalizedSlots.length === 0 ? (
                  <View className="border border-slate-200 rounded-[28px] py-14 items-center">
                    <Ionicons name="calendar-outline" size={32} color="#94A3B8" />

                    <Text className="text-slate-500 font-bold mt-3">No Slots Available</Text>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap justify-between">
                    {normalizedSlots.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;

                      const isAvailable = slot.is_available;

                      return (
                        <Pressable
                          key={slot.id}
                          disabled={!isAvailable}
                          onPress={() => setSelectedSlot(slot)}
                          className={`w-[31%] py-4 mb-3 rounded-[22px] border items-center justify-center bg-white ${
                            !isAvailable
                              ? 'border-slate-100'
                              : isSelected
                                ? 'border-black'
                                : 'border-slate-200'
                          }`}
                        >
                          <Text
                            className={`font-black text-sm ${
                              !isAvailable ? 'text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {slot.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* CUSTOMER INFO */}
              <View className="px-6 mt-5 pb-6">
                <Text className="text-slate-400 text-[11px] font-black uppercase tracking-[2px] mb-4">
                  Customer Details
                </Text>

                <View className="mb-4">
                  <View className="h-14 rounded-[22px] border border-slate-200 px-4 flex-row items-center bg-white">
                    <Ionicons name="person-outline" size={18} color="#64748B" />

                    <TextInput
                      className="flex-1 ml-3 text-slate-900 font-bold"
                      placeholder="Enter full name"
                      placeholderTextColor="#94A3B8"
                      value={customerName}
                      onChangeText={setCustomerName}
                    />
                  </View>
                </View>

                <View>
                  <View className="h-14 rounded-[22px] border border-slate-200 px-4 flex-row items-center bg-white">
                    <Ionicons name="call-outline" size={18} color="#64748B" />

                    <TextInput
                      className="flex-1 ml-3 text-slate-900 font-bold"
                      placeholder="Enter phone number"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      value={customerPhone}
                      onChangeText={setCustomerPhone}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Confirm Booking Button */}
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-slate-100 px-6 pt-4 pb-10"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                Date & Time
              </Text>
              <Text className="text-slate-900 font-extrabold text-sm">
                {selectedSlot
                  ? `${new Date(selectedDate).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                    })} at ${selectedSlot.label}`
                  : 'Select slot time'}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                Total Price
              </Text>
              <Text className="text-slate-900 font-black text-xl">₹{totalPrice}</Text>
            </View>
          </View>

          <PremiumButton
            title={isRescheduling ? 'Reschedule Appointment' : 'Confirm Booking'}
            onPress={handleCreateOrRescheduleBooking}
            loading={isSubmitting || isReschedulingPending}
            className="w-full h-14"
          />
        </View>
      </SafeAreaView>
    </PremiumBackground>
  );
}
