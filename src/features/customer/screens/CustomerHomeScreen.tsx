import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { BusinessCard } from '@/features/customer/components/BusinessCard';
import { DealCard } from '@/features/customer/components/DealCard';
import { HomeSearchBar } from '@/features/customer/components/HomeSearchBar';
import { NearbySalonCard } from '@/features/customer/components/NearbySalonCard';
import { TrendingServiceCard } from '@/features/customer/components/TrendingServiceCard';
import { useBookings } from '@/hooks/useBookings';
import { useBusinesses, useCategories } from '@/hooks/useBusinesses';
import { useDashboard } from '@/hooks/useDashboard';
import { useLocation } from '@/hooks/useLocation';
import { useAuthStore } from '@/store/auth.store';
import { THEME } from '@/theme/theme';

import type { FlashDeal } from '@/features/customer/components/DealCard';
import type { TrendingService } from '@/features/customer/components/TrendingServiceCard';
import type { Booking } from '@/types/booking.types';
import type { Business } from '@/types/business.types';

// New Components

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function CustomerHomeScreen() {
  const { user, profile } = useAuthStore();
  const { data: businesses, refetch } = useBusinesses();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: categories } = useCategories();
  const {
    data: bookings,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useBookings('Customer');

  const [searchQuery, setSearchQuery] = useState('');

  const {
    userLocation,
    locationLoading,
    useCurrentLocation,
    setUseCurrentLocation,
    getUserLocation,
  } = useLocation();

  // New Dashboard Hook using real coordinates if available
  const {
    nearbySalons,
    isLoadingNearby,
    refetchNearby,
    trendingServices,
    isLoadingTrending,
    flashDeals,
    isLoadingDeals,
  } = useDashboard(
    useCurrentLocation ? userLocation?.latitude : null,
    useCurrentLocation ? userLocation?.longitude : null,
  );

  const filteredNearbySalons = useMemo(() => {
    let list = nearbySalons;

    if (useCurrentLocation && userLocation) {
      list = list.filter((salon) => {
        if (salon.distance_km !== undefined) return salon.distance_km <= 10;
        const b = businesses?.find((b) => b.id === salon.id);
        if (!b?.latitude || !b?.longitude) return false;
        return (
          calculateDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            b.latitude,
            b.longitude,
          ) <= 10
        );
      });
    }

    // Fallback if nearby filtering leaves us with nothing
    if (list.length === 0 && businesses && businesses.length > 0) {
      list = businesses.slice(0, 5); // Use general businesses as fallback, max 5 items
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (salon) =>
          salon.salon_name?.toLowerCase().includes(query) ||
          salon.address?.toLowerCase().includes(query),
      );
    }
    return list;
  }, [nearbySalons, searchQuery, useCurrentLocation, userLocation, businesses]);

  const enrichedTrendingServices = useMemo(() => {
    if (!trendingServices) return [];
    return trendingServices.map((service: TrendingService) => {
      const business = businesses?.find((b) => b.id === service.business_id);
      return {
        ...service,
        business: business || service.business || null,
        salon_name: business?.salon_name || service.salon_name,
        rating_avg: business?.rating_avg || service.rating_avg,
      };
    });
  }, [trendingServices, businesses]);

  const filteredTrendingServices = useMemo(() => {
    let list = enrichedTrendingServices;

    if (useCurrentLocation && userLocation) {
      list = list.filter((service) => {
        const b = service.business;
        if (!b?.latitude || !b?.longitude) return false;
        return (
          calculateDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            b.latitude,
            b.longitude,
          ) <= 10
        );
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (service) =>
          service.name?.toLowerCase().includes(query) ||
          service.salon_name?.toLowerCase().includes(query),
      );
    }
    return list.sort((a, b) => {
      const ratingA = a.rating_avg ? Number(a.rating_avg) : 0;
      const ratingB = b.rating_avg ? Number(b.rating_avg) : 0;
      return ratingB - ratingA;
    });
  }, [enrichedTrendingServices, searchQuery, useCurrentLocation, userLocation]);

  const enrichedFlashDeals = useMemo(() => {
    if (!flashDeals) return [];
    return flashDeals.map((deal: FlashDeal) => {
      const business = businesses?.find((b) => b.id === deal.business_id);
      return {
        ...deal,
        business: business || deal.business || null,
        salon_name: business?.salon_name || deal.salon_name,
      };
    });
  }, [flashDeals, businesses]);

  const filteredFlashDeals = useMemo(() => {
    let list = enrichedFlashDeals;

    if (useCurrentLocation && userLocation) {
      list = list.filter((deal) => {
        const b = deal.business;
        if (!b?.latitude || !b?.longitude) return false;
        return (
          calculateDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            b.latitude,
            b.longitude,
          ) <= 10
        );
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (deal) =>
          deal.title?.toLowerCase().includes(query) ||
          deal.salon_name?.toLowerCase().includes(query),
      );
    }
    return list;
  }, [enrichedFlashDeals, searchQuery, useCurrentLocation, userLocation]);

  useFocusEffect(
    useCallback(() => {
      refetchBookings();
      refetch();
      refetchNearby();
    }, [refetchBookings, refetch, refetchNearby]),
  );

  useEffect(() => {
    // Auto-fetch location only once when home screen mounts
    if (!useCurrentLocation && !userLocation) {
      const fetchInitialLocation = async () => {
        const success = await getUserLocation(true); // silent fetch
        if (success) {
          setUseCurrentLocation(true);
        }
      };
      fetchInitialLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedBookings = useMemo(() => {
    if (!bookings) return [];
    const now = dayjs();
    return bookings.map((b: Booking) => {
      let status = (b.status || 'pending').toLowerCase();
      const bookingDateTime = dayjs(`${b.date} ${b.time}`);
      const bookingEndTime = bookingDateTime.add(b.duration || 60, 'minutes');

      if (now.isAfter(bookingEndTime)) {
        if (status === 'confirmed') status = 'completed';
        else if (status === 'pending') status = 'cancelled';
      }
      if (status === 'confirmed' && bookingEndTime.isBefore(now)) {
        status = 'completed';
      }

      return { ...b, normalizedStatus: status };
    });
  }, [bookings]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const upcomingBooking = useMemo(() => {
    return normalizedBookings.find(
      (b: Booking & { normalizedStatus?: string }) =>
        b.normalizedStatus === 'pending' || b.normalizedStatus === 'confirmed',
    );
  }, [normalizedBookings]);

  const favouriteSalons = useMemo(() => {
    if (!normalizedBookings || !businesses) return [];
    const completedBookings = normalizedBookings.filter(
      (b: Booking & { normalizedStatus?: string }) => b.normalizedStatus === 'completed',
    );
    const sortedBookings = [...completedBookings].sort((a: Booking, b: Booking) => {
      const dateA = dayjs(`${a.date} ${a.time}`);
      const dateB = dayjs(`${b.date} ${b.time}`);
      return dateB.isAfter(dateA) ? 1 : -1;
    });

    const visitedBusinessIds = Array.from(
      new Set(sortedBookings.map((b: Booking) => b.business_id || b.business?.id).filter(Boolean)),
    );
    return visitedBusinessIds
      .map((id) => businesses.find((b) => b.id === id))
      .filter((b): b is Business => Boolean(b) && b!.suspended !== true && b!.deleted_at == null);
  }, [normalizedBookings, businesses]);

  const filteredFavouriteSalons = useMemo(() => {
    let list = favouriteSalons;

    if (useCurrentLocation && userLocation) {
      list = list.filter((salon) => {
        if (!salon?.latitude || !salon?.longitude) return false;
        return (
          calculateDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            salon.latitude,
            salon.longitude,
          ) <= 10
        );
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (salon) =>
          salon.salon_name?.toLowerCase().includes(query) ||
          salon.address?.toLowerCase().includes(query),
      );
    }
    return list;
  }, [favouriteSalons, searchQuery, useCurrentLocation, userLocation]);

  const handleBusinessPress = (id: string) => {
    router.push(`/(customer)/browse/salons/${id}`);
  };

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-12">
          {/* 1. GREETING + SEARCH */}
          <AnimatedSection
            direction="down"
            className="px-luxury pt-4 pb-2 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-textSecondary text-xs font-black uppercase tracking-0.5 mb-1">
                {dayjs().hour() < 12
                  ? 'Good Morning'
                  : dayjs().hour() < 18
                    ? 'Good Afternoon'
                    : 'Good Evening'}
              </Text>
              <Text className="text-primary text-3xl font-bold tracking-tight">
                {(profile?.full_name || user?.user_metadata?.full_name)?.split(' ')[0] ||
                  user?.email?.split('@')[0] ||
                  'User'}
              </Text>
            </View>
            <View className="items-center justify-center">
              <Ionicons name="notifications-outline" size={20} color={THEME.colors.text} />
            </View>
          </AnimatedSection>

          <HomeSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            useCurrentLocation={useCurrentLocation}
            setUseCurrentLocation={setUseCurrentLocation}
            userLocation={
              userLocation as unknown as { latitude: number; longitude: number; city?: string }
            }
            locationLoading={locationLoading}
            onLocate={getUserLocation}
          />
          {/* 2. LIMITED-TIME DEALS */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center px-luxury mb-4">
              <Text className="text-text text-lg font-bold tracking-tight uppercase">
                Limited-Time Deals
              </Text>
            </View>
            {isLoadingDeals ? (
              <View className="px-luxury flex-row">
                <LoadingSkeleton width={280} height={120} borderRadius={24} className="mr-4" />
                <LoadingSkeleton width={280} height={120} borderRadius={24} />
              </View>
            ) : filteredFlashDeals.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                {filteredFlashDeals.map((deal, index) => (
                  <DealCard
                    key={deal.id}
                    item={deal as FlashDeal}
                    index={index}
                    onPress={() => handleBusinessPress(deal.business_id)}
                  />
                ))}
              </ScrollView>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                {useCurrentLocation ? (
                  <Text className="text-textSecondary text-sm my-4">No nearby deals found.</Text>
                ) : (
                  (businesses && businesses.length > 0 ? businesses.slice(0, 3) : []).map(
                    (business, index) => {
                      const dummyTitles = [
                        '50% Off Premium Haircut',
                        'Flat ₹500 Off on Facials',
                        'Buy 1 Get 1 Beard Trim',
                      ];
                      const dummyDiscounts = ['50% OFF', '₹500 OFF', 'BOGO'];
                      return (
                        <DealCard
                          key={`dummy-${business.id}`}
                          item={
                            {
                              id: `dummy-${business.id}`,
                              business_id: business.id,
                              salon_name: business.salon_name,
                              title: dummyTitles[index] || 'Special Discount',
                              discount_text: dummyDiscounts[index] || 'OFFER',
                              expires_at: dayjs().add(24, 'hours').toISOString(),
                            } as FlashDeal
                          }
                          index={index}
                          onPress={() => handleBusinessPress(business.id)}
                        />
                      );
                    },
                  )
                )}
              </ScrollView>
            )}
          </View>

          {/* 3. NEARBY AVAILABLE NOW */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center px-luxury mb-4">
              <Text className="text-text text-lg font-bold tracking-tight uppercase">
                Available Nearby Now
              </Text>
              <Pressable onPress={() => router.push('/(customer)/browse')}>
                <Text className="text-primary font-bold text-sm">See All</Text>
              </Pressable>
            </View>
            {isLoadingNearby ? (
              <View className="px-luxury flex-row">
                <LoadingSkeleton width={260} height={150} borderRadius={28} className="mr-4" />
                <LoadingSkeleton width={260} height={150} borderRadius={28} />
              </View>
            ) : filteredNearbySalons.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                {filteredNearbySalons.map((salon, index) => (
                  <NearbySalonCard
                    key={salon.id}
                    item={salon}
                    index={index}
                    onPress={() => handleBusinessPress(salon.id)}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text className="text-textSecondary px-luxury text-sm">
                {useCurrentLocation ? 'No nearby salons found.' : 'No available salons nearby.'}
              </Text>
            )}
          </View>

          {/* 4. RECENTLY BOOKED */}
          {filteredFavouriteSalons.length > 0 && (
            <View className="mb-8">
              <View className="flex-row justify-between items-center px-luxury mb-4">
                <Text className="text-text text-lg font-bold tracking-tight uppercase">
                  Recently Booked
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                {filteredFavouriteSalons.map((item, index) => (
                  <BusinessCard
                    key={item.id}
                    item={item}
                    index={index}
                    onPress={() => handleBusinessPress(item.id)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* 5. TRENDING SERVICES */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center px-luxury mb-4">
              <Text className="text-text text-lg font-bold tracking-tight uppercase">
                Trending Services
              </Text>
            </View>
            {isLoadingTrending ? (
              <View className="px-luxury flex-row">
                <LoadingSkeleton width={180} height={140} borderRadius={24} className="mr-4" />
                <LoadingSkeleton width={180} height={140} borderRadius={24} />
              </View>
            ) : filteredTrendingServices.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                {filteredTrendingServices.map((service, index) => (
                  <TrendingServiceCard
                    key={service.id}
                    item={service}
                    index={index}
                    onPress={() =>
                      service.business_id ? handleBusinessPress(service.business_id) : {}
                    }
                  />
                ))}
              </ScrollView>
            ) : (
              <Text className="text-textSecondary px-luxury text-sm">
                {useCurrentLocation
                  ? 'No nearby trending services.'
                  : 'Trending services will appear here.'}
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </PremiumBackground>
  );
}
