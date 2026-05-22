import { THEME } from '@/theme/theme';
import React, { useState, useMemo, useEffect, useCallback, JSX } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  Animated,
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
import { useBusinessHours } from '@/hooks/useBusinessHours';
import { useRealtimeClock } from '@/features/booking/hooks/useRealtimeClock';
import { getDefaultBookingDate, getShopLocalDate, getShopLocalNow } from '@/utils/shopTime';

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
          backgroundColor: THEME.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={THEME.colors.primary} />
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

  // ─── Live clock — ticks every minute, fires exactly at midnight ──────────────
  // Pass business?.timezone here once that column exists on businesses table.
  const clock = useRealtimeClock(/* business?.timezone */);

  // ─── Animated banner value ────────────────────────────────────────────────────
  const bannerAnim = React.useRef(new Animated.Value(0)).current;

  // ─── Selected date — starts as today in shop TZ ──────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string>(clock.todayStr);

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

  // ─── Business hours for the selected day ─────────────────────────────────────
  const { data: businessHours } = useBusinessHours((id as string) || null, selectedDate);

  // ─── Shop-closed detection (live clock + actual closing time) ─────────────────
  const isShopClosed = useMemo(() => {
    if (!businessHours) return false;
    if (businessHours.isClosed) return true;
    if (!businessHours.closing_time) return false;

    // Only flag as "closed" when the selected day is today
    const isToday = selectedDate === clock.todayStr;
    if (!isToday) return false;

    const closingMinutes = businessHours.closing_time
      .split(':')
      .slice(0, 2)
      .reduce((acc, v, i) => acc + (i === 0 ? Number(v) * 60 : Number(v)), 0);

    const currentMinutes = clock.now.hour() * 60 + clock.now.minute();
    return currentMinutes >= closingMinutes;
  }, [clock.now, clock.todayStr, selectedDate, businessHours]);

  // ─── Auto-advance to tomorrow when shop is closed ────────────────────────────
  useEffect(() => {
    if (isShopClosed && selectedDate === clock.todayStr) {
      const tomorrow = clock.now.add(1, 'day').format('YYYY-MM-DD');
      setSelectedDate(tomorrow);
    }
  }, [isShopClosed, selectedDate, clock.todayStr, clock.now]);

  // ─── Midnight rollover — advance selectedDate when clock ticks to new day ─────
  useEffect(() => {
    setSelectedDate((prev) => {
      const prevDay = clock.now.subtract(1, 'second').startOf('day');
      // If the stored date is "yesterday" relative to the new today, move forward
      if (clock.now.startOf('day').isAfter(prevDay) && prev < clock.todayStr) {
        queryClient.invalidateQueries({ queryKey: queryKeys.slots.all() });
        return clock.todayStr;
      }
      return prev;
    });
  }, [clock.todayStr]);

  // ─── Default date correction once business hours are known ───────────────────
  useEffect(() => {
    if (!businessHours || businessHours.isClosed) return;
    const correct = getDefaultBookingDate(
      businessHours.closing_time ?? null,
      /* business?.timezone */
    );
    setSelectedDate((prev) => {
      // Only move forward, never backward
      return correct > prev ? correct : prev;
    });
  }, [businessHours]);

  // ─── Banner animation ─────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(bannerAnim, {
      toValue: isShopClosed ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isShopClosed, bannerAnim]);

  // ─── Sync profile details if they load late ──────────────────────────────────
  useEffect(() => {
    if (profile?.full_name && !customerName) {
      setCustomerName(profile.full_name);
    }
    if (profile?.phone_number && !customerPhone) {
      setCustomerPhone(profile.phone_number);
    }
  }, [profile]);

  // ─── Fetch services from API ──────────────────────────────────────────────────
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    apiService
      .getPublicServices(id as string)
      .then(setServices)
      .catch((err) => console.error('Error fetching services on booking page:', err));
  }, [id]);

  // ─── Pre-fill form for rescheduling ──────────────────────────────────────────
  useEffect(() => {
    if (isRescheduling && existingBooking && services.length > 0) {
      const preselectedServices = services.filter(
        (srv) =>
          existingBooking.services?.some((es: any) => es.id === srv.id) ||
          existingBooking.service?.id === srv.id,
      );
      if (preselectedServices.length > 0) {
        setSelectedServices(preselectedServices);
      }

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

  // ─── Fetch slots ──────────────────────────────────────────────────────────────
  const {
    data: slotsResponse,
    isLoading: slotsLoading,
    refetch: refetchSlots,
  } = useSlots(id as string, selectedDate, activeService?.id);

  // ─── Normalize and filter slots ───────────────────────────────────────────────
  // NOTE: Past-slot filtering is now done server-side in slots.ts (getShopLocalDate/Now).
  // Here we only normalize the shape and apply a client-side guard as a safety net.
  const normalizedSlots = useMemo(() => {
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

    const processedSlots: any[] = rawSlotsList.map((slot: any) => {
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
        label,
        is_available: slot.is_available ?? true,
      };
    });

    // Client-side safety net: hide past slots for today (server already does this,
    // but clock.now is more up-to-date than the last fetch).
    if (selectedDate === clock.todayStr) {
      const now = getShopLocalNow(/* business?.timezone */);
      const currentMinutes = now.hour() * 60 + now.minute();
      return processedSlots.filter((slot: any) => {
        const [h, m] = slot.time.split(':').map(Number);
        return h * 60 + m > currentMinutes;
      });
    }

    return processedSlots;
  }, [slotsResponse, selectedDate, clock.todayStr, clock.now]);

  // ─── Reset slot selection when date changes ───────────────────────────────────
  useEffect(() => {
    setSelectedSlot(null);
    refetchSlots();
  }, [selectedDate]);

  // ─── Pre-select slot if initialTime provided (rescheduling) ──────────────────
  useEffect(() => {
    if (initialTime && normalizedSlots.length > 0) {
      const preselectedSlot = normalizedSlots.find((slot) => slot.time === initialTime);
      if (preselectedSlot) {
        setSelectedSlot(preselectedSlot);
      }
    }
  }, [initialTime, normalizedSlots]);

  // ─── Booking submission ───────────────────────────────────────────────────────
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
        slot_id: selectedSlot.id.startsWith('gen-slot-') ? null : selectedSlot.id,
        service_id: selectedServices.map((s) => s.id),
        date: selectedDate,
        time: selectedSlot.time,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
      };

      if (isRescheduling && bookingId) {
        await rescheduleBooking({ bookingId: bookingId as string, payload: bookingPayload });
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
        router.replace('/(customer)/bookings');
      } else {
        const response = await apiService.createBooking(bookingPayload);

        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });

        const newBookingId =
          response?.reference ||
          response?.booking_id ||
          response?.id ||
          `CUSOWN-${Math.floor(10000 + Math.random() * 90000)}`;

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
            bookingId: newBookingId,
            totalPrice: String(totalPrice),
            salonImage: business.owner_image || business.image_url || '',
            ownerUserId: business.owner_user_id,
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

  // ─── Loading / error guards ───────────────────────────────────────────────────
  if (businessLoading || (isRescheduling && existingBookingLoading)) {
    return (
      <PremiumBackground>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text className="text-textSecondary font-medium mt-4 font-semibold">
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
          <Ionicons name="alert-circle-outline" size={64} color={THEME.colors.error} />
          <Text className="text-text text-xl font-bold mt-4">Invalid Business ID</Text>
          <PremiumButton
            title="Go Back"
            onPress={() => router.replace('/(customer)/browse')}
            className="w-48 h-12 mt-6"
          />
        </View>
      </PremiumBackground>
    );
  }

  // ─── Helper: slot area content ────────────────────────────────────────────────
  const renderSlotArea = () => {
    if (slotsLoading) {
      return (
        <View className="py-16 items-center justify-center">
          <ActivityIndicator size="small" color={THEME.colors.primary} />
          <Text className="text-textSecondary text-xs mt-3 font-bold">Loading Slots...</Text>
        </View>
      );
    }

    if (normalizedSlots.length === 0) {
      const emptyMsg = businessHours?.isClosed
        ? 'Shop is closed on this day.'
        : 'No slots available for this date.';
      return (
        <View className=" rounded-[28px] py-14 items-center">
          <Ionicons name="calendar-outline" size={32} color={THEME.colors.textSecondary} />
          <Text className="text-textSecondary font-bold mt-3 text-center px-4">{emptyMsg}</Text>
        </View>
      );
    }

    return (
      <View className="flex-row flex-wrap justify-between">
        {normalizedSlots.map((slot) => {
          const isSelected = selectedSlot?.id === slot.id;
          const isAvailable = slot.is_available;

          return (
            <Pressable
              key={slot.id}
              disabled={!isAvailable}
              onPress={() => setSelectedSlot(slot)}
              className={`w-[31%] py-4 mb-3 rounded-[22px] border items-center justify-center bg-card ${
                !isAvailable
                  ? 'border-border'
                  : isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
              }`}
              style={{ opacity: !isAvailable ? 0.45 : 1 }}
            >
              <Text
                className={`font-black text-sm ${
                  !isAvailable ? 'text-textSecondary' : isSelected ? 'text-primary' : 'text-text'
                }`}
              >
                {slot.label}
              </Text>
              {!isAvailable && (
                <Text className="text-textSecondary text-[10px] font-semibold uppercase mt-0.5">
                  Booked
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center border-b border-border bg-background/90 backdrop-blur-md">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(`/(customer)/browse/salons/${id}`);
              }
            }}
            className="w-10 h-10 rounded-full items-center justify-center mr-4 bg-border/50"
          >
            <Ionicons name="arrow-back" size={20} color={THEME.colors.text} />
          </Pressable>
          <View>
            <Text className="text-text font-black text-xl tracking-tight">
              {isRescheduling ? 'Reschedule Appointment' : 'Book Appointment'}
            </Text>
            <Text className="text-textSecondary text-xs font-semibold" numberOfLines={1}>
              {business.salon_name}
            </Text>
          </View>
        </View>

        {/* Shop-closed banner */}
        <Animated.View
          style={{
            opacity: bannerAnim,
            transform: [
              {
                translateY: bannerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-40, 0],
                }),
              },
            ],
            overflow: 'hidden',
            backgroundColor: '#E53E3E',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: isShopClosed ? 10 : 0,
            maxHeight: isShopClosed ? 50 : 0,
          }}
        >
          <Ionicons name="lock-closed" size={14} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 }}>
            Shop is closed. Showing availability for tomorrow.
          </Text>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          <View className="px-5 mt-5">
            <View
              className="rounded-[36px]  overflow-hidden bg-card"
              style={{
                shadowColor: THEME.colors.background,
                shadowOpacity: 0.04,
                shadowRadius: 14,
                elevation: 4,
              }}
            >
              {/* SERVICES */}
              <View className="px-6 pt-6">
                <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-4">
                  Services
                </Text>

                <View>
                  {servicesList.map((service: Service) => {
                    const isSelected = selectedServices.some((s) => s.id === service.id);

                    return (
                      <Pressable
                        key={service.id}
                        onPress={() => toggleService(service)}
                        className={`mb-3 rounded-[26px] border p-4 flex-row items-center justify-between bg-card ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <View className="flex-row items-center flex-1">
                          <View
                            className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-4 ${
                              isSelected ? 'border-primary' : 'border-border'
                            }`}
                          >
                            {isSelected && (
                              <Ionicons name="checkmark" size={14} color={THEME.colors.primary} />
                            )}
                          </View>

                          <View className="flex-1">
                            <Text className="font-black text-base text-text">{service.name}</Text>
                            <Text className="text-xs mt-1 text-textSecondary">
                              {service.duration || 30} mins
                            </Text>
                          </View>
                        </View>

                        <Text className="font-black text-base text-text">₹{service.price}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* SLOT SECTION */}
              <View className="px-6 mt-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px]">
                    Available Slots
                  </Text>

                  <View className="flex-row items-center">
                    <Text className="text-textSecondary text-xs font-bold mr-0">
                      {selectedDate === clock.todayStr
                        ? `Today, ${new Date(selectedDate).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                          })}`
                        : new Date(selectedDate).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                          })}
                    </Text>

                    <Pressable
                      onPress={() => setShowCalendar(!showCalendar)}
                      className="px-4 h-10 rounded-2xl flex-row items-center bg-border/20 ml-2"
                    >
                      <Ionicons name="calendar-outline" size={16} color={THEME.colors.text} />
                    </Pressable>
                  </View>
                </View>

                {/* Calendar — past dates disabled */}
                {showCalendar && (
                  <View className="mb-5 rounded-[28px]  overflow-hidden bg-card">
                    <Calendar
                      current={selectedDate}
                      // minDate driven by live clock so it updates at midnight
                      minDate={clock.todayStr}
                      maxDate={(() => {
                        const d = new Date(clock.todayStr);
                        d.setDate(d.getDate() + 14);
                        return d.toISOString().split('T')[0];
                      })()}
                      onDayPress={(day) => {
                        setSelectedDate(day.dateString);
                        setShowCalendar(false);
                      }}
                      markedDates={{
                        [selectedDate]: {
                          selected: true,
                          selectedColor: THEME.colors.primary,
                        },
                      }}
                      theme={{
                        backgroundColor: THEME.colors.card,
                        calendarBackground: THEME.colors.card,
                        textSectionTitleColor: THEME.colors.textSecondary,
                        selectedDayBackgroundColor: THEME.colors.primary,
                        selectedDayTextColor: THEME.colors.background,
                        todayTextColor: THEME.colors.primary,
                        dayTextColor: THEME.colors.text,
                        monthTextColor: THEME.colors.text,
                        arrowColor: THEME.colors.text,
                        textDisabledColor: THEME.colors.border,
                        textDayFontWeight: '700',
                        textMonthFontWeight: '900',
                      }}
                    />
                  </View>
                )}

                {/* Slot grid */}
                {renderSlotArea()}
              </View>

              {/* CUSTOMER INFO */}
              <View className="px-6 mt-5 pb-6">
                <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-4">
                  Customer Details
                </Text>

                <View className="mb-4">
                  <View className="h-14 rounded-[22px]  px-4 flex-row items-center bg-input">
                    <Ionicons name="person-outline" size={18} color={THEME.colors.textSecondary} />
                    <TextInput
                      className="flex-1 ml-3 text-text font-bold"
                      placeholder="Enter full name"
                      placeholderTextColor={THEME.colors.textSecondary}
                      value={customerName}
                      onChangeText={setCustomerName}
                    />
                  </View>
                </View>

                <View>
                  <View className="h-14 rounded-[22px]  px-4 flex-row items-center bg-input">
                    <Ionicons name="call-outline" size={18} color={THEME.colors.textSecondary} />
                    <TextInput
                      className="flex-1 ml-3 text-text font-bold"
                      placeholder="Enter phone number"
                      placeholderTextColor={THEME.colors.textSecondary}
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
          className="absolute bottom-0 left-0 right-0 border-t border-border px-6 pt-4 pb-10 bg-card"
          style={{
            shadowColor: THEME.colors.background,
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider">
                Date & Time
              </Text>
              <Text className="text-text font-extrabold text-sm">
                {selectedSlot
                  ? `${new Date(selectedDate).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                    })} at ${selectedSlot.label}`
                  : 'Select slot time'}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider">
                Total Price
              </Text>
              <Text className="text-text font-black text-xl">₹{totalPrice}</Text>
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
