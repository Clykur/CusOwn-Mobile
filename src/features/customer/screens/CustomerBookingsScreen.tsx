import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useBookings, useUpdateBookingStatus } from '@/hooks/useBookings';
import { getBookingPrice } from '@/services/api.service';
import { Badge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { formatBookingDate, formatBookingTime } from '@/utils/time';
import { Avatar } from '@/components/ui/Avatar';
import { isValidImageUrl } from '@/utils/image';

type BookingFilterType = 'upcoming' | 'completed' | 'cancelled';

export default function CustomerBookingsScreen() {
  const [filter, setFilter] = useState<BookingFilterType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const { data: bookings, isLoading, isError, refetch } = useBookings('Customer');

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    const now = dayjs();

    return bookings.filter((b: any) => {
      let status = (b.status || 'pending').toLowerCase();
      const bookingDateTime = dayjs(`${b.date} ${b.time}`);
      const bookingEndTime = bookingDateTime.add(b.duration || 60, 'minutes'); // Default to 60 mins if duration not present

      // Auto-categorize based on time
      if (now.isAfter(bookingEndTime)) {
        if (status === 'confirmed') {
          status = 'completed'; // Confirmed and time passed -> Completed
        } else if (status === 'pending') {
          status = 'cancelled'; // Pending and time passed -> Cancelled (auto-rejected)
        }
      }

      // Check for expired confirmed bookings
      if (status === 'confirmed') {
        if (bookingEndTime.isBefore(now)) {
          status = 'completed'; // Treat as completed if end time has passed
        }
      }

      if (filter === 'upcoming') {
        return status === 'pending' || status === 'confirmed';
      }
      if (filter === 'completed') {
        return status === 'completed';
      }
      if (filter === 'cancelled') {
        return (
          status === 'cancelled' ||
          status === 'rejected' ||
          status === 'expired' ||
          status === 'no_show'
        );
      }
      return true;
    });
  }, [bookings, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderBookingCard = ({ item, index }: { item: any; index: number }) => {
    const salonName = item.business?.salon_name || item.salon?.salon_name || 'Business Partner';

    const salonAddress = item.business?.address || item.salon?.address || 'Premium Suite';

    const salonImage = item.business?.owner_image || item.salon?.owner_image || null;

    const displayPrice = getBookingPrice(item);

    return (
      <AnimatedSection delay={index * 30} direction="up" className="mb-3">
        <Pressable onPress={() => router.push(`/booking-detail/${item.id}`)}>
          <GlassCard className="bg-white border border-slate-200 rounded-[22px] p-1 shadow-sm">
            {/* Top */}
            <View className="flex-row">
              {/* Image */}
              <View className="relative items-center justify-center">
                {/* Image */}
                {isValidImageUrl(salonImage) ? (
                  <Image
                    source={{ uri: salonImage }}
                    className="w-[74px] h-[74px] rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Avatar name={salonName} size={74} className="w-[74px] h-[74px] rounded-full" />
                )}

                {/* Status Badge */}
                <View className="absolute -top-2 self-center bg-white border border-slate-200 min-w-[64px] h-[22px] px-2 rounded-full items-center justify-center">
                  <Text
                    numberOfLines={1}
                    className="text-[8px] font-black uppercase text-slate-700"
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Right */}
              <View className="flex-1 ml-3 justify-between">
                {/* Salon */}
                <View>
                  <Text className="text-slate-900 text-[17px] font-black" numberOfLines={1}>
                    {salonName}
                  </Text>

                  <View className="flex-row items-center mt-0.5">
                    <Ionicons name="location-outline" size={11} color="#64748B" />

                    <Text className="text-slate-500 text-[11px] ml-1 flex-1" numberOfLines={1}>
                      {salonAddress}
                    </Text>
                  </View>
                </View>

                {/* Price */}
                <View className="mt-3">
                  <Text className="text-slate-900 text-[24px] font-black tracking-tight">
                    ₹{displayPrice % 1 === 0 ? displayPrice.toFixed(0) : displayPrice.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom */}
            <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <View className="flex-1 mr-3">
                {/* Service */}
                <Text className="text-[9px] uppercase tracking-[2px] text-slate-400 font-black mb-1">
                  Service
                </Text>

                <Text className="text-slate-900 text-[17px] font-bold" numberOfLines={1}>
                  {item.services && item.services.length > 0
                    ? item.services.map((s: any) => s.name).join(', ')
                    : item.service?.name || 'Curated Session'}
                </Text>

                {/* Date & Time */}
                <View className="flex-row items-center mt-2">
                  <Ionicons name="calendar-outline" size={12} color="#64748B" />

                  <Text className="text-slate-500 text-[11px] font-semibold ml-1">
                    {formatBookingDate(item.date)} • {formatBookingTime(item.time)}
                  </Text>
                </View>
              </View>

              {/* Rebook */}
              {(item.status === 'confirmed' ||
                item.status === 'completed' ||
                item.status === 'cancelled' ||
                item.status === 'rejected' ||
                item.status === 'no_show') && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();

                    const serviceIds =
                      item.services?.map((s: any) => s.id).join(',') || item.service?.id || '';

                    router.push({
                      pathname: '/(customer)/book/[id]',
                      params: {
                        id: item.business_id || item.business?.id || item.salon?.id || '',
                        serviceIds,
                      },
                    });
                  }}
                  className="border border-slate-500 px-4 py-2 rounded-full"
                >
                  <Text className="text-black text-[11px] font-black uppercase tracking-[1.5px]">
                    Rebook
                  </Text>
                </Pressable>
              )}
            </View>
          </GlassCard>
        </Pressable>
      </AnimatedSection>
    );
  };

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Cinematic Page Title */}
        <View className="px-luxury pt-5 pb-2">
          <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-1">
            My Bookings
          </Text>
          <Text className="text-slate-900 text-3xl font-black tracking-tight">
            Your Appointments
          </Text>
        </View>

        {/* Custom Header Tab Bar */}
        <View className="flex-row px-luxury pt-3 pb-1 border-b border-slate-100 bg-white/95 mt-2">
          {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => (
            <Pressable
              key={tab}
              className={`flex-1 py-3 items-center border-b-2 ${
                filter === tab ? 'border-accent-premium' : 'border-transparent'
              }`}
              onPress={() => setFilter(tab)}
            >
              <Text
                className={`text-xs font-black uppercase tracking-wider ${
                  filter === tab ? 'text-accent-premium' : 'text-slate-400'
                }`}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View className="flex-1 px-luxury pt-6">
            <LoadingSkeleton height={140} borderRadius={20} className="mb-4" />
            <LoadingSkeleton height={140} borderRadius={20} className="mb-4" />
            <LoadingSkeleton height={140} borderRadius={20} />
          </View>
        ) : isError ? (
          <View className="flex-1 justify-center items-center px-luxury">
            <GlassCard className="items-center w-full bg-white border border-slate-200 p-6">
              <Ionicons name="alert-circle-outline" size={48} color="#000000" />
              <Text className="text-slate-900 text-lg font-bold mt-4 text-center">
                Failed to load your reservations
              </Text>
              <Pressable
                onPress={() => refetch()}
                className="mt-6 bg-black border border-black px-8 py-3 rounded-full"
              >
                <Text className="text-white font-bold">Retry Connection</Text>
              </Pressable>
            </GlassCard>
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingCard}
            keyExtractor={(item, index) => item.id || `booking-${index}`}
            contentContainerClassName="px-luxury pt-6 pb-24"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#000000"
                colors={['#000000']}
              />
            }
            ListEmptyComponent={
              <AnimatedSection direction="up" className="items-center justify-center pt-24">
                <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-6 border border-slate-200">
                  <Ionicons name="calendar-clear-outline" size={36} color="#64748B" />
                </View>
                <Text className="text-slate-900 text-xl font-black uppercase tracking-tight mb-2">
                  No Bookings Found
                </Text>
                <Text className="text-slate-500 text-center px-8 text-sm leading-relaxed">
                  You have no {filter} booking schedules recorded under this account at the moment.
                </Text>
              </AnimatedSection>
            }
          />
        )}
      </SafeAreaView>
    </PremiumBackground>
  );
}
