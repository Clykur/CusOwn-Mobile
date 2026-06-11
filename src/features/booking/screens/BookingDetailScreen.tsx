import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Avatar } from '@/components/ui/Avatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { BookingActions } from '@/features/booking/components/booking-status/booking-actions';
import { useBookingDetail, useUpdateBookingStatus } from '@/hooks/useBookings';
import { useModal } from '@/hooks/useModal';
import { buildBookingWhatsAppUrl } from '@/lib/whatsapp';
import { getBookingPrice } from '@/services/api.service';
import { apiService } from '@/services/api.service';
import { THEME } from '@/theme/theme';
import { logger, LogTag } from '@/utils/logger';
import { formatBookingDate, formatBookingTime } from '@/utils/time';

import type { Slot } from '@/features/booking/types/slot.types';

function getStatusConfig(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return {
        bg: 'bg-success/10 border-success/30',
        text: 'text-success',
        icon: 'checkmark-circle-outline' as const,
        iconColor: THEME.colors.success,
        label: 'Confirmed',
      };
    case 'completed':
      return {
        bg: 'bg-primary/10 border-primary/30',
        text: 'text-primary',
        icon: 'checkmark-done-circle-outline' as const,
        iconColor: THEME.colors.primary,
        label: 'Completed',
      };
    case 'pending':
      return {
        bg: 'bg-warning/10 border-warning/30',
        text: 'text-warning',
        icon: 'time-outline' as const,
        iconColor: THEME.colors.warning,
        label: 'Pending Approval',
      };
    case 'rejected':
      return {
        bg: 'bg-error/10 border-error/30',
        text: 'text-error',
        icon: 'close-circle-outline' as const,
        iconColor: THEME.colors.error,
        label: 'Rejected',
      };
    case 'cancelled':
      return {
        bg: 'bg-error/10 border-error/30',
        text: 'text-error',
        icon: 'ban-outline' as const,
        iconColor: THEME.colors.error,
        label: 'Cancelled',
      };
    case 'no_show':
      return {
        bg: 'bg-border border-border',
        text: 'text-textSecondary',
        icon: 'eye-off-outline' as const,
        iconColor: THEME.colors.textSecondary,
        label: 'No-Show',
      };
    default:
      return {
        bg: 'bg-border border-border',
        text: 'text-textSecondary',
        icon: 'information-circle-outline' as const,
        iconColor: THEME.colors.textSecondary,
        label: status.charAt(0).toUpperCase() + status.slice(1),
      };
  }
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showModal } = useModal();

  const { data: booking, isLoading, isError } = useBookingDetail(id || '');

  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);

  const cancellationMinHoursMs = 2 * 60 * 60 * 1000;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mutate: updateBookingStatus, isPending: isCancelling } = useUpdateBookingStatus();

  /* ---------------- WHATSAPP ---------------- */

  useEffect(() => {
    let cancelled = false;

    const targetBookingId = booking?.booking_id || booking?.reference || booking?.id;

    if (!targetBookingId) return;

    const isPastOrCancelled =
      booking.status === 'cancelled' ||
      booking.status === 'no_show' ||
      booking.status === 'rejected' ||
      booking.status === 'completed';

    if (isPastOrCancelled) {
      setWhatsappUrl(null);
      return;
    }

    const fetchWhatsapp = async () => {
      try {
        setWhatsappLoading(true);

        const phone = booking?.business?.whatsapp_number || booking?.customer_phone || '';
        const salonName = booking?.business?.salon_name || 'the salon';
        const url = buildBookingWhatsAppUrl({
          phone,
          salonName,
          reference: booking?.reference || booking?.booking_id,
          bookingId: targetBookingId,
        });

        if (!cancelled && url) {
          setWhatsappUrl(url);
        }
      } catch (err) {
        logger.error(LogTag.API, 'Failed to fetch WhatsApp URL', err);
      } finally {
        if (!cancelled) setWhatsappLoading(false);
      }
    };

    fetchWhatsapp();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id, booking?.booking_id, booking?.status]);

  /* ---------------- AVAILABLE SLOTS ---------------- */

  useEffect(() => {
    let cancelled = false;

    const fetchSlots = async () => {
      try {
        const salonId = booking?.business_id || booking?.business?.id;
        const date = booking?.slot?.date || booking?.date;

        if (!salonId || !date) return;

        const res = await apiService.getSlots(String(salonId), String(date));

        if (!cancelled) {
          setSlots(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        logger.error(LogTag.API, 'Failed to fetch slots', err);
      }
    };

    fetchSlots();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id]);

  /* ---------------- ACTIONS ---------------- */

  const handleCall = (phoneNumber?: string) => {
    if (!phoneNumber) return;

    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      showModal({
        variant: 'error',
        title: 'Error',
        description: 'Unable to open phone dialer.',
      });
    });
  };

  const handleOpenWhatsapp = () => {
    if (!whatsappUrl) return;

    Linking.openURL(whatsappUrl).catch(() => {
      showModal({
        variant: 'error',
        title: 'Error',
        description: 'Unable to open WhatsApp.',
      });
    });
  };

  const handleCancelled = () => {
    showModal({
      variant: 'success',
      title: 'Success',
      description: 'Booking cancelled successfully.',
      hideCancel: true,
      actions: [
        {
          label: 'OK',
          variant: 'primary',
          onPress: () => {
            router.replace('/(customer)/bookings');
          },
        },
      ],
    });
  };

  const handleRescheduled = () => {
    // Booking is already rescheduled by RescheduleButton.
    // Just refresh the data.
  };

  /* ---------------- LOADING ---------------- */

  if (isLoading) {
    return (
      <PremiumBackground>
        <SafeAreaView className="flex-1 px-luxury py-8">
          <LoadingSkeleton height={40} borderRadius={12} className="mb-6" />
          <LoadingSkeleton height={140} borderRadius={20} className="mb-6" />
          <LoadingSkeleton height={180} borderRadius={20} className="mb-6" />
          <LoadingSkeleton height={50} borderRadius={14} />
        </SafeAreaView>
      </PremiumBackground>
    );
  }

  /* ---------------- ERROR ---------------- */

  if (isError || !booking) {
    return (
      <PremiumBackground>
        <SafeAreaView className="flex-1 items-center justify-center px-luxury">
          <GlassCard className="p-6 items-center w-full bg-card shadow-sm">
            <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.error} />
            <Text className="text-text text-lg font-bold mt-4 mb-2">Booking Not Found</Text>
            <Text className="text-textSecondary text-sm text-center mb-6">
              This reservation may have been removed or is inaccessible.
            </Text>
            <Pressable
              onPress={() => router.back()}
              className="bg-primary px-8 py-3.5 rounded-full"
            >
              <Text className="text-background font-bold">Return to Dashboard</Text>
            </Pressable>
          </GlassCard>
        </SafeAreaView>
      </PremiumBackground>
    );
  }

  const statusConfig = getStatusConfig(booking.status || 'pending');

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* HEADER */}
        <AnimatedSection
          direction="down"
          className="px-luxury py-4 flex-row items-center justify-between border-b border-border bg-card"
        >
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center bg-border/30"
          >
            <Ionicons name="arrow-back" size={20} color={THEME.colors.text} />
          </Pressable>

          <Text className="text-text text-base font-extrabold uppercase tracking-widest">
            Booking Details
          </Text>

          <View className="w-10" />
        </AnimatedSection>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-luxury py-6 pb-16"
        >
          {/* STATUS BADGE */}
          <AnimatedSection delay={50} className="mb-5">
            <GlassCard className={`rounded-2xl border px-5 py-2 ${statusConfig.bg}`}>
              <View className="flex-row items-center justify-between">
                {/* Left Side */}
                <View className="flex-1">
                  <Text className={`text-text text-2xl font-bold ${statusConfig.text}`}>
                    {statusConfig.label}
                  </Text>

                  <Text className="text-textSecondary text-sm mt-2 font-semibold">
                    Ref: {booking.reference || booking.booking_id || 'REF-N/A'}
                  </Text>
                </View>

                {/* Right Icon */}
                <View className="w-14 h-14 rounded-full items-center justify-center ml-4">
                  <Ionicons name={statusConfig.icon} size={26} color={statusConfig.iconColor} />
                </View>
              </View>
            </GlassCard>
          </AnimatedSection>

          {/* YOUR INFORMATION */}
          <AnimatedSection delay={100} className="mb-5">
            <GlassCard className="bg-card shadow-sm rounded-3xl p-1">
              <Text className="text-textSecondary text-xs font-black uppercase tracking-wider mb-4">
                Your Information
              </Text>

              <View className="flex-row items-center gap-x-4">
                <Avatar
                  userId={booking.customer_user_id}
                  name={booking.customer_name || 'Client'}
                  size={48}
                />

                <View className="flex-1">
                  <Text className="text-text font-extrabold text-base">
                    {booking.customer_name || 'Client'}
                  </Text>

                  {booking.customer_email && (
                    <Text className="text-textSecondary text-xs mt-1" numberOfLines={1}>
                      Email: {booking.customer_email}
                    </Text>
                  )}

                  {booking.customer_phone && (
                    <Text className="text-textSecondary text-xs mt-0.5">
                      Phone: {booking.customer_phone}
                    </Text>
                  )}
                </View>

                {booking.customer_phone && (
                  <Pressable
                    onPress={() => handleCall(booking.customer_phone)}
                    className="p-3 rounded-xl"
                  >
                    <Ionicons name="call-outline" size={18} color={THEME.colors.primary} />
                  </Pressable>
                )}
              </View>
            </GlassCard>
          </AnimatedSection>

          {/* SALON PARTNER */}
          <AnimatedSection delay={150} className="mb-5">
            <GlassCard className="bg-card shadow-sm rounded-3xl p-1">
              <Text className="text-textSecondary text-xs font-black uppercase tracking-wider mb-4">
                Salon Partner
              </Text>

              <View className="flex-row items-center gap-x-4">
                <Avatar
                  userId={booking.business?.owner_user_id}
                  url={booking.business?.owner_image || booking.business?.avatar_url}
                  name={booking.business?.salon_name || 'CusOwn Salon'}
                  size={48}
                  type="business"
                />

                <View className="flex-1">
                  <Text className="text-text font-extrabold text-base">
                    {booking.business?.salon_name || 'CusOwn Salon'}
                  </Text>

                  {booking.business?.owner_name && (
                    <Text className="text-textSecondary text-xs mt-1">
                      Specialist: {booking.business.owner_name}
                    </Text>
                  )}

                  {booking.business?.whatsapp_number && (
                    <Text className="text-textSecondary text-xs mt-0.5">
                      Phone: {booking.business.whatsapp_number}
                    </Text>
                  )}
                </View>

                <View className="flex-row items-center">
                  {booking.business?.whatsapp_number && (
                    <Pressable
                      onPress={() => handleCall(booking.business?.whatsapp_number)}
                      className="p-3 rounded-xl mr-2"
                    >
                      <Ionicons name="call-outline" size={18} color={THEME.colors.primary} />
                    </Pressable>
                  )}

                  {whatsappUrl && (
                    <Pressable onPress={handleOpenWhatsapp} className="p-3 rounded-xl">
                      <Ionicons name="logo-whatsapp" size={19} color={THEME.colors.success} />
                    </Pressable>
                  )}
                </View>
              </View>

              {booking.business?.address && (
                <View className="mt-4 pt-4 border-t border-border flex-row gap-x-2">
                  <Ionicons
                    className="mt-0.5"
                    name="location-outline"
                    size={16}
                    color={THEME.colors.textSecondary}
                  />
                  <Text className="text-textSecondary text-xs flex-1 leading-relaxed">
                    {booking.business.address}
                  </Text>
                </View>
              )}
            </GlassCard>
          </AnimatedSection>

          {/* APPOINTMENT DETAILS */}
          <AnimatedSection delay={200} className="mb-5">
            <GlassCard className="bg-card shadow-sm rounded-3xl p-1">
              <Text className="text-textSecondary text-xs font-black uppercase tracking-wider mb-4">
                Appointment Details
              </Text>

              {/* Service + Price */}
              <View className="mb-4">
                <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider mb-1">
                  Service Selection
                </Text>
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-4">
                    <Text className="text-text font-extrabold text-base">
                      {booking.services && booking.services.length > 0
                        ? booking.services.map((s: { name?: string }) => s.name).join(', ')
                        : booking.service?.name || 'Service'}
                    </Text>
                    <Text className="text-textSecondary text-xs mt-1">
                      Duration: {booking.service?.duration || booking.total_duration_minutes || 30}{' '}
                      Minutes
                    </Text>
                  </View>
                  <Text className="text-primary text-2xl font-black tracking-tight">
                    ₹
                    {getBookingPrice(booking) % 1 === 0
                      ? getBookingPrice(booking).toFixed(0)
                      : getBookingPrice(booking).toFixed(2)}
                  </Text>
                </View>
              </View>

              <View className="h-px bg-border my-4" />

              {/* Date + Time */}
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider mb-1">
                    Scheduled Date
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons
                      className="mr-1"
                      name="calendar-outline"
                      size={14}
                      color={THEME.colors.textSecondary}
                    />
                    <Text className="text-text font-bold text-sm">
                      {formatBookingDate(booking.date)}
                    </Text>
                  </View>
                </View>

                <View className="flex-1 items-end">
                  <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider mb-1">
                    Arrival Slot
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons
                      className="mr-1"
                      name="time-outline"
                      size={14}
                      color={THEME.colors.textSecondary}
                    />
                    <Text className="text-text font-bold text-sm text-right">
                      {formatBookingTime(booking.time)}
                    </Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          </AnimatedSection>

          {/* BOOKING ACTIONS */}
          <AnimatedSection delay={250} className="mb-10">
            <GlassCard className="bg-card shadow-sm rounded-3xl p-1">
              <Text className="text-textSecondary text-xs font-black uppercase tracking-wider mb-4">
                Booking Actions
              </Text>

              <BookingActions
                booking={{
                  id: booking.id,
                  status: booking.status,
                  no_show: booking.no_show,
                  slot:
                    booking.slot ||
                    ({
                      date: booking.date,
                      start_time: booking.time,
                      end_time: booking.time,
                    } as Slot),
                  salon: booking.business,
                  business_id: booking.business_id,
                  services: booking.services,
                  service: booking.service,
                }}
                availableSlots={slots}
                cancellationMinHoursMs={cancellationMinHoursMs}
                onCancelled={handleCancelled}
                onRescheduled={handleRescheduled}
              />
            </GlassCard>
          </AnimatedSection>
        </ScrollView>
      </SafeAreaView>
    </PremiumBackground>
  );
}
