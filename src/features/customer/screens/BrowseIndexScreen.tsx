import { THEME } from '@/theme/theme';
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useBusinesses, useCategories } from '@/hooks/useBusinesses';
import { Business, BusinessCategory } from '@/types/business.types';
import { useModal } from '@/hooks/useModal';

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';

import { Ionicons } from '@expo/vector-icons';
import { BrowseCard } from '@/features/customer/components/BrowseCard';

export default function CustomerBrowseScreen() {
  const { category, categoryId } = useLocalSearchParams<{
    category?: string;
    categoryId?: string;
  }>();

  const [searchQuery, setSearchQuery] = useState('');
  const { showModal } = useModal();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categoryId || category || null,
  );

  const [userLocation, setUserLocation] = useState<any>(null);

  const [locationLoading, setLocationLoading] = useState(false);

  const {
    data: businesses,
    isLoading,
    isError,
    refetch,
  } = useBusinesses(selectedCategoryId || undefined);

  const { data: categories } = useCategories();

  const [manualLocation, setManualLocation] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const getUserLocation = async () => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        showModal({
          variant: 'error',
          title: 'Location Permission',
          description: 'Location permission denied',
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = reverseGeocode?.[0];

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: address?.city || '',
        district: address?.district || '',
        region: address?.region || '',
        country: address?.country || '',
        postalCode: address?.postalCode || '',
        street: address?.street || '',
      });
    } catch (error: unknown) {
      const { logger, LogTag } = require('@/utils/logger');
      logger.error(LogTag.API, 'Location Error:', error);

      showModal({
        variant: 'error',
        title: 'Location Error',
        description: 'Failed to fetch your current location',
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;

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

  const filteredBusinesses = useMemo(() => {
    if (!businesses) return [];

    // Base filter: search query
    const searchFiltered = businesses.filter((business: Business) => {
      return (
        (business.salon_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (business.address || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    // Manual location search
    if (!useCurrentLocation) {
      return searchFiltered.filter((b: Business) => {
        return (
          !manualLocation || (b.address || '').toLowerCase().includes(manualLocation.toLowerCase())
        );
      });
    }

    // Current GPS location radius filtering
    const nearby = searchFiltered.filter((business: Business) => {
      if (userLocation && business.latitude && business.longitude) {
        const distance = calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          business.latitude,
          business.longitude,
        );

        // 10 KM radius
        return distance <= 10;
      }

      return false;
    });

    // Fallback: show general list if no nearby salons found
    if (nearby.length > 0) {
      return nearby;
    }

    return searchFiltered;
  }, [businesses, searchQuery, userLocation, manualLocation, useCurrentLocation]);

  const renderCategoryChip = ({
    item,
  }: {
    item: BusinessCategory | { value: string | null; label: string };
  }) => {
    const isActive = selectedCategoryId === item.value;

    return (
      <Pressable
        className={`px-6 py-2.5 rounded-full border mr-3 ${
          isActive ? 'bg-primary border-primary' : 'bg-card border-border shadow-sm'
        }`}
        onPress={() => setSelectedCategoryId(item.value)}
      >
        <Text
          className={`font-bold text-sm ${isActive ? 'text-background' : 'text-textSecondary'}`}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  const allCategories = useMemo(() => {
    const list: (BusinessCategory | { value: string | null; label: string })[] = [
      { value: null, label: 'All' },
    ];

    if (categories) {
      list.push(...categories);
    }

    return list;
  }, [categories]);

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-luxury pt-5 pb-2">
          <Text className="text-textSecondary text-xs font-black uppercase tracking-1 mb-1">
            Discover Salons
          </Text>
          <Text className="text-text text-3xl font-black tracking-tight">
            Explore Premium <Text className="text-primary">Services</Text>
          </Text>
        </View>
        {/* Search + Location */}
        <View className="px-luxury pt-2 pb-3">
          <View className="bg-card rounded-2xl h-14 px-4 flex-row items-center">
            {/* Search Icon */}
            <Ionicons name="search" size={20} color={THEME.colors.textSecondary} />

            {/* Input */}
            <TextInput
              className="flex-1 text-text text-base mx-3"
              placeholder="Search services, salons..."
              placeholderTextColor={THEME.colors.textSecondary}
              value={useCurrentLocation ? userLocation?.city || '' : searchQuery}
              onChangeText={(val) => {
                if (useCurrentLocation) {
                  setUseCurrentLocation(false);
                }

                setSearchQuery(val);
              }}
            />

            {/* Clear Button */}
            {searchQuery && !useCurrentLocation ? (
              <Pressable onPress={() => setSearchQuery('')} className="mr-2">
                <Ionicons name="close-circle" size={18} color={THEME.colors.textSecondary} />
              </Pressable>
            ) : null}

            {/* Target Button */}
            <Pressable
              onPress={() => {
                if (useCurrentLocation) {
                  setUseCurrentLocation(false);
                  setSearchQuery('');
                } else {
                  setUseCurrentLocation(true);
                  getUserLocation();
                }
              }}
              className="items-center justify-center"
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={THEME.colors.primary} />
              ) : (
                <Ionicons
                  name={useCurrentLocation ? 'locate' : 'locate-outline'}
                  size={20}
                  color={THEME.colors.primary}
                />
              )}
            </Pressable>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 px-luxury pt-4">
            <LoadingSkeleton height={110} borderRadius={20} className="mb-4" />

            <LoadingSkeleton height={110} borderRadius={20} className="mb-4" />

            <LoadingSkeleton height={110} borderRadius={20} />
          </View>
        ) : isError ? (
          <View className="flex-1 justify-center items-center px-luxury">
            <GlassCard className="items-center w-full bg-card  shadow-sm">
              <Ionicons name="cloud-offline-outline" size={48} color={THEME.colors.error} />

              <Text className="text-text text-lg font-bold mt-4 text-center">
                Failed to query live businesses
              </Text>

              <Pressable
                onPress={() => refetch()}
                className="mt-6 bg-error/10 border border-error/30 px-8 py-3 rounded-full"
              >
                <Text className="text-error font-bold">Retry Discovery</Text>
              </Pressable>
            </GlassCard>
          </View>
        ) : (
          <FlatList
            data={filteredBusinesses}
            renderItem={({ item, index }) => <BrowseCard item={item} index={index} />}
            keyExtractor={(item, index) => String(item.id || index)}
            contentContainerClassName="px-luxury pt-2 pb-12"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <AnimatedSection direction="up" className="items-center justify-center pt-24">
                <Ionicons name="search-outline" size={64} color={THEME.colors.textSecondary} />

                <Text className="text-text text-2xl font-bold mt-6 mb-2">No Results Found</Text>

                <Text className="text-textSecondary text-center px-12 text-base">
                  Try adjusting your search filters or queries to find your next curated experience.
                </Text>
              </AnimatedSection>
            }
          />
        )}
      </SafeAreaView>
    </PremiumBackground>
  );
}
