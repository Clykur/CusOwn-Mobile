import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useBusinesses, useCategories } from '@/hooks/useBusinesses';
import { useBookings } from '@/hooks/useBookings';
import { useBookingStore } from '@/store/booking.store';
import { Business, BusinessCategory } from '@/types/business.types';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Avatar } from '@/components/Avatar';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { BusinessCard } from '@/components/customer/BusinessCard';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerHomeScreen() {
  const { user } = useAuthStore();
  const { data: businesses, isLoading, isError, refetch } = useBusinesses();
  const { data: categories } = useCategories();
  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useBookings('Customer');
  const { setBusiness } = useBookingStore();

  useFocusEffect(
    useCallback(() => {
      refetchBookings();
      refetch();
    }, [refetchBookings, refetch])
  );

  const totalCount = bookings?.length || 0;
  const upcomingCount = bookings?.filter((b: any) => b.status === 'pending' || b.status === 'confirmed').length || 0;
  const completedCount = bookings?.filter((b: any) => b.status === 'completed').length || 0;

  const handleBusinessPress = (business: Business) => {
    router.push(`/(customer)/browse/salons/${business.id}`);
  };

  const renderCategoryItem = ({ item, index }: { item: BusinessCategory; index: number }) => (
    <AnimatedSection delay={index * 50} direction="up">
      <Pressable
        className="w-[110px] p-4 rounded-3xl bg-white border border-slate-200 shadow-sm items-center justify-center gap-y-3"
        onPress={() => router.push({ pathname: '/(customer)/browse', params: { categoryId: item.value } })}
      >
        <View className="w-12 h-12 rounded-full bg-accent-premium/10 items-center justify-center">
          <Ionicons name={item.icon as any || 'business'} size={24} color="#000000" />
        </View>
        <Text className="text-slate-900 text-[11px] font-bold text-center uppercase tracking-wider">{item.label}</Text>
      </Pressable>
    </AnimatedSection>
  );

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-12"
        >
          {/* Header Banner */}
          <AnimatedSection direction="down" className="px-luxury pt-4 pb-6 flex-row justify-between items-center">
            <View>
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-1">Welcome to CusOwn</Text>

              <Text className="text-slate-900 text-3xl font-bold tracking-tight">
                {user?.user_metadata?.full_name?.split(' ')[0] || 'Curated Client'}
              </Text>
            </View>
            <Pressable onPress={() => router.push('/(customer)/profile')}>
              <Avatar name={user?.user_metadata?.full_name || 'User'} size={50} className="border-2 border-accent-premium/30" />
            </Pressable>
          </AnimatedSection>

          {/* Bookings Metrics Cards */}
          <AnimatedSection delay={50} direction="up" className="px-luxury mb-8">
            <View className="flex-row justify-between">

              {/* Total */}
              <GlassCard className="w-[31%] h-[110px] border border-slate-200/80 bg-white/90 shadow-sm items-center justify-center">
                <View className="flex-1 items-center justify-center">

                  <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider mb-2 text-center">
                    Total
                  </Text>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={24} width={40} borderRadius={8} />
                  ) : (
                    <Text className="text-slate-900 text-2xl font-black text-center">
                      {totalCount}
                    </Text>
                  )}

                </View>
              </GlassCard>

              {/* Upcoming */}
              <GlassCard className="w-[31%] h-[110px] border border-slate-200/80 bg-white/90 shadow-sm items-center justify-center">
                <View className="flex-1 items-center justify-center">

                  <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider mb-2 text-center">
                    Upcoming
                  </Text>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={24} width={40} borderRadius={8} />
                  ) : (
                    <Text className="text-slate-900 text-2xl font-black text-center">
                      {upcomingCount}
                    </Text>
                  )}

                </View>
              </GlassCard>

              {/* Completed */}
              <GlassCard className="w-[31%] h-[110px] border border-slate-200/80 bg-white/90 shadow-sm items-center justify-center">
                <View className="flex-1 items-center justify-center">

                  <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider mb-2 text-center">
                    Completed
                  </Text>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={24} width={40} borderRadius={8} />
                  ) : (
                    <Text className="text-slate-900 text-2xl font-black text-center">
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
                <Text className="text-slate-900 text-lg font-bold tracking-tight uppercase">
                  Categories
                </Text>
                <Pressable onPress={() => router.push('/(customer)/browse/categories')}>
                  <Text className="text-accent-premium font-bold text-sm">See All</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
              >
                {categories.map((item, index) => (
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
              <Text className="text-slate-900 text-lg font-bold tracking-tight uppercase">Your Favourite Salons</Text>
              <Pressable onPress={() => router.push('/(customer)/browse')}>
                <Text className="text-accent-premium font-bold text-sm">Browse All</Text>
              </Pressable>
            </View>

            {isLoading ? (
              <View className="px-luxury flex-row">
                <LoadingSkeleton width={280} height={260} borderRadius={24} className="mr-4" />
                <LoadingSkeleton width={280} height={260} borderRadius={24} />
              </View>
            ) : isError ? (
              <View className="px-luxury">
                <GlassCard className="items-center bg-white border border-slate-200">
                  <Text className="text-error font-medium mb-4">Failed to load featured businesses</Text>
                  <Pressable onPress={() => refetch()} className="bg-white px-6 py-2 rounded-full border border-slate-200">
                    <Text className="text-slate-900 font-bold">Retry</Text>
                  </Pressable>
                </GlassCard>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16, gap: 16 }}
              >
                {businesses?.slice(0, 5).map((item, index) => (
                  <View key={item.id || `biz-${index}`}>
                    <BusinessCard
                      item={item}
                      index={index}
                      onPress={() => handleBusinessPress(item)}
                    />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </PremiumBackground>
  );
}