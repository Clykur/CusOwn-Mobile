import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Linking, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { useBusinessDetail } from '@/hooks/useBusinesses';
import { useBookingStore } from '@/store/booking.store';
import { Service } from '@/types/business.types';
import { apiService } from '@/services/api.service';

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
            })
          );
          setPhotos(urls.filter(Boolean));
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
          <ActivityIndicator size="large" color="#000000" />
          <Text className="text-slate-500 font-medium mt-4 font-semibold">Loading salon details...</Text>
        </View>
      </PremiumBackground>
    );
  }

  if (error || !business) {
    return (
      <PremiumBackground>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-slate-900 text-xl font-bold mt-4 text-center">Salon Not Found</Text>
          <Text className="text-slate-500 text-center mt-2 mb-6">We couldn't retrieve the details for this business.</Text>
          <PremiumButton title="Go Back" onPress={() => router.back()} className="w-48 h-12" />
        </View>
      </PremiumBackground>
    );
  }

  const handleSelectService = (service: Service) => {
    setLocalSelectedServices(prev => {
      const exists = prev.some(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
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

  const handleContactWhatsApp = () => {
    if (business.whatsapp_number) {
      const formattedNum = business.whatsapp_number.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${formattedNum}`).catch(() => {
        Linking.openURL(`tel:${business.whatsapp_number}`);
      });
    }
  };

  const isShopCurrentlyOpen = () => {
    const toMinutes = (t: any) => {
      if (!t || typeof t !== 'string') return null;
      const s = t.trim().toUpperCase();
      const match = s.match(/^([0-9]{1,2}):([0-9]{2})\s*(AM|PM)?$/);
      if (!match) return null;
      let hours = Number(match[1]);
      const minutes = Number(match[2]);
      const ampm = match[3];

      if (ampm) {
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      }

      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
      return hours * 60 + minutes;
    };

    const start = toMinutes(business.opening_time);
    const end = toMinutes(business.closing_time);
    if (start == null || end == null) return true;

    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();

    // handle overnight shifts
    if (end < start) {
      return current >= start || current < end;
    }

    return current >= start && current < end;
  };

  const shopIsOpen = isShopCurrentlyOpen();

  // Normalise reviews. Backend may return either:
  // - customer: { full_name } and/or created_at
  // - customer_name (already anonymized) and/or created_at
  const hasRealReviews = !!(reviewsData?.reviews && reviewsData.reviews.length > 0);
  const reviewsList = hasRealReviews
    ? (reviewsData.reviews as any[]).map((r: any) => {
      const rawRating = typeof r.rating === 'number' ? r.rating : Number(r.rating);
      const rating = Number.isFinite(rawRating) && rawRating > 0 ? rawRating : 0;

      const name =
        r.customer?.full_name ||
        r.customer_name ||
        r.name ||
        'Guest User';

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
      };
    })
    : [];


  // Ratings calculation based on API response
  const displayRatingAvg = Number(business.rating_avg).toFixed(1);
  const displayReviewCount = business.review_count;

  // Compute total selected details
  const totalSelectedPrice = localSelectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const totalSelectedDuration = localSelectedServices.reduce((sum, s) => sum + (Number(s.duration) || 30), 0);

  return (
    <PremiumBackground>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Hero Header */}
        <View className="h-[360px] w-full relative">
          <Avatar url={business.image_url} name={business.salon_name} size={400} className="w-full h-full object-cover" />
          <View className="absolute inset-0 bg-black/30" />

          <Pressable
            onPress={() => router.back()}
            className="absolute top-16 left-6 w-12 h-12 rounded-full bg-black/45 border border-white/20 items-center justify-center shadow-lg"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
        </View>

        <View className="px-luxury -mt-10">
          <AnimatedSection direction="up">
            <GlassCard className="p-6 border border-slate-200 bg-white/95 shadow-sm rounded-3xl">
              {/* Name and Rating */}
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 mr-4">
                  <Text className="text-slate-900 text-3xl font-extrabold tracking-tight mb-1">
                    {business.salon_name}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="location-outline" size={16} color="#64748B" />
                    <Text className="text-slate-500 ml-1.5 text-sm" numberOfLines={1}>
                      {business.address || 'Address not listed'}
                    </Text>
                  </View>
                </View>
                <View className="items-end bg-black px-3 py-1.5 rounded-xl flex-row items-center shadow-sm">
                  <Ionicons
                    name={business.rating_avg > 0 ? "star" : "star-outline"}
                    size={14}
                    color={business.rating_avg > 0 ? "#EAB308" : "#94A3B8"}
                  />
                  <Text className="text-white font-bold ml-1 text-sm">{displayRatingAvg}</Text>
                  {displayReviewCount > 0 ? (
                    <Text className="text-slate-400 text-xs ml-1">({displayReviewCount})</Text>
                  ) : null}
                </View>
              </View>

              {/* Status & Hours */}
              <View className="flex-row items-center mb-6 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                <Ionicons name="time-outline" size={18} color="#0F172A" />
                <Text className="text-slate-700 font-bold ml-2 text-xs">
                  Hours: {business.opening_time || '09:00 AM'} - {business.closing_time || '09:00 PM'}
                </Text>
                <View
                  className="w-1.5 h-1.5 rounded-full ml-auto mr-1"
                  style={{ backgroundColor: shopIsOpen ? '#22C55E' : '#94A3B8' }}
                />
                <Text className={shopIsOpen ? 'text-green-600 font-bold text-xs' : 'text-slate-400 font-bold text-xs'}>
                  {shopIsOpen ? 'Open Now' : 'Shop Closed'}
                </Text>
              </View>

              {/* Owner Info & Contact Row */}
              <View className="border-t border-slate-100 pt-6 mb-6">
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Owner Info</Text>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-slate-900 items-center justify-center border border-slate-200 shadow-sm mr-3">
                      <Text className="text-white font-bold text-base">
                        {business.owner_name ? business.owner_name.charAt(0) : 'O'}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-slate-900 font-bold text-base">{business.owner_name || 'Salon Owner'}</Text>
                      <Text className="text-slate-500 text-xs">Verified Business Partner</Text>
                    </View>
                  </View>

                  {business.whatsapp_number ? (
                    <Pressable
                      onPress={handleContactWhatsApp}
                      className="flex-row items-center bg-green-550 border border-green-600 px-4 py-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="white" />
                      <Text className="text-white font-bold ml-1.5 text-xs">WhatsApp</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {/* Badges */}
              <View className="flex-row gap-x-3 mb-4">
                <View className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-2xl items-center">
                  <Ionicons name="sparkles-outline" size={20} color="#000000" />
                  <Text className="text-slate-800 font-bold mt-1.5 text-[10px] text-center">Top Quality</Text>
                </View>
                <View className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-2xl items-center">
                  <Ionicons name="people-outline" size={20} color="#000000" />
                  <Text className="text-slate-800 font-bold mt-1.5 text-[10px] text-center">Top Artists</Text>
                </View>
                <View className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-2xl items-center">
                  <Ionicons name="shield-checkmark-outline" size={20} color="#000000" />
                  <Text className="text-slate-800 font-bold mt-1.5 text-[10px] text-center">Certified</Text>
                </View>
              </View>
            </GlassCard>
          </AnimatedSection>
        </View>

        {/* Services Section */}
        <View className="px-luxury mt-8">
          <Text className="text-slate-900 text-xl font-bold mb-4 tracking-tight uppercase">Select Services</Text>
          {loadingExtra ? (
            <View className="bg-white border border-slate-200 rounded-3xl p-8 items-center justify-center">
              <ActivityIndicator size="small" color="#000000" />
              <Text className="text-slate-500 text-xs mt-2 font-bold">Scanning services...</Text>
            </View>
          ) : services.length === 0 ? (
            <View className="bg-white border border-slate-200 rounded-3xl p-6 items-center">
              <Ionicons name="cut-outline" size={32} color="#94A3B8" />
              <Text className="text-slate-500 text-sm mt-2 text-center">No services currently listed for this salon.</Text>
            </View>
          ) : (
            <View className="gap-y-3">
              {services.map((service: any) => {
                const isSelected = localSelectedServices.some(s => s.id === service.id);
                return (
                  <Pressable
                    key={service.id}
                    onPress={() => handleSelectService(service)}
                    className={`bg-white border p-5 rounded-3xl flex-row items-center transition-all ${isSelected ? 'border-black bg-slate-50 shadow-sm' : 'border-slate-200'
                      }`}
                  >
                    <View className="flex-1 mr-4">
                      <Text className="text-slate-900 font-bold text-lg mb-1">{service.name}</Text>
                      {service.description ? (
                        <Text className="text-slate-500 text-sm mb-2" numberOfLines={2}>
                          {service.description}
                        </Text>
                      ) : null}
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={14} color="#64748B" />
                        <Text className="text-slate-500 text-xs font-semibold ml-1 mr-4">
                          {service.duration} mins
                        </Text>
                        <Ionicons name="cash-outline" size={14} color="#64748B" />
                        <Text className="text-slate-700 text-xs font-bold ml-1">
                          ₹{service.price}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`w-7 h-7 rounded-full border items-center justify-center ${isSelected ? 'bg-black border-black' : 'border-slate-300 bg-white'
                        }`}
                    >
                      {isSelected ? <Ionicons name="checkmark" size={16} color="white" /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Gallery Section */}
        <View className="px-luxury mt-10">
          <Text className="text-slate-900 text-xl font-bold mb-4 tracking-tight uppercase">Photos & Vibe</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-4">
            {photos.map((url, i) => (
              <View key={i} className="w-56 h-40 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm mr-3">
                <Image source={{ uri: url }} className="w-full h-full object-cover" />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Reviews Section */}
        <View className="px-luxury mt-10">
          <Text className="text-slate-900 text-xl font-bold mb-4 tracking-tight uppercase">Recent Reviews</Text>
          <View className="gap-y-3">
            {reviewsList.length > 0 ? (
              reviewsList.map((rev: any) => (
                <View key={rev.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-slate-900 font-bold text-sm">{rev.name}</Text>
                    <Text className="text-slate-400 text-xs">{rev.date}</Text>
                  </View>
                  <View className="flex-row items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < Math.round(rev.rating) ? 'star' : 'star-outline'}
                        size={14}
                        color="#EAB308"
                        className="mr-0.5"
                      />
                    ))}
                    <Text className="text-slate-700 font-bold text-xs ml-1.5">
                      {Number.isFinite(rev.rating) ? rev.rating.toFixed(1) : '0.0'}
                    </Text>
                  </View>
                  {rev.comment ? (
                    <Text className="text-slate-600 text-sm leading-relaxed">{rev.comment}</Text>
                  ) : null}
                </View>
              ))
            ) : (
              <View className="bg-white border border-slate-200 rounded-3xl p-6 items-center">
                <Ionicons name="chatbox-ellipses-outline" size={32} color="#94A3B8" />
                <Text className="text-slate-500 text-sm mt-2 text-center font-medium">No reviews or ratings yet.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Booking Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white/80 border-t border-slate-100 px-6 pt-4 pb-10 flex-row justify-between items-center shadow-lg">
        <View className="flex-1 mr-4">
          <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            {localSelectedServices.length > 0 ? `${localSelectedServices.length} Selected` : 'Booking Flow'}
          </Text>
          <Text className="text-slate-900 font-extrabold text-base" numberOfLines={1}>
            {localSelectedServices.length > 0
              ? localSelectedServices.map(s => s.name).join(', ')
              : 'Choose Service(s)'}
          </Text>
          {localSelectedServices.length > 0 ? (
            <Text className="text-black font-extrabold text-lg">
              ₹{totalSelectedPrice} <Text className="text-slate-500 font-semibold text-xs">/ {totalSelectedDuration}m</Text>
            </Text>
          ) : (
            <Text className="text-slate-500 font-bold text-xs">First service selected by default</Text>
          )}
        </View>

        <PremiumButton
          title={localSelectedServices.length > 0 ? "Book Slot" : "Reserve Slot"}
          onPress={handleBookNow}
          className="flex-1 h-14 bg-black rounded-2xl"
        />
      </View>
    </PremiumBackground>
  );
}