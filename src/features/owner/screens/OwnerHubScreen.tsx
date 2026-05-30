import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
  Share,
  TextInput,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { ServicesManagement } from '@/features/owner/components/ServicesManagement';
import { useModal } from '@/hooks/useModal';
import { apiService } from '@/services/api.service';
import { THEME } from '@/theme/theme';

import type { Business } from '@/types/business.types';

type TabType = 'overview' | 'services' | 'photos' | 'schedule' | 'reviews';

export default function ManageHubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { showModal } = useModal();

  // QR Code State

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [qrCode, setQrCode] = useState<string>('');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingQR, setLoadingQR] = useState(false);

  // Photos State
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Downtime State (Holidays & Closures)
  const [holidays, setHolidays] = useState<
    { id: string; holiday_name?: string; holiday_date?: string }[]
  >([]);
  const [closures, setClosures] = useState<
    { id: string; start_date?: string; end_date?: string; reason?: string }[]
  >([]);
  const [loadingDowntime, setLoadingDowntime] = useState(false);

  // Holiday Form State
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [submittingHoliday, setSubmittingHoliday] = useState(false);

  // Closure Form State
  const [closureStart, setClosureStart] = useState('');
  const [closureEnd, setClosureEnd] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [submittingClosure, setSubmittingClosure] = useState(false);

  // Reviews State
  const [reviewData, setReviewData] = useState<{
    rating_avg: number;
    review_count: number;
    reviews: {
      id?: string;
      rating: number;
      created_at?: string;
      comment?: string;
      [key: string]: unknown;
    }[];
  }>({
    rating_avg: 0,
    review_count: 0,
    reviews: [],
  });
  const [loadingReviews, setLoadingReviews] = useState(false);

  const qrRef = useRef<{ toDataURL: (callback: (data: string) => void) => void } | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!business) return;

    if (activeTab === 'overview') {
      // eslint-disable-next-line react-hooks/immutability
      fetchQR();
    } else if (activeTab === 'photos') {
      // eslint-disable-next-line react-hooks/immutability
      fetchPhotos();
    } else if (activeTab === 'schedule') {
      // eslint-disable-next-line react-hooks/immutability
      fetchDowntime();
    } else if (activeTab === 'reviews') {
      // eslint-disable-next-line react-hooks/immutability
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, business]);

  const fetchBusiness = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await apiService.getBusinessById(id);
      setBusiness(data);
    } catch (err) {
      console.error('Failed to fetch business:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleDownloadQR = async () => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        showModal({
          variant: 'error',
          title: 'Permission Required',
          description: 'Please allow media access to save QR code.',
        });
        return;
      }

      qrRef.current?.toDataURL(async (data: string) => {
        const fileUri = FileSystem.documentDirectory + `business-qr-${business?.id}.png`;

        await FileSystem.writeAsStringAsync(fileUri, data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await MediaLibrary.saveToLibraryAsync(fileUri);

        showModal({
          variant: 'success',
          title: 'Success',
          description: 'QR Code downloaded successfully.',
        });
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      showModal({
        variant: 'error',
        title: 'Error',
        description: 'Failed to download QR code.',
      });
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBusiness();
    if (activeTab === 'overview') await fetchQR();
    else if (activeTab === 'photos') await fetchPhotos();
    else if (activeTab === 'schedule') await fetchDowntime();
    else if (activeTab === 'reviews') await fetchReviews();
    setRefreshing(false);
  };

  // 1. Fetch QR Identity
  const fetchQR = async () => {
    if (!business) return;
    // We now generate QR Code locally based on the production booking URL.
    setLoadingQR(false);
  };

  // 2. Fetch Photos
  const fetchPhotos = async () => {
    if (!business) return;
    setLoadingPhotos(true);
    try {
      const res = await apiService.getBusinessMedia(business.id);
      const items = res?.items || [];
      const fetched = await Promise.all(
        items.map(async (item: { id: string; url?: string | null }) => {
          try {
            const signedRes = await apiService.getSignedUrl(item.id);
            return { id: item.id, url: signedRes?.url || item.url || '' };
          } catch {
            return { id: item.id, url: item.url || '' };
          }
        }),
      );
      setPhotos(fetched);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  // Upload Photo
  const handleAddPhoto = async () => {
    if (!business) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showModal({
          variant: 'error',
          title: 'Permission Denied',
          description: 'Permission to access photos is required.',
        });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      setUploadingPhoto(true);

      const filename = asset.uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      await apiService.uploadBusinessMedia(business.id, {
        uri: asset.uri,
        name: filename,
        type,
      });

      showModal({
        variant: 'success',
        title: 'Success',
        description: 'Photo added to portfolio',
      });
      fetchPhotos();
    } catch (err: unknown) {
      showModal({
        variant: 'error',
        title: 'Error',
        description: (err instanceof Error ? err.message : String(err)) || 'Failed to upload image',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Delete Photo
  const handleDeletePhoto = (mediaId: string) => {
    showModal({
      variant: 'delete',
      title: 'Remove Photo',
      description: 'Are you sure you want to remove this image from portfolio?',
      dismissible: true,
      actions: [
        {
          label: 'Delete',
          variant: 'danger',
          onPress: async () => {
            try {
              await apiService.deleteMedia(mediaId);
              setPhotos((prev) => prev.filter((p) => p.id !== mediaId));
              showModal({
                variant: 'success',
                title: 'Success',
                description: 'Photo removed successfully',
              });
            } catch (err: unknown) {
              showModal({
                variant: 'error',
                title: 'Error',
                description:
                  (err instanceof Error ? err.message : String(err)) || 'Failed to delete image',
              });
            }
          },
        },
      ],
    });
  };

  // 3. Fetch Downtime
  const fetchDowntime = async () => {
    if (!business) return;
    setLoadingDowntime(true);
    try {
      const [holidaysData, closuresData] = await Promise.all([
        apiService.getBusinessHolidays(business.id),
        apiService.getBusinessClosures(business.id),
      ]);
      setHolidays(
        (holidaysData || []) as { id: string; holiday_name?: string; holiday_date?: string }[],
      );
      setClosures(
        (closuresData || []) as {
          id: string;
          start_date?: string;
          end_date?: string;
          reason?: string;
        }[],
      );
    } catch (err) {
      console.error('Failed to fetch downtime:', err);
    } finally {
      setLoadingDowntime(false);
    }
  };

  // Add Holiday
  const handleAddHoliday = async () => {
    if (!business) return;
    if (!holidayDate) {
      showModal({
        variant: 'error',
        title: 'Error',
        description: 'Please enter a holiday date',
      });
      return;
    }
    setSubmittingHoliday(true);
    try {
      await apiService.addBusinessHoliday(business.id, {
        holiday_date: holidayDate,
        holiday_name: holidayName || 'Holiday',
      });
      setHolidayDate('');
      setHolidayName('');
      showModal({
        variant: 'success',
        title: 'Success',
        description: 'Holiday added successfully',
      });
      fetchDowntime();
    } catch (err: unknown) {
      showModal({
        variant: 'error',
        title: 'Error',
        description: (err instanceof Error ? err.message : String(err)) || 'Failed to add holiday',
      });
    } finally {
      setSubmittingHoliday(false);
    }
  };

  // Delete Holiday
  const handleDeleteHoliday = (holidayId: string) => {
    if (!business) return;
    showModal({
      variant: 'delete',
      title: 'Remove Holiday',
      description: 'Are you sure you want to delete this holiday?',
      dismissible: true,
      actions: [
        {
          label: 'Delete',
          variant: 'danger',
          onPress: async () => {
            try {
              await apiService.deleteBusinessHoliday(business.id, holidayId);
              setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
              showModal({
                variant: 'success',
                title: 'Success',
                description: 'Holiday deleted',
              });
            } catch (err: unknown) {
              showModal({
                variant: 'error',
                title: 'Error',
                description:
                  (err instanceof Error ? err.message : String(err)) || 'Failed to delete holiday',
              });
            }
          },
        },
      ],
    });
  };

  // Add Closure
  const handleAddClosure = async () => {
    if (!business) return;
    if (!closureStart || !closureEnd) {
      showModal({
        variant: 'error',
        title: 'Error',
        description: 'Please enter start and end dates',
      });
      return;
    }
    setSubmittingClosure(true);
    try {
      await apiService.addBusinessClosure(business.id, {
        start_date: closureStart,
        end_date: closureEnd,
        reason: closureReason || 'Downtime',
      });
      setClosureStart('');
      setClosureEnd('');
      setClosureReason('');
      showModal({
        variant: 'success',
        title: 'Success',
        description: 'Downtime closure added successfully',
      });
      fetchDowntime();
    } catch (err: unknown) {
      showModal({
        variant: 'error',
        title: 'Error',
        description: (err instanceof Error ? err.message : String(err)) || 'Failed to add closure',
      });
    } finally {
      setSubmittingClosure(false);
    }
  };

  // Delete Closure
  const handleDeleteClosure = (closureId: string) => {
    if (!business) return;
    showModal({
      variant: 'delete',
      title: 'Remove Closure',
      description: 'Are you sure you want to delete this downtime closure?',
      dismissible: true,
      actions: [
        {
          label: 'Delete',
          variant: 'danger',
          onPress: async () => {
            try {
              await apiService.deleteBusinessClosure(business.id, closureId);
              setClosures((prev) => prev.filter((c) => c.id !== closureId));
              showModal({
                variant: 'success',
                title: 'Success',
                description: 'Closure deleted',
              });
            } catch (err: unknown) {
              showModal({
                variant: 'error',
                title: 'Error',
                description:
                  (err instanceof Error ? err.message : String(err)) || 'Failed to delete closure',
              });
            }
          },
        },
      ],
    });
  };

  // 4. Fetch Reviews
  const fetchReviews = async () => {
    if (!business) return;
    setLoadingReviews(true);
    try {
      const res = await apiService.getReviews(business.id);
      if (res) {
        setReviewData({
          rating_avg: res.rating_avg || 0,
          review_count: res.review_count || 0,
          reviews: (res.reviews || []) as {
            id?: string;
            rating: number;
            created_at?: string;
            comment?: string;
            [key: string]: unknown;
          }[],
        });
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Sharing Actions
  const handleShareLink = () => {
    if (!business) return;
    const link = `https://cusownapp.clykur.com/book/${business.id}`;
    Share.share({
      message: `Book your appointment at ${business.salon_name} online here: ${link}`,
    });
  };
  // Delete Business
  const handleDeleteBusiness = () => {
    if (!business) return;

    showModal({
      variant: 'delete',
      title: 'Delete Business',
      description: `• "${business.salon_name}" will be deactivated immediately.\n• It will be scheduled for permanent deletion after 30 days.\n• During this period, you may be able to recover your business account.`,
      dismissible: true,
      actions: [
        {
          label: 'Delete',
          variant: 'danger',
          onPress: async () => {
            try {
              setLoading(true);

              await apiService.deleteBusiness(business.id);

              showModal({
                variant: 'success',
                title: 'Business Deleted',
                description:
                  'Business is deleted successfully and will be permanently removed after 30 days.',
              });

              router.replace('/(owner)');
            } catch (err: unknown) {
              showModal({
                variant: 'error',
                title: 'Error',
                description:
                  (err instanceof Error ? err.message : String(err)) ||
                  'Failed to delete business.',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    });
  };

  if (loading && !refreshing) {
    return (
      <PremiumBackground>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color={THEME.colors.background} size="large" />
        </View>
      </PremiumBackground>
    );
  }

  if (!business) {
    return (
      <PremiumBackground>
        <View className="flex-1 justify-center items-center p-10">
          <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.textSecondary} />
          <Text className="text-text text-xl font-black mt-4 mb-6">Business Not Found</Text>
          <Pressable
            onPress={() => router.back()}
            className="bg-primary px-6 py-3.5 rounded-full active:opacity-80"
          >
            <Text className="text-background font-black text-xs uppercase tracking-widest">
              Back to Portfolio
            </Text>
          </Pressable>
        </View>
      </PremiumBackground>
    );
  }

  const renderTabButton = (tab: TabType, label: string, icon: keyof typeof Ionicons.glyphMap) => (
    <Pressable
      onPress={() => setActiveTab(tab)}
      className={`px-4 py-3 rounded-full flex-row items-center mr-2 border ${
        activeTab === tab ? 'bg-primary border-primary' : 'bg-input border-border active:bg-card'
      }`}
    >
      <Ionicons
        name={icon}
        size={15}
        color={activeTab === tab ? THEME.colors.text : THEME.colors.textSecondary}
        className="mr-2"
      />
      <Text
        className={`text-xs font-black uppercase tracking-wider ${activeTab === tab ? 'text-background' : 'text-textSecondary'}`}
      >
        {tab === 'overview' ? 'QR Code' : label}
      </Text>
    </Pressable>
  );

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-1">
          {/* Header */}
          <View className="px-luxury pt-6 pb-4 mb-4">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-4">
                <Text className="text-textSecondary text-xs font-black uppercase tracking-1 mb-1">
                  Management Suite
                </Text>
                <Text className="text-text text-3xl font-black tracking-tight" numberOfLines={2}>
                  {business.salon_name}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="location-outline" size={14} color={THEME.colors.textSecondary} />
                  <Text className="text-textSecondary text-xs ml-1 font-semibold" numberOfLines={1}>
                    {business.address || business.location || business.city}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="flex-row items-center">
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/(owner)/edit-business',
                        params: { id },
                      })
                    }
                    className="items-center justify-center mr-3"
                  >
                    <Ionicons name="create-outline" size={25} color={THEME.colors.primary} />
                  </Pressable>
                  {/* Delete */}
                  <Pressable onPress={handleDeleteBusiness} className="items-center justify-center">
                    <Ionicons name="trash-outline" size={25} color={THEME.colors.error} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View className="mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-luxury"
            >
              {renderTabButton('overview', 'QR Identity', 'qr-code')}
              {renderTabButton('services', 'Services', 'cut')}
              {renderTabButton('photos', 'Photos', 'images')}
              {renderTabButton('schedule', 'Downtime', 'calendar')}
              {renderTabButton('reviews', 'Reviews', 'star')}
            </ScrollView>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="px-luxury pb-20"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={THEME.colors.background}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'overview' && (
              <AnimatedSection direction="up">
                {/* QR Card */}
                <GlassCard className="p-2 rounded-luxury mb-6 border-border shadow-sm items-center justify-center">
                  {/* Header */}
                  <View className="items-center mb-8">
                    <Text className="text-text text-lg font-extrabold text-center mb-1">
                      Business QR Identity
                    </Text>

                    <Text className="text-textSecondary text-xs text-center font-semibold leading-5 px-4">
                      Scan to instantly browse services and book appointments at your hub.
                    </Text>
                  </View>

                  {/* QR Section */}
                  <View className="w-full items-center justify-center">
                    {/* QR Container */}
                    <View className="items-center justify-center border border-text rounded-luxury mb-6 p-2">
                      <QRCode
                        value={`https://cusownapp.clykur.com/book/${business.id}`}
                        size={200}
                        color="black"
                        backgroundColor="white"
                        getRef={(c) => {
                          qrRef.current = c;
                        }}
                      />
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row items-center justify-center px-2">
                      {/* Share */}
                      <Pressable
                        onPress={handleShareLink}
                        className="flex-1 h-12 flex-row items-center justify-center border border-primary rounded-full mr-2 active:bg-card"
                      >
                        <Ionicons
                          name="share-social-outline"
                          size={16}
                          color={THEME.colors.primary}
                        />

                        <Text className="ml-2 text-primary font-black text-xs uppercase tracking-0.5">
                          Share
                        </Text>
                      </Pressable>

                      {/* Download */}
                      <Pressable
                        onPress={handleDownloadQR}
                        className="flex-1 h-12 flex-row items-center justify-center border border-border rounded-full ml-2 active:bg-card"
                      >
                        <Ionicons
                          name="download-outline"
                          size={16}
                          color={THEME.colors.textSecondary}
                        />

                        <Text className="ml-2 text-textSecondary font-black text-xs uppercase tracking-0.5">
                          Download
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </GlassCard>
                {/* Business Details Card */}
                <GlassCard className="p-2 rounded-luxury border-border shadow-sm mt-6">
                  {/* Header */}
                  <View className="flex-row items-center justify-between mb-6">
                    <View>
                      <Text className="text-text text-lg font-extrabold">Business Details</Text>

                      <Text className="text-textSecondary text-xs font-semibold mt-1">
                        Manage your public business information
                      </Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View>
                    {/* Salon Name */}
                    <View className="flex-row justify-between items-center py-4 border-b border-border">
                      <Text className="text-textSecondary text-xs font-black uppercase tracking-0.5">
                        Salon
                      </Text>

                      <Text
                        className="text-text text-sm font-bold text-right flex-1 ml-4"
                        numberOfLines={1}
                      >
                        {business.salon_name}
                      </Text>
                    </View>
                    {/* Owner Name */}
                    <View className="flex-row justify-between items-center py-4 border-b border-border">
                      <Text className="text-textSecondary text-xs font-black uppercase tracking-0.5">
                        Owner
                      </Text>

                      <Text
                        className="text-text text-sm font-bold text-right flex-1 ml-4"
                        numberOfLines={1}
                      >
                        {business.owner_name || 'Not set'}
                      </Text>
                    </View>

                    {/* Phone Number */}
                    <View className="flex-row justify-between items-center py-4 border-b border-border">
                      <Text className="text-textSecondary text-xs font-black uppercase tracking-0.5">
                        Phone
                      </Text>

                      <Text
                        className="text-text text-sm font-bold text-right flex-1 ml-4"
                        numberOfLines={1}
                      >
                        {business.whatsapp_number || business.phone_number || 'Not added'}
                      </Text>
                    </View>

                    {/* Address */}
                    <View className="flex-row justify-between items-start py-4 border-b border-border">
                      <Text className="text-textSecondary text-xs font-black uppercase tracking-0.5">
                        Address
                      </Text>

                      <Text className="text-text text-sm font-bold text-right flex-1 ml-4">
                        {business.address || business.location || 'No address added'}
                      </Text>
                    </View>

                    {/* City */}
                    <View className="flex-row justify-between items-center py-4 border-b border-border">
                      <Text className="text-textSecondary text-xs font-black uppercase tracking-0.5">
                        City
                      </Text>

                      <Text className="text-text text-sm font-bold text-right flex-1 ml-4">
                        {business.city || 'Not set'}
                      </Text>
                    </View>

                    {/* Working Hours */}
                    <View className="flex-row justify-between items-center py-4 border-b border-border">
                      <Text className="text-textSecondary text-xs font-black uppercase tracking-0.5">
                        Hours
                      </Text>

                      <Text className="text-text text-sm font-bold text-right flex-1 ml-4">
                        {business.opening_time && business.closing_time
                          ? `${business.opening_time} - ${business.closing_time}`
                          : 'Not configured'}
                      </Text>
                    </View>

                    {/* Created */}
                    <View className="flex-row justify-between items-center py-4">
                      <Text className="text-textSecondary text-xs font-black uppercase tracking-0.5">
                        Created
                      </Text>

                      <Text className="text-text text-sm font-bold text-right flex-1 ml-4">
                        {new Date(business.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </AnimatedSection>
            )}

            {activeTab === 'services' && (
              <AnimatedSection direction="up">
                <ServicesManagement businessId={business.id} />
              </AnimatedSection>
            )}

            {activeTab === 'photos' && (
              <AnimatedSection direction="up">
                <GlassCard className="p-2 rounded-luxury border-border shadow-sm mb-6">
                  <View className="flex-row justify-between items-center mb-6 border-b border-border pb-2">
                    <Text className="text-text font-extrabold text-xl">Shop Photos</Text>
                    <Pressable
                      onPress={handleAddPhoto}
                      disabled={uploadingPhoto}
                      className="bg-primary px-5 py-3 rounded-full active:opacity-80"
                    >
                      {uploadingPhoto ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text className="text-background font-black text-xs uppercase tracking-wider">
                          + Add Photo
                        </Text>
                      )}
                    </Pressable>
                  </View>

                  {loadingPhotos ? (
                    <ActivityIndicator color={THEME.colors.textSecondary} className="my-8" />
                  ) : photos.length === 0 ? (
                    <View className="py-12 items-center justify-center">
                      <Ionicons name="images-outline" size={48} color={THEME.colors.border} />
                      <Text className="text-textSecondary font-semibold mt-4 text-center">
                        No shop photos added yet.
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row flex-wrap gap-4 justify-between">
                      {photos.map((item) => (
                        <View
                          key={item.id}
                          className="flex-1 aspect-square bg-input rounded-2xl border border-border overflow-hidden relative mb-2"
                        >
                          <Image
                            source={{ uri: item.url }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                          <Pressable
                            onPress={() => handleDeletePhoto(item.id)}
                            className="absolute top-2 right-2 items-center justify-center shadow active:opacity-80"
                          >
                            <Ionicons name="trash-outline" size={24} color={THEME.colors.error} />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </GlassCard>
              </AnimatedSection>
            )}

            {activeTab === 'schedule' && (
              <AnimatedSection direction="up">
                {/* 1. Holidays Management */}
                <GlassCard className="p-2 rounded-luxury border-border shadow-sm mb-6">
                  <Text className="text-text text-lg font-extrabold mb-1">Holiday Mode</Text>
                  <Text className="text-textSecondary text-xs mb-6 font-semibold">
                    Set complete holiday dates where booking is disabled.
                  </Text>

                  {/* Add Holiday Form */}
                  <View className="p-2 mb-3">
                    <Text className="text-xs text-textSecondary font-black uppercase tracking-0.5 mb-3">
                      Schedule a Holiday
                    </Text>
                    <View className="space-y-3">
                      <TextInput
                        className="bg-card border border-border rounded-xl px-4 py-3.5 text-text text-xs font-semibold mb-2"
                        placeholder="Date (YYYY-MM-DD)"
                        placeholderTextColor={THEME.colors.textSecondary}
                        value={holidayDate}
                        onChangeText={setHolidayDate}
                      />
                      <TextInput
                        className="bg-card border border-border rounded-xl px-4 py-3.5 text-text text-xs font-semibold mb-4"
                        placeholder="Holiday Name (e.g. Diwali)"
                        placeholderTextColor={THEME.colors.textSecondary}
                        value={holidayName}
                        onChangeText={setHolidayName}
                      />
                      <Pressable
                        onPress={handleAddHoliday}
                        disabled={submittingHoliday}
                        className="bg-primary py-3.5 rounded-full items-center active:opacity-80"
                      >
                        {submittingHoliday ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className="text-background font-black text-xs uppercase tracking-wider">
                            Add Holiday
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {/* Holiday List */}
                  {loadingDowntime ? (
                    <ActivityIndicator color={THEME.colors.textSecondary} />
                  ) : holidays.length === 0 ? (
                    <Text className="text-textSecondary text-xs text-center font-semibold py-4">
                      No upcoming holidays scheduled.
                    </Text>
                  ) : (
                    <View className="space-y-2">
                      {holidays.map((item) => (
                        <View
                          key={item.id}
                          className="bg-input border border-border rounded-xl p-3 flex-row items-center justify-between mb-2"
                        >
                          <View className="flex-1 mr-4">
                            <Text className="text-text font-extrabold text-xs">
                              {item.holiday_name}
                            </Text>
                            <Text className="text-textSecondary text-xs font-semibold mt-0.5">
                              {item.holiday_date}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleDeleteHoliday(item.id)}
                            className="p-2 rounded-full active:bg-input"
                          >
                            <Ionicons name="trash-outline" size={14} color={THEME.colors.error} />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </GlassCard>

                {/* 2. Specific Downtime Closures */}
                <GlassCard className="p-2 rounded-luxury border-border shadow-sm mb-6">
                  <Text className="text-text text-lg font-extrabold mb-1">Downtime Closures</Text>
                  <Text className="text-textSecondary text-xs mb-6 font-semibold">
                    Set longer closures (e.g. renovation or temporary closure).
                  </Text>

                  {/* Add Closure Form */}
                  <View className="p-2 mb-3">
                    <Text className="text-xs text-textSecondary font-black uppercase tracking-0.5 mb-3">
                      Add Specific Closure
                    </Text>
                    <View className="space-y-3">
                      <TextInput
                        className="bg-card border border-border rounded-xl px-4 py-3.5 text-text text-xs font-semibold mb-2"
                        placeholder="Start Date (YYYY-MM-DD)"
                        placeholderTextColor={THEME.colors.textSecondary}
                        value={closureStart}
                        onChangeText={setClosureStart}
                      />
                      <TextInput
                        className="bg-card border border-border rounded-xl px-4 py-3.5 text-text text-xs font-semibold mb-2"
                        placeholder="End Date (YYYY-MM-DD)"
                        placeholderTextColor={THEME.colors.textSecondary}
                        value={closureEnd}
                        onChangeText={setClosureEnd}
                      />
                      <TextInput
                        className="bg-card border border-border rounded-xl px-4 py-3.5 text-text text-xs font-semibold mb-4"
                        placeholder="Reason (e.g. Renovation)"
                        placeholderTextColor={THEME.colors.textSecondary}
                        value={closureReason}
                        onChangeText={setClosureReason}
                      />
                      <Pressable
                        onPress={handleAddClosure}
                        disabled={submittingClosure}
                        className="bg-primary py-3.5 rounded-full items-center active:opacity-80"
                      >
                        {submittingClosure ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className="text-background font-black text-xs uppercase tracking-wider">
                            Add Closure
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {/* Closures List */}
                  {loadingDowntime ? (
                    <ActivityIndicator color={THEME.colors.textSecondary} />
                  ) : closures.length === 0 ? (
                    <Text className="text-textSecondary text-xs text-center font-semibold py-4">
                      No custom closures scheduled.
                    </Text>
                  ) : (
                    <View className="space-y-2">
                      {closures.map((item) => (
                        <View
                          key={item.id}
                          className="bg-input border border-border rounded-xl p-3 flex-row items-center justify-between mb-2"
                        >
                          <View className="flex-1 mr-4">
                            <Text className="text-text font-extrabold text-xs">{item.reason}</Text>
                            <Text className="text-textSecondary text-xs font-semibold mt-0.5">
                              {item.start_date} to {item.end_date}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleDeleteClosure(item.id)}
                            className="bg-card border border-border p-2 rounded-full active:bg-input"
                          >
                            <Ionicons
                              name="trash-outline"
                              size={14}
                              color={THEME.colors.background}
                            />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </GlassCard>
              </AnimatedSection>
            )}

            {activeTab === 'reviews' && (
              <AnimatedSection direction="up">
                <GlassCard className="p-2 rounded-luxury border-border shadow-sm">
                  <View className="mb-6 border-b border-border pb-4">
                    <Text className="text-text font-extrabold text-xl">Customer Reviews</Text>
                    {loadingReviews ? (
                      <ActivityIndicator
                        color={THEME.colors.textSecondary}
                        className="mt-2 align-self-start"
                      />
                    ) : (
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="star-outline" size={16} color="#FFB800" />
                        <Text className="text-text font-extrabold ml-1.5 text-lg">
                          {Number(reviewData.rating_avg).toFixed(1)}
                        </Text>
                        <Text className="text-textSecondary text-xs ml-3 font-semibold">
                          ({reviewData.review_count} Reviews)
                        </Text>
                      </View>
                    )}
                  </View>

                  {loadingReviews ? (
                    <ActivityIndicator color={THEME.colors.textSecondary} className="my-8" />
                  ) : reviewData.reviews.length === 0 ? (
                    <View className="items-center py-12">
                      {/* Stars */}
                      <View className="flex-row items-center">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Ionicons
                            className="mx-0.5"
                            key={index}
                            name="star-outline"
                            size={30}
                            color={THEME.colors.border}
                          />
                        ))}
                      </View>

                      {/* Text */}
                      <Text className="text-textSecondary font-semibold mt-4 text-center">
                        No reviews yet for this business
                      </Text>
                    </View>
                  ) : (
                    <View className="space-y-4">
                      {reviewData.reviews.map(
                        (
                          rev: {
                            id?: string;
                            rating: number;
                            created_at?: string;
                            comment?: string;
                          },
                          idx: number,
                        ) => (
                          <View
                            key={rev.id || idx}
                            className="bg-input border border-border rounded-2xl p-4 mb-3"
                          >
                            <View className="flex-row justify-between items-center mb-3">
                              <View className="flex-row items-center">
                                {Array.from({ length: rev.rating }).map((_, starIdx) => (
                                  <Ionicons
                                    className="mr-0.5"
                                    key={starIdx}
                                    name="star"
                                    size={12}
                                    color="#FFB800"
                                  />
                                ))}
                              </View>
                              <Text className="text-textSecondary text-xs font-semibold">
                                {rev.created_at
                                  ? new Date(rev.created_at).toLocaleDateString()
                                  : ''}
                              </Text>
                            </View>
                            {rev.comment ? (
                              <Text className="text-textSecondary text-xs font-medium leading-relaxed">
                                {rev.comment}
                              </Text>
                            ) : (
                              <Text className="text-textSecondary text-xs italic font-medium">
                                No comment provided
                              </Text>
                            )}
                          </View>
                        ),
                      )}
                    </View>
                  )}
                </GlassCard>
              </AnimatedSection>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </PremiumBackground>
  );
}
