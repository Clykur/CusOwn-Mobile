import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useBookingDetail } from '@/hooks/useBookings';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '@/lib/api-client';
import { logger, LogTag } from '@/utils/logger';
import { Avatar } from '@/components/Avatar';
import { supabase } from '@/lib/supabase';

function getStatusStyles(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'completed':
      return {
        bg: 'bg-black border-black',
        text: 'text-white',
        icon: 'checkmark-circle-outline' as const,
        iconColor: '#FFFFFF',
        label: 'Confirmed'
      };
    case 'pending':
      return {
        bg: 'bg-neutral-100 border-neutral-300',
        text: 'text-neutral-800',
        icon: 'time-outline' as const,
        iconColor: '#737373',
        label: 'Pending Approval'
      };
    case 'rejected':
      return {
        bg: 'bg-neutral-100 border-neutral-200',
        text: 'text-neutral-500',
        icon: 'close-circle-outline' as const,
        iconColor: '#A3A3A3',
        label: 'Rejected'
      };
    case 'cancelled':
      return {
        bg: 'bg-neutral-100 border-neutral-200',
        text: 'text-neutral-500',
        icon: 'ban-outline' as const,
        iconColor: '#A3A3A3',
        label: 'Cancelled'
      };
    case 'no_show':
      return {
        bg: 'bg-slate-50 border-slate-300',
        text: 'text-slate-600',
        icon: 'eye-off-outline' as const,
        iconColor: '#64748B',
        label: 'No-Show'
      };
    default:
      return {
        bg: 'bg-slate-50 border-slate-200',
        text: 'text-slate-700',
        icon: 'information-circle-outline' as const,
        iconColor: '#64748B',
        label: status.charAt(0).toUpperCase() + status.slice(1)
      };
  }
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: rawBooking, isLoading, isError } = useBookingDetail(id || '');
  const booking = rawBooking as any;

  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  const avatarUrl = useMemo(() => {
    const media = booking?.customer_profile?.profile_media;
    if (!media?.bucket_name || !media?.storage_path) return null;
    return supabase.storage.from(media.bucket_name).getPublicUrl(media.storage_path).data.publicUrl;
  }, [booking?.customer_profile?.profile_media]);

  // Retrieve WhatsApp link when booking loads
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
        const res = await apiClient.get(`/bookings/${targetBookingId}/whatsapp`);
        if (!cancelled && res?.whatsapp_url) {
          setWhatsappUrl(res.whatsapp_url);
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
  }, [booking?.id, booking?.booking_id, booking?.status]);

  const handleCall = (phoneNumber?: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch(() => {
        Alert.alert('Error', 'Unable to open phone dialer.');
      });
    }
  };

  const handleOpenWhatsapp = () => {
    if (whatsappUrl) {
      Linking.openURL(whatsappUrl).catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp application.');
      });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50">
        <SafeAreaView className="flex-1 px-luxury py-8">
          <LoadingSkeleton height={40} borderRadius={12} className="mb-6" />
          <LoadingSkeleton height={140} borderRadius={20} className="mb-6" />
          <LoadingSkeleton height={180} borderRadius={20} className="mb-6" />
          <LoadingSkeleton height={50} borderRadius={14} />
        </SafeAreaView>
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <View className="flex-1 bg-slate-50">
        <SafeAreaView className="flex-1 items-center justify-center px-luxury">
          <View className="p-6 items-center w-full bg-white border border-slate-200 rounded-2xl">
            <Ionicons name="alert-circle-outline" size={48} color="#000000" />
            <Text className="text-slate-900 text-lg font-bold mt-4 mb-2">Booking Not Found</Text>
            <Text className="text-slate-500 text-sm text-center mb-6">
              This reservation may have been removed or is inaccessible.
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-slate-900 px-8 py-3.5 rounded-full"
            >
              <Text className="text-white font-bold">Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const statusConfig = getStatusStyles(booking.status || 'pending');

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <AnimatedSection direction="down" className="px-luxury py-4 flex-row justify-between items-center border-b border-slate-200 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-200">
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-slate-900 text-base font-extrabold uppercase tracking-widest">
            Booking Details
          </Text>
          <View className="w-10" />
        </AnimatedSection>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-luxury py-6 pb-12"
        >
          {/* Status Indicator Card */}
          <AnimatedSection delay={50} className="mb-5">
            <View className={`rounded-2xl border px-5 py-4 ${statusConfig.bg} flex-row items-center justify-between`}>
              <View className="flex-1 mr-2">
                <Text className={`font-black text-lg ${statusConfig.text}`}>
                  {statusConfig.label}
                </Text>
                <Text className="text-slate-500 text-xs mt-1 font-semibold">
                  Ref: {booking.reference || booking.booking_id || 'REF-N/A'}
                </Text>
              </View>
              <Ionicons name={statusConfig.icon} size={28} color={statusConfig.iconColor} />
            </View>
          </AnimatedSection>

          {/* Customer / Client Details */}
          <AnimatedSection delay={100} className="mb-5">
            <View className="bg-white border border-slate-200 rounded-2xl p-5">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-4">
                Client Information
              </Text>
              <View className="flex-row items-center gap-x-4">
                <Avatar
                  url={avatarUrl}
                  name={booking.customer_name || 'Client Direct'}
                  size={48}
                  className="border border-slate-100"
                />
                <View className="flex-1">
                  <Text className="text-slate-900 font-extrabold text-base">
                    {booking.customer_name || 'Client Direct'}
                  </Text>
                  {booking.customer_email && (
                    <Text className="text-slate-500 text-xs mt-1" numberOfLines={1}>
                      Email: {booking.customer_email}
                    </Text>
                  )}
                  {booking.customer_phone && (
                    <Text className="text-slate-500 text-xs mt-0.5">
                      Phone: {booking.customer_phone}
                    </Text>
                  )}
                </View>
                {booking.customer_phone && (
                  <TouchableOpacity
                    onPress={() => handleCall(booking.customer_phone)}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl active:bg-slate-100"
                  >
                    <Ionicons name="call-outline" size={18} color="#0F172A" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </AnimatedSection>

          {/* Provider / Salon Details */}
          <AnimatedSection delay={150} className="mb-5">
            <View className="bg-white border border-slate-200 rounded-2xl p-5">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-4">
                Salon Partner Information
              </Text>
              <View className="flex-row items-center gap-x-4">
                <View className="w-12 h-12 rounded-full bg-slate-50 items-center justify-center border border-slate-100">
                  <Ionicons name="business" size={20} color="#64748B" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-extrabold text-base">
                    {booking.business?.salon_name || 'CusOwn Salon'}
                  </Text>
                  {booking.business?.owner_name && (
                    <Text className="text-slate-500 text-xs mt-1">
                      Specialist: {booking.business.owner_name}
                    </Text>
                  )}
                  {booking.business?.whatsapp_number && (
                    <Text className="text-slate-500 text-xs mt-0.5">
                      WhatsApp: {booking.business.whatsapp_number}
                    </Text>
                  )}
                </View>
                <View className="flex-row">
                  {booking.business?.whatsapp_number && (
                    <TouchableOpacity
                      onPress={() => handleCall(booking.business?.whatsapp_number)}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl active:bg-slate-100 mr-2"
                    >
                      <Ionicons name="call-outline" size={18} color="#0F172A" />
                    </TouchableOpacity>
                  )}
                  {whatsappUrl && (
                    <TouchableOpacity
                      onPress={handleOpenWhatsapp}
                      className="p-3 bg-neutral-100 border border-neutral-200 rounded-xl active:bg-neutral-200"
                    >
                      <Ionicons name="logo-whatsapp" size={18} color="#000000" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {booking.business?.address && (
                <View className="mt-4 pt-4 border-t border-slate-100 flex-row gap-x-2">
                  <Ionicons name="location-outline" size={16} color="#64748B" style={{ marginTop: 2 }} />
                  <Text className="text-slate-500 text-xs flex-1 leading-relaxed">
                    {booking.business.address}
                  </Text>
                </View>
              )}
            </View>
          </AnimatedSection>

          {/* Appointment Schedule & Service Package Details */}
          <AnimatedSection delay={200} className="mb-5">
            <View className="bg-white border border-slate-200 rounded-2xl p-5">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-4">
                Appointment details
              </Text>

              {/* Service details */}
              <View className="mb-4">
                <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                  Service Selection
                </Text>
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-4">
                    <Text className="text-slate-900 font-extrabold text-base">
                      {booking.services && booking.services.length > 0
                        ? booking.services.map((s: any) => s.name).join(', ')
                        : (booking.service?.name || 'Curated Service Package')}
                    </Text>
                    <Text className="text-slate-500 text-xs mt-1">
                      Duration: {booking.service?.duration || booking.total_duration_minutes || 30} Minutes
                    </Text>
                  </View>
                  <Text className="text-slate-900 font-black text-lg">
                    ₹{(booking.price || booking.service?.price || 0).toFixed(0)}
                  </Text>
                </View>
              </View>

              <View className="h-[1px] bg-slate-100 my-4" />

              {/* Schedule time */}
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                    Scheduled Date
                  </Text>
                  <View className="flex-row items-center gap-x-1.5">
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text className="text-slate-800 font-bold text-sm">
                      {booking.date}
                    </Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                    Arrival Slot
                  </Text>
                  <View className="flex-row items-center gap-x-1.5">
                    <Ionicons name="time-outline" size={14} color="#64748B" />
                    <Text className="text-black font-bold text-sm">
                      {booking.time}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </AnimatedSection>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
