import { THEME } from '@/theme/theme';
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

    const salonImage =
      item.business?.owner_image ||
      item.business?.image_url ||
      item.salon?.owner_image ||
      item.salon?.image_url ||
      null;

    const displayPrice = getBookingPrice(item);

    return (
      <AnimatedSection delay={index * 30} direction="up" className="mb-3">
        <Pressable onPress={() => router.push(`/booking-detail/${item.id}`)}>
          <GlassCard className="bg-card   rounded-[22px] p-1 shadow-sm">
            {/* Top */}
            <View className="flex-row items-center">
              {/* Avatar */}
              <View className="relative">
                <Avatar
                  userId={item.business?.owner_user_id || item.salon?.owner_user_id}
                  name={salonName}
                  size={70}
                  className="w-[70px] h-[70px] rounded-full"
                />
              </View>

              {/* Right Content */}
              <View className="flex-1 ml-3 justify-center">
                {/* Name + Badge */}
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 text-text text-xl font-black mr-3" numberOfLines={1}>
                    {salonName}
                  </Text>

                  <Badge status={item.status as any} />
                </View>
                {/* Location */}
                <View className="flex-row items-center mt-1">
                  <Ionicons name="location-outline" size={13} color={THEME.colors.textSecondary} />

                  <Text className="text-textSecondary text-sm ml-1 flex-1" numberOfLines={1}>
                    {salonAddress}
                  </Text>
                </View>
              </View>
            </View>
            <View className="h-[1px] bg-border my-2" />

            {/* Service + Price */}
            <View className="flex-row items-start justify-between">
              {/* Service */}
              <View className="flex-1">
                <Text className="text-[11px] uppercase tracking-[2px] text-textSecondary font-black">
                  Service
                </Text>

                <Text className="text-text text-xl font-bold mt-1" numberOfLines={1}>
                  {item.services && item.services.length > 0
                    ? item.services.map((s: any) => s.name).join(', ')
                    : item.service?.name || 'Curated Session'}
                </Text>
              </View>

              {/* Price */}
              <View className="items-end">
                <Text className="text-text text-4xl font-black tracking-tight">
                  ₹{displayPrice % 1 === 0 ? displayPrice.toFixed(0) : displayPrice.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Bottom */}
            <View className="flex-row items-center justify-between pt-2 border-t border-border">
              {/* Date & Time */}
              <View className="flex-row items-center flex-1 mr-3">
                <Ionicons name="calendar-outline" size={15} color={THEME.colors.textSecondary} />

                <Text className="text-textSecondary text-sm font-semibold ml-1">
                  {formatBookingDate(item.date)} • {formatBookingTime(item.time)}
                </Text>
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
                  className="px-5 py-2 rounded-full"
                >
                  <Text className="text-text text-xs font-black uppercase tracking-[1.5px]">
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
          <Text className="text-textSecondary text-xs font-black uppercase tracking-[3px] mb-1">
            My Bookings
          </Text>
          <Text className="text-text text-3xl font-black tracking-tight">Your Appointments</Text>
        </View>

        {/* Custom Header Tab Bar */}
        <View className="flex-row px-luxury pt-3 pb-1 border-b border-border bg-card mt-2">
          {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => (
            <Pressable
              key={tab}
              className={`flex-1 py-3 items-center border-b-2 ${
                filter === tab ? 'border-primary' : 'border-transparent'
              }`}
              onPress={() => setFilter(tab)}
            >
              <Text
                className={`text-xs font-black uppercase tracking-wider ${
                  filter === tab ? 'text-primary' : 'text-textSecondary'
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
            <GlassCard className="items-center w-full bg-card p-6">
              <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.error} />
              <Text className="text-text text-lg font-bold mt-4 text-center">
                Failed to load your reservations
              </Text>
              <Pressable
                onPress={() => refetch()}
                className="mt-6 bg-error/10 border border-error/30 px-8 py-3 rounded-full"
              >
                <Text className="text-error font-bold">Retry Connection</Text>
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
                tintColor={THEME.colors.primary}
                colors={[THEME.colors.primary]}
              />
            }
            ListEmptyComponent={
              <AnimatedSection direction="up" className="items-center justify-center pt-24">
                <View className="w-20 h-20 rounded-full bg-border items-center justify-center mb-6  ">
                  <Ionicons
                    name="calendar-clear-outline"
                    size={36}
                    color={THEME.colors.textSecondary}
                  />
                </View>
                <Text className="text-text text-xl font-black uppercase tracking-tight mb-2">
                  No Bookings Found
                </Text>
                <Text className="text-textSecondary text-center px-8 text-sm leading-relaxed">
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
