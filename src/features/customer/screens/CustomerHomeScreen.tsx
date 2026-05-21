import { THEME } from '@/theme/theme';
import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import dayjs from 'dayjs';
import { useAuthStore } from '@/store/auth.store';
import { useBusinesses, useCategories } from '@/hooks/useBusinesses';
import { useBookings } from '@/hooks/useBookings';
import { useBookingStore } from '@/store/booking.store';
import { Business, BusinessCategory } from '@/types/business.types';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Avatar } from '@/components/ui/Avatar';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { BusinessCard } from '@/features/customer/components/BusinessCard';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerHomeScreen() {
  const { user, profile, profileImageUrl } = useAuthStore();
  const { data: businesses, isLoading, isError, refetch } = useBusinesses();
  const { data: categories } = useCategories();
  const {
    data: bookings,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useBookings('Customer');
  const { setBusiness } = useBookingStore();

  useFocusEffect(
    useCallback(() => {
      refetchBookings();
      refetch();
    }, [refetchBookings, refetch]),
  );

  // Compute dynamic counts based on the same normalized booking status logic as bookings.tsx
  const normalizedBookings = useMemo(() => {
    if (!bookings) return [];
    const now = dayjs();
    return bookings.map((b: any) => {
      let status = (b.status || 'pending').toLowerCase();
      const bookingDateTime = dayjs(`${b.date} ${b.time}`);
      const bookingEndTime = bookingDateTime.add(b.duration || 60, 'minutes');

      // Auto-categorize based on time
      if (now.isAfter(bookingEndTime)) {
        if (status === 'confirmed') {
          status = 'completed';
        } else if (status === 'pending') {
          status = 'cancelled';
        }
      }

      // Check for expired confirmed bookings
      if (status === 'confirmed') {
        if (bookingEndTime.isBefore(now)) {
          status = 'completed';
        }
      }

      return {
        ...b,
        normalizedStatus: status,
      };
    });
  }, [bookings]);

  const favouriteSalons = useMemo(() => {
    if (!normalizedBookings || !businesses) return [];

    const completedBookings = normalizedBookings.filter(
      (b: any) => b.normalizedStatus === 'completed',
    );

    const sortedBookings = [...completedBookings].sort((a: any, b: any) => {
      const dateA = dayjs(`${a.date} ${a.time}`);
      const dateB = dayjs(`${b.date} ${b.time}`);
      return dateB.isAfter(dateA) ? 1 : -1;
    });

    const visitedBusinessIds = Array.from(
      new Set(sortedBookings.map((b: any) => b.business_id || b.business?.id).filter(Boolean)),
    );

    return visitedBusinessIds
      .map((id) => businesses.find((b) => b.id === id))
      .filter((b): b is Business => Boolean(b) && b!.suspended !== true && b!.deleted_at == null);
  }, [normalizedBookings, businesses]);

  const totalCount = normalizedBookings.length;
  const upcomingCount = normalizedBookings.filter(
    (b: any) => b.normalizedStatus === 'pending' || b.normalizedStatus === 'confirmed',
  ).length;
  const completedCount = normalizedBookings.filter(
    (b: any) =>
      b.normalizedStatus === 'completed' ||
      b.normalizedStatus === 'cancelled' ||
      b.normalizedStatus === 'rejected',
  ).length;

  const handleBusinessPress = (business: Business) => {
    router.push(`/(customer)/browse/salons/${business.id}`);
  };

  const renderCategoryItem = ({ item, index }: { item: BusinessCategory; index: number }) => {
    const iconName = typeof item.icon === 'string' && item.icon.length > 0 ? item.icon : 'business';

    return (
      <AnimatedSection delay={index * 50} direction="up">
        <Pressable
          className="w-[110px] rounded-[28px]  bg-card items-center justify-center py-5 px-3"
          style={{
            shadowColor: THEME.colors.background,
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 3,
          }}
          onPress={() =>
            router.push({
              pathname: '/(customer)/browse',
              params: {
                categoryId: item.value,
              },
            })
          }
        >
          <View className="w-14 h-14 rounded-full items-center justify-center mb-3 border border-primary/20 bg-primary/10">
            <Ionicons name="cut-outline" size={24} color={THEME.colors.primary} />
          </View>

          <Text
            numberOfLines={2}
            className="text-text text-xs font-black text-center uppercase tracking-wide"
          >
            {item.label}
          </Text>
        </Pressable>
      </AnimatedSection>
    );
  };

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-12">
          {/* Header Banner */}
          <AnimatedSection
            direction="down"
            className="px-luxury pt-4 pb-6 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-textSecondary text-xs font-black uppercase tracking-[3px] mb-1">
                Welcome to CusOwn
              </Text>

              <Text className="text-text text-3xl font-bold tracking-tight">
                {(profile?.full_name || user?.user_metadata?.full_name)?.split(' ')[0] ||
                  'Curated Client'}
              </Text>
            </View>
            <Pressable onPress={() => router.push('/(customer)/profile')}>
              <Avatar
                userId={user?.id}
                name={profile?.full_name || user?.user_metadata?.full_name || 'User'}
                size={50}
                className="border-2 border-primary/30"
              />
            </Pressable>
          </AnimatedSection>

          {/* Bookings Metrics Cards */}
          <AnimatedSection delay={50} direction="up" className="px-luxury mb-8">
            <View className="flex-row justify-between">
              {/* Total */}
              <GlassCard className="w-[31%] h-[110px]  bg-card shadow-sm items-center justify-center">
                <View className="flex-1 items-center justify-center">
                  <Text className="text-textSecondary text-xs font-black uppercase tracking-base mb-2 text-center">
                    Total
                  </Text>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={24} width={40} borderRadius={8} />
                  ) : (
                    <Text className="text-text text-2xl font-black text-center">{totalCount}</Text>
                  )}
                </View>
              </GlassCard>

              {/* Upcoming */}
              <GlassCard className="w-[31%] h-[110px]  bg-card shadow-sm items-center justify-center">
                <View className="flex-1 items-center justify-center">
                  <Text className="text-textSecondary text-xs font-black uppercase tracking-base mb-2 text-center">
                    Upcoming
                  </Text>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={24} width={40} borderRadius={8} />
                  ) : (
                    <Text className="text-text text-2xl font-black text-center">
                      {upcomingCount}
                    </Text>
                  )}
                </View>
              </GlassCard>

              {/* Completed */}
              <GlassCard className="w-[31%] h-[110px]  bg-card shadow-sm items-center justify-center">
                <View className="flex-1 items-center justify-center">
                  <Text className="text-textSecondary text-xs font-black uppercase tracking-base mb-2 text-center">
                    Finished
                  </Text>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={24} width={40} borderRadius={8} />
                  ) : (
                    <Text className="text-text text-2xl font-black text-center">
                      {completedCount}
                    </Text>
                  )}
                </View>
              </GlassCard>
            </View>
          </AnimatedSection>

          {/* Categories Section */}
          {categories && categories.length > 0 && (
            <View className="mb-10">
              <View className="flex-row justify-between items-center px-luxury mb-5">
                <Text className="text-text text-lg font-bold tracking-tight uppercase">
                  Categories
                </Text>
                <Pressable onPress={() => router.push('/(customer)/browse/categories')}>
                  <Text className="text-primary font-bold text-sm">See All</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
              >
                {categories
                  .filter(
                    (item) =>
                      item.label?.toLowerCase() === 'salon' ||
                      item.value?.toLowerCase() === 'salon',
                  )
                  .map((item, index) => (
                    <View key={item.value || `cat-${index}`}>
                      {renderCategoryItem({ item, index })}
                    </View>
                  ))}
              </ScrollView>
            </View>
          )}
          {/* Featured Businesses Section */}
          <View>
            <View className="flex-row justify-between items-center px-luxury mb-6">
              <Text className="text-text text-lg font-bold tracking-tight uppercase">
                Your Favourite Salons
              </Text>
              <Pressable onPress={() => router.push('/(customer)/browse')}>
                <Text className="text-primary font-bold text-sm">Browse All</Text>
              </Pressable>
            </View>

            {isLoading || bookingsLoading ? (
              <View className="px-luxury flex-row">
                <LoadingSkeleton width={280} height={260} borderRadius={24} className="mr-4" />
                <LoadingSkeleton width={280} height={260} borderRadius={24} />
              </View>
            ) : isError ? (
              <View className="px-luxury">
                <GlassCard className="items-center bg-card ">
                  <Text className="text-error font-medium mb-4">Failed to load salons</Text>
                  <Pressable onPress={() => refetch()} className="bg-card px-6 py-2 rounded-full ">
                    <Text className="text-text font-bold">Retry</Text>
                  </Pressable>
                </GlassCard>
              </View>
            ) : favouriteSalons.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16, gap: 16 }}
              >
                {favouriteSalons.map((item, index) => (
                  <View key={item.id || `fav-${index}`}>
                    <BusinessCard
                      item={item}
                      index={index}
                      onPress={() => handleBusinessPress(item)}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View className="px-luxury">
                <GlassCard className="p-6  bg-card shadow-sm items-center">
                  <Ionicons
                    name="calendar-outline"
                    size={36}
                    color={THEME.colors.textSecondary}
                    className="mb-2"
                  />
                  <Text className="text-text font-extrabold text-sm text-center">
                    No Salons Visited Yet
                  </Text>
                  <Text className="text-textSecondary text-xs text-center mt-1 mb-4 px-4">
                    Your recently visited salons will show up here. Let's find your first salon!
                  </Text>
                  <Pressable
                    onPress={() => router.push('/(customer)/browse')}
                    className="bg-primary py-2.5 px-5 rounded-2xl"
                  >
                    <Text className="text-background font-extrabold text-xs">Explore Salons</Text>
                  </Pressable>
                </GlassCard>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </PremiumBackground>
  );
}
