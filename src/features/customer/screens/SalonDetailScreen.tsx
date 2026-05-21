import { THEME } from '@/theme/theme';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { useBusinessDetail } from '@/hooks/useBusinesses';
import { useBookingStore } from '@/store/booking.store';
import { Service } from '@/types/business.types';
import { apiService } from '@/services/api.service';
import { getShopStatus } from '@/utils/time';
import { isValidImageUrl } from '@/utils/image';

export default function SalonDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { data: business, isLoading: businessLoading, error } = useBusinessDetail(id as string);
  const { setBusiness, setSelectedServices } = useBookingStore();
  const [localSelectedServices, setLocalSelectedServices] = useState<Service[]>([]);

  // States for API fetched data
  const [services, setServices] = useState<any[]>([]);
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  useEffect(() => {
    if (!business?.id) return;

    const fetchExtraData = async () => {
      try {
        setLoadingExtra(true);

        // 1. Fetch real public services
        const svc = await apiService.getPublicServices(business.id);
        setServices(svc);

        // 2. Fetch real reviews
        const rev = await apiService.getReviews(business.id);
        setReviewsData(rev);

        // 3. Fetch real media and signed URLs
        const media = await apiService.getBusinessMedia(business.id);
        const items = media?.items || [];
        if (items.length > 0) {
          const urls = await Promise.all(
            items.map(async (item: any) => {
              try {
                const signed = await apiService.getSignedUrl(item.id);
                return signed?.url || null;
              } catch {
                return null;
              }
            }),
          );
          setPhotos(urls.filter((u): u is string => isValidImageUrl(u)));
        } else {
          setPhotos([]);
        }
      } catch (err) {
        console.error('Error fetching salon details extra data:', err);
      } finally {
        setLoadingExtra(false);
      }
    };

    fetchExtraData();
  }, [business?.id]);

  if (businessLoading) {
    return (
      <PremiumBackground>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text className="text-textSecondary font-medium mt-4 font-semibold">
            Loading salon details...
          </Text>
        </View>
      </PremiumBackground>
    );
  }

  if (error || !business) {
    return (
      <PremiumBackground>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color={THEME.colors.error} />
          <Text className="text-text text-xl font-bold mt-4 text-center">Salon Not Found</Text>
          <Text className="text-textSecondary text-center mt-2 mb-6">
            We couldn't retrieve the details for this business.
          </Text>
          <PremiumButton title="Go Back" onPress={() => router.back()} className="w-48 h-12" />
        </View>
      </PremiumBackground>
    );
  }

  // Guard: suspended or soft-deleted businesses must not be accessible
  if (business.suspended === true || business.deleted_at != null) {
    return (
      <PremiumBackground>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="ban-outline" size={64} color={THEME.colors.textSecondary} />
          <Text className="text-text text-xl font-bold mt-4 text-center">Business Unavailable</Text>
          <Text className="text-textSecondary text-center mt-2 mb-6">
            This business is no longer available for bookings.
          </Text>
          <PremiumButton
            title="Browse Salons"
            onPress={() => router.replace('/(customer)/browse')}
            className="w-48 h-12"
          />
        </View>
      </PremiumBackground>
    );
  }

  const handleSelectService = (service: Service) => {
    setLocalSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleBookNow = () => {
    setBusiness(business);
    // Set selected services in booking store
    if (localSelectedServices.length > 0) {
      setSelectedServices(localSelectedServices);
    } else if (services.length > 0) {
      // Default to first service if none selected
      setSelectedServices([services[0]]);
    }

    router.push(`/(customer)/book/${business.id}`);
  };
  const handleCall = (phoneNumber?: string) => {
    if (!phoneNumber) return;

    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to open phone dialer.');
    });
  };

  const handleContactWhatsApp = () => {
    if (business.whatsapp_number) {
      const formattedNum = business.whatsapp_number.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${formattedNum}`).catch(() => {
        Linking.openURL(`tel:${business.whatsapp_number}`);
      });
    }
  };

  const shopStatus = getShopStatus(business?.opening_time, business?.closing_time);
  const shopIsOpen = shopStatus.isOpen;

  // Normalise reviews. Backend may return either:
  // - customer: { full_name } and/or created_at
  // - customer_name (already anonymized) and/or created_at
  const hasRealReviews = !!(reviewsData?.reviews && reviewsData.reviews.length > 0);
  const reviewsList = hasRealReviews
    ? (reviewsData.reviews as any[]).map((r: any) => {
        const rawRating = typeof r.rating === 'number' ? r.rating : Number(r.rating);
        const rating = Number.isFinite(rawRating) && rawRating > 0 ? rawRating : 0;

        const name = r.customer?.full_name || r.customer_name || r.name || 'Guest User';

        const comment = (r.comment ?? '') as string;

        const createdAt = r.created_at || r.date;
        const date = createdAt
          ? new Date(createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Recently';

        return {
          id: r.id,
          name,
          rating,
          comment,
          date,
          user_id: r.user_id,
          avatar_url: r.customer?.avatar_url,
        };
      })
    : [];

  // Ratings calculation based on API response
  const displayRatingAvg =
    business.rating_avg && Number(business.rating_avg) > 0
      ? Number(business.rating_avg).toFixed(1)
      : 'New';
  const displayReviewCount = business.review_count;

  // Compute total selected details
  const totalSelectedPrice = localSelectedServices.reduce(
    (sum, s) => sum + (Number(s.price) || 0),
    0,
  );
  const totalSelectedDuration = localSelectedServices.reduce(
    (sum, s) => sum + (Number(s.duration) || 30),
    0,
  );

  return (
    <PremiumBackground>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Hero Header */}
        <View className="h-[360px] w-full relative">
          <Avatar
            userId={business.owner_user_id}
            name={business.salon_name}
            size={400}
            className="w-full h-full"
          />
          <View className="absolute inset-0 bg-black/30" />

          <Pressable
            onPress={() => router.back()}
            className="absolute top-16 left-6 w-12 h-12 rounded-full items-center justify-center shadow-lg"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
        </View>

        <View className="px-luxury -mt-10">
          <AnimatedSection direction="up">
            <GlassCard className="p-6  bg-card shadow-sm rounded-3xl">
              {/* Name and Rating */}
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 mr-4">
                  <Text className="text-text text-3xl font-extrabold tracking-tight mb-1">
                    {business.salon_name}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={THEME.colors.textSecondary}
                    />
                    <Text className="text-textSecondary ml-1.5 text-sm" numberOfLines={1}>
                      {business.address || 'Address not listed'}
                    </Text>
                  </View>
                </View>
                <View className="items-end bg-border px-3 py-1.5 rounded-xl flex-row items-center shadow-sm">
                  <Ionicons
                    name={
                      business.rating_avg && Number(business.rating_avg) > 0
                        ? 'star'
                        : 'star-outline'
                    }
                    size={14}
                    color={
                      business.rating_avg && Number(business.rating_avg) > 0
                        ? THEME.colors.warning
                        : THEME.colors.textSecondary
                    }
                  />
                  <Text className="text-text font-bold ml-1 text-sm">{displayRatingAvg}</Text>
                  {displayReviewCount > 0 ? (
                    <Text className="text-textSecondary text-xs ml-1">({displayReviewCount})</Text>
                  ) : null}
                </View>
              </View>

              {/* Status & Hours */}
              <View className="flex-row items-center mb-2 border-t border-border pt-2 rounded-2xl">
                <Ionicons name="time-outline" size={18} color={THEME.colors.primary} />
                <Text className="text-text font-bold ml-2 text-xs">
                  Hours: {business.opening_time || '09:00 AM'} -{' '}
                  {business.closing_time || '09:00 PM'}
                </Text>
                <View
                  className="w-1.5 h-1.5 rounded-full ml-auto mr-1"
                  style={{
                    backgroundColor: shopIsOpen ? THEME.colors.success : THEME.colors.error,
                  }}
                />
                <Text
                  className={
                    shopIsOpen
                      ? 'text-green-600 font-bold text-xs'
                      : 'text-rose-500 font-bold text-xs'
                  }
                >
                  {shopIsOpen ? 'Open Now' : 'Closed'}
                </Text>
              </View>

              {/* Owner Info & Contact Row */}
              <View className="border-t border-border pt-6">
                <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider mb-3">
                  Owner Info
                </Text>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Avatar
                      userId={business.owner_user_id}
                      name={business.owner_name || 'Owner'}
                      size={42}
                      className="w-[42px] h-[42px] rounded-full mr-3  shadow-sm"
                    />
                    <View>
                      <Text className="text-text font-bold text-base">
                        {business.owner_name || 'Salon Owner'}
                      </Text>
                      <Text className="text-textSecondary text-xs">Verified Business Partner</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleCall(business.whatsapp_number)}
                    className="flex-row items-center px-4 py-2.5 rounded-full shadow-sm bg-primary/10"
                  >
                    <Ionicons name="call-outline" size={24} color={THEME.colors.primary} />
                  </Pressable>
                  {business.whatsapp_number ? (
                    <Pressable
                      onPress={handleContactWhatsApp}
                      className="flex-row items-center px-4 py-2.5 rounded-full shadow-sm bg-primary/10"
                    >
                      <Ionicons name="logo-whatsapp" size={25} color="#25D366" />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </GlassCard>
          </AnimatedSection>
        </View>

        {/* Services Section */}
        <View className="px-luxury mt-8">
          <Text className="text-text text-xl font-bold mb-4 tracking-tight uppercase">
            Services
          </Text>
          {loadingExtra ? (
            <View className="bg-card  rounded-3xl p-8 items-center justify-center">
              <ActivityIndicator size="small" color={THEME.colors.primary} />
              <Text className="text-textSecondary text-xs mt-2 font-bold">
                Scanning services...
              </Text>
            </View>
          ) : services.length === 0 ? (
            <View className="bg-card  rounded-3xl p-6 items-center">
              <Ionicons name="construct-outline" size={32} color={THEME.colors.textSecondary} />
              <Text className="text-textSecondary text-sm mt-2 text-center">
                No services currently listed for this salon.
              </Text>
            </View>
          ) : (
            <View className="gap-y-3">
              {services.map((service: any) => {
                const isSelected = localSelectedServices.some((s) => s.id === service.id);
                return (
                  <Pressable
                    key={service.id}
                    onPress={() => handleSelectService(service)}
                    className={`bg-card border p-5 rounded-3xl flex-row items-center ${
                      isSelected ? 'border-primary bg-primary/10 shadow-sm' : 'border-border'
                    }`}
                  >
                    <View className="flex-1 mr-4">
                      <Text className="text-text font-bold text-lg mb-1">{service.name}</Text>
                      {service.description ? (
                        <Text className="text-textSecondary text-sm mb-2" numberOfLines={2}>
                          {service.description}
                        </Text>
                      ) : null}
                      <View className="flex-row items-center">
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={THEME.colors.textSecondary}
                        />
                        <Text className="text-textSecondary text-xs font-semibold ml-1 mr-4">
                          {service.duration} mins
                        </Text>
                        <Ionicons
                          name="cash-outline"
                          size={14}
                          color={THEME.colors.textSecondary}
                        />
                        <Text className="text-text text-xs font-bold ml-1">₹{service.price}</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => {
                        handleBookNow();
                      }}
                      className="bg-primary px-4 py-2 rounded-xl items-center justify-center"
                    >
                      <Text className="text-background font-bold text-xs">Book</Text>
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Gallery Section */}
        {photos.length > 0 && (
          <View className="px-luxury mt-10">
            <Text className="text-text text-xl font-bold mb-4 tracking-tight uppercase">
              Photos
            </Text>

            {/* 2 Column Grid */}
            <View className="flex-row flex-wrap justify-between">
              {photos.map((url, i) => (
                <View
                  key={i}
                  className="w-[48%] h-44 bg-card rounded-3xl  overflow-hidden shadow-sm mb-4"
                >
                  <Image source={{ uri: url }} className="w-full h-full" resizeMode="cover" />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews Section */}
        <View className="px-luxury mt-10">
          <Text className="text-text text-xl font-bold mb-4 tracking-tight uppercase">
            Recent Reviews
          </Text>
          <View className="gap-y-3">
            {reviewsList.length > 0 ? (
              reviewsList.map((rev: any) => (
                <View key={rev.id} className="bg-card  rounded-3xl p-5 shadow-sm">
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center flex-1 gap-x-3">
                      <Avatar userId={rev.user_id} name={rev.name} size={36} className="" />
                      <Text className="text-text font-bold text-sm flex-1" numberOfLines={1}>
                        {rev.name}
                      </Text>
                    </View>
                    <Text className="text-textSecondary text-xs ml-2">{rev.date}</Text>
                  </View>
                  <View className="flex-row items-center mb-2">
                    <View className="flex-row items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= Math.round(rev.rating) ? 'star' : 'star-outline'}
                          size={16}
                          color="#FACC15"
                          style={{ marginRight: 2 }}
                        />
                      ))}
                    </View>

                    <Text className="text-amber-500 font-extrabold text-xs ml-2">
                      {Number.isFinite(rev.rating) ? rev.rating.toFixed(1) : '0.0'}
                    </Text>
                  </View>
                  {rev.comment ? (
                    <Text className="text-textSecondary text-sm leading-relaxed">
                      {rev.comment}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <View className="bg-card  rounded-3xl p-6 items-center">
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={32}
                  color={THEME.colors.textSecondary}
                />
                <Text className="text-textSecondary text-sm mt-2 text-center font-medium">
                  No reviews or ratings yet.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Booking Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-base_colors.white border-t border-border px-6 pt-4 pb-10 flex-row justify-between items-center shadow-lg">
        <View className="flex-1 mr-4">
          <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider">
            {localSelectedServices.length > 0
              ? `${localSelectedServices.length} Selected`
              : 'Booking Flow'}
          </Text>
          <Text className="text-text font-extrabold text-base" numberOfLines={1}>
            {localSelectedServices.length > 0
              ? localSelectedServices.map((s) => s.name).join(', ')
              : 'Choose Service(s)'}
          </Text>
          {localSelectedServices.length > 0 ? (
            <Text className="text-primary font-extrabold text-lg">
              ₹{totalSelectedPrice}{' '}
              <Text className="text-textSecondary font-semibold text-xs">
                / {totalSelectedDuration}m
              </Text>
            </Text>
          ) : (
            <Text className="text-textSecondary font-bold text-xs">
              First service selected by default
            </Text>
          )}
        </View>

        <PremiumButton
          title={localSelectedServices.length > 0 ? 'Book Slot' : 'Reserve Slot'}
          onPress={handleBookNow}
          className="flex-1 h-14 bg-primary rounded-2xl"
        />
      </View>
    </PremiumBackground>
  );
}
