import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useBookings, useUpdateBookingStatus } from '@/hooks/useBookings';
import { getBookingPrice } from '@/services/api.service';
import { Badge } from '@/components/Badge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

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
        return status === 'cancelled' || status === 'rejected' || status === 'expired' || status === 'no_show';
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
    const salonImage = item.business?.image_url ||
      item.business?.cover_photo_url ||
      item.salon?.image_url ||
      item.salon?.cover_photo_url ||
      null;

    const displayPrice = getBookingPrice(item);

    return (
      <AnimatedSection delay={index * 50} direction="up" className="mb-4">
        <Pressable
          onPress={() => router.push(`/booking-detail/${item.id}`)}
        >
          <GlassCard className="border-slate-200/80 bg-white/95 shadow-sm p-2 rounded-luxury">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center flex-1">
                <View className="flex-1">
                  <Text className="text-slate-900 font-extrabold text-base" numberOfLines={1}>
                    {salonName}
                  </Text>
                  <Text className="text-slate-500 text-xs mt-0.5" numberOfLines={1}>
                    {salonAddress}
                  </Text>
                </View>
              </View>
              <Badge status={item.status} />
            </View>

            <View className="h-[0.5px] bg-slate-100 mb-4" />

            <View className="gap-y-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                  <Text className="text-slate-900 text-lg font-black tracking-tight" numberOfLines={1}>
                    {item.services && item.services.length > 0
                      ? item.services.map((s: any) => s.name).join(', ')
                      : (item.service?.name || 'Curated Session')}
                  </Text>
                  <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">
                    Booking ID: {item.booking_id || item.reference || '—'}
                  </Text>
                </View>
                <View className="bg-black px-3.5 py-1.5 rounded-xl">
                  <Text className="text-white font-black text-sm">
                    ₹{displayPrice % 1 === 0 ? displayPrice.toFixed(0) : displayPrice.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-x-2 mt-1">
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                <Text className="text-slate-500 text-xs font-semibold">
                  {item.date} • {item.time}
                </Text>
              </View>


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
          <Text className="text-slate-900 text-3xl font-black tracking-tight">Your Appointments</Text>
        </View>

        {/* Custom Header Tab Bar */}
        <View className="flex-row px-luxury pt-3 pb-1 border-b border-slate-100 bg-white/95 mt-2">
          {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => (
            <Pressable
              key={tab}
              className={`flex-1 py-3 items-center border-b-2 ${filter === tab ? 'border-accent-premium' : 'border-transparent'
                }`}
              onPress={() => setFilter(tab)}
            >
              <Text className={`text-xs font-black uppercase tracking-wider ${filter === tab ? 'text-accent-premium' : 'text-slate-400'
                }`}>
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
                <Text className="text-slate-900 text-xl font-black uppercase tracking-tight mb-2">No Bookings Found</Text>
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