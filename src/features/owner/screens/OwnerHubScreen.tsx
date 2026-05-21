import { THEME } from '@/theme/theme';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Share,
  TextInput,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { ServicesManagement } from '@/features/owner/components/ServicesManagement';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '@/services/api.service';
import { Business } from '@/types/business.types';
import * as ImagePicker from 'expo-image-picker';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';

type TabType = 'overview' | 'services' | 'photos' | 'schedule' | 'reviews';

export default function ManageHubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // QR Code State
  const [qrCode, setQrCode] = useState<string>('');
  const [loadingQR, setLoadingQR] = useState(false);

  // Photos State
  const [photos, setPhotos] = useState<Array<{ id: string; url: string }>>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Downtime State (Holidays & Closures)
  const [holidays, setHolidays] = useState<any[]>([]);
  const [closures, setClosures] = useState<any[]>([]);
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
    reviews: any[];
  }>({
    rating_avg: 0,
    review_count: 0,
    reviews: [],
  });
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    fetchBusiness();
  }, [id]);

  useEffect(() => {
    if (!business) return;

    if (activeTab === 'overview') {
      fetchQR();
    } else if (activeTab === 'photos') {
      fetchPhotos();
    } else if (activeTab === 'schedule') {
      fetchDowntime();
    } else if (activeTab === 'reviews') {
      fetchReviews();
    }
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
        Alert.alert('Permission Denied', 'Permission to access photos is required.');
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

      Alert.alert('Success', 'Photo added to portfolio');
      fetchPhotos();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to upload image');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Delete Photo
  const handleDeletePhoto = (mediaId: string) => {
    Alert.alert('Remove Photo', 'Are you sure you want to remove this image from portfolio?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.deleteMedia(mediaId);
            setPhotos((prev) => prev.filter((p) => p.id !== mediaId));
            Alert.alert('Success', 'Photo removed successfully');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete image');
          }
        },
      },
    ]);
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
      setHolidays(holidaysData || []);
      setClosures(closuresData || []);
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
      Alert.alert('Error', 'Please enter a holiday date');
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
      Alert.alert('Success', 'Holiday added successfully');
      fetchDowntime();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add holiday');
    } finally {
      setSubmittingHoliday(false);
    }
  };

  // Delete Holiday
  const handleDeleteHoliday = (holidayId: string) => {
    if (!business) return;
    Alert.alert('Remove Holiday', 'Are you sure you want to delete this holiday?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.deleteBusinessHoliday(business.id, holidayId);
            setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
            Alert.alert('Success', 'Holiday deleted');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete holiday');
          }
        },
      },
    ]);
  };

  // Add Closure
  const handleAddClosure = async () => {
    if (!business) return;
    if (!closureStart || !closureEnd) {
      Alert.alert('Error', 'Please enter start and end dates');
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
      Alert.alert('Success', 'Downtime closure added successfully');
      fetchDowntime();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add closure');
    } finally {
      setSubmittingClosure(false);
    }
  };

  // Delete Closure
  const handleDeleteClosure = (closureId: string) => {
    if (!business) return;
    Alert.alert('Remove Closure', 'Are you sure you want to delete this downtime closure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.deleteBusinessClosure(business.id, closureId);
            setClosures((prev) => prev.filter((c) => c.id !== closureId));
            Alert.alert('Success', 'Closure deleted');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete closure');
          }
        },
      },
    ]);
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
          reviews: res.reviews || [],
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
          <Text className="text-slate-900 text-xl font-black mt-4 mb-6">Hub Not Found</Text>
          <Pressable
            onPress={() => router.back()}
            className="bg-black px-6 py-3.5 rounded-full active:bg-slate-950"
          >
            <Text className="text-white font-black text-xs uppercase tracking-widest">
              Back to Portfolio
            </Text>
          </Pressable>
        </View>
      </PremiumBackground>
    );
  }

  const renderTabButton = (tab: TabType, label: string, icon: any) => (
    <Pressable
      onPress={() => setActiveTab(tab)}
      className={`px-4 py-3 rounded-full flex-row items-center mr-2 border ${
        activeTab === tab
          ? 'bg-black border-black'
          : 'bg-white border-slate-200/80 active:bg-slate-50'
      }`}
    >
      <Ionicons
        name={icon}
        size={15}
        color={activeTab === tab ? THEME.colors.text : THEME.colors.border}
        className="mr-2"
      />
      <Text
        className={`text-xs font-black uppercase tracking-wider ${activeTab === tab ? 'text-white' : 'text-slate-600'}`}
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
                <Text className="text-slate-400 text-xs font-black uppercase tracking-[3px] mb-1">
                  Management Suite
                </Text>
                <Text
                  className="text-slate-900 text-3xl font-black tracking-tight"
                  numberOfLines={2}
                >
                  {business.salon_name}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="location-outline" size={14} color={THEME.colors.textSecondary} />
                  <Text className="text-slate-500 text-xs ml-1 font-semibold" numberOfLines={1}>
                    {business.address || business.location || business.city}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => router.push({ pathname: '/(owner)/edit-business', params: { id } })}
                className="w-10 h-10 rounded-full items-center"
              >
                <Ionicons name="create-outline" size={30} color="#334155" />
              </Pressable>
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
                <GlassCard className="p-8 rounded-luxury mb-6 border-slate-200/80 shadow-sm items-center justify-center">
                  {/* Header */}
                  <View className="items-center mb-8">
                    <Text className="text-slate-900 text-lg font-extrabold text-center mb-1">
                      Business QR Identity
                    </Text>

                    <Text className="text-slate-500 text-xs text-center font-semibold leading-5 px-4">
                      Scan to instantly browse services and book appointments at your hub.
                    </Text>
                  </View>

                  {/* QR Section */}
                  <View className="w-full flex flex-col items-center justify-center">
                    <View className="w-64 h-64 ml-5 rounded-[32px] items-center justify-center mb-8 bg-white p-4">
                      <QRCode
                        value={`https://cusownapp.clykur.com/book/${business.id}`}
                        size={200}
                        color="black"
                        backgroundColor="white"
                      />
                    </View>

                    {/* Share Button */}
                    <Pressable
                      onPress={handleShareLink}
                      className="flex-row items-center justify-center"
                    >
                      <Ionicons name="share-social-outline" size={14} color="#000" />

                      <Text className="ml-2 text-black font-black text-xs uppercase tracking-wider">
                        Share Link
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>

                {/* URL Card */}
                <GlassCard className="p-6 rounded-luxury border-slate-200/80 shadow-sm items-center">
                  <Text className="text-xs text-slate-500 font-black uppercase tracking-[2px] mb-4 text-center">
                    Direct Booking URL
                  </Text>

                  <Pressable
                    onPress={handleShareLink}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex-row items-center justify-between active:bg-slate-100"
                  >
                    <Text
                      className="flex-1 text-slate-700 text-xs font-semibold text-center"
                      numberOfLines={1}
                    >
                      {`https://cusownapp.clykur.com/book/${business.id}`}
                    </Text>

                    <Ionicons name="share-outline" size={18} color={THEME.colors.textSecondary} />
                  </Pressable>
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
                <GlassCard className="p-6 rounded-luxury border-slate-200/80 shadow-sm mb-6">
                  <View className="flex-row justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <Text className="text-slate-900 font-extrabold text-xl">Shop Portfolio</Text>
                    <Pressable
                      onPress={handleAddPhoto}
                      disabled={uploadingPhoto}
                      className="bg-black px-5 py-3 rounded-full active:bg-slate-950"
                    >
                      {uploadingPhoto ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text className="text-white font-black text-xs uppercase tracking-wider">
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
                      <Text className="text-slate-500 font-semibold mt-4 text-center">
                        No shop photos added yet.
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row flex-wrap gap-4 justify-between">
                      {photos.map((item) => (
                        <View
                          key={item.id}
                          className="w-[47%] aspect-square bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden relative mb-2"
                        >
                          <Image
                            source={{ uri: item.url }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                          <Pressable
                            onPress={() => handleDeletePhoto(item.id)}
                            className="absolute top-2 right-2 bg-black w-8 h-8 rounded-full items-center justify-center shadow active:bg-neutral-800"
                          >
                            <Ionicons name="trash-outline" size={14} color={THEME.colors.text} />
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
                <GlassCard className="p-6 rounded-luxury border-slate-200/80 shadow-sm mb-6">
                  <Text className="text-slate-900 text-lg font-extrabold mb-1">Holiday Mode</Text>
                  <Text className="text-slate-500 text-xs mb-6 font-semibold">
                    Set complete holiday dates where booking is disabled.
                  </Text>

                  {/* Add Holiday Form */}
                  <View className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl mb-6">
                    <Text className="text-xs text-slate-500 font-black uppercase tracking-[2px] mb-3">
                      Schedule a Holiday
                    </Text>
                    <View className="space-y-3">
                      <TextInput
                        className="bg-white border border-slate-200/80 rounded-xl px-4 py-3.5 text-slate-800 text-xs font-semibold mb-2"
                        placeholder="Date (YYYY-MM-DD)"
                        placeholderTextColor={THEME.colors.textSecondary}
                        value={holidayDate}
                        onChangeText={setHolidayDate}
                      />
                      <TextInput
                        className="bg-white border border-slate-200/80 rounded-xl px-4 py-3.5 text-slate-800 text-xs font-semibold mb-4"
                        placeholder="Holiday Name (e.g. Diwali)"
                        placeholderTextColor={THEME.colors.textSecondary}
                        value={holidayName}
                        onChangeText={setHolidayName}
                      />
                      <Pressable
                        onPress={handleAddHoliday}
                        disabled={submittingHoliday}
                        className="bg-black py-3.5 rounded-full items-center active:bg-slate-950"
                      >
                        {submittingHoliday ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className="text-white font-black text-xs uppercase tracking-wider">
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
                    <Text className="text-slate-400 text-xs text-center font-semibold py-4">
                      No upcoming holidays scheduled.
                    </Text>
                  ) : (
                    <View className="space-y-2">
                      {holidays.map((item) => (
                        <View
                          key={item.id}
                          className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex-row items-center justify-between mb-2"
                        >
                          <View className="flex-1 mr-4">
                            <Text className="text-slate-900 font-extrabold text-xs">
                              {item.holiday_name}
                            </Text>
                            <Text className="text-slate-500 text-xs font-semibold mt-0.5">
                              {item.holiday_date}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleDeleteHoliday(item.id)}
                            className="bg-white border border-slate-200/80 p-2 rounded-full active:bg-neutral-200"
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

                {/* 2. Specific Downtime Closures */}
                <GlassCard className="p-6 rounded-luxury border-slate-200/80 shadow-sm mb-6">
                  <Text className="text-slate-900 text-lg font-extrabold mb-1">
                    Downtime Closures
                  </Text>
                  <Text className="text-slate-500 text-xs mb-6 font-semibold">
                    Set longer closures (e.g. renovation or temporary closure).
                  </Text>

                  {/* Add Closure Form */}
                  <View className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl mb-6">
                    <Text className="text-xs text-slate-500 font-black uppercase tracking-[2px] mb-3">
                      Add Specific Closure
                    </Text>
                    <View className="space-y-3">
                      <TextInput
                        className="bg-white border border-slate-200/80 rounded-xl px-4 py-3.5 text-slate-800 text-xs font-semibold mb-2"
                        placeholder="Start Date (YYYY-MM-DD)"
                        placeholderTextColor={THEME.colors.textSecondary}
                        value={closureStart}
                        onChangeText={setClosureStart}
                      />
                      <TextInput
                        className="bg-white border border-slate-200/80 rounded-xl px-4 py-3.5 text-slate-800 text-xs font-semibold mb-2"
                        placeholder="End Date (YYYY-MM-DD)"
                        placeholderTextColor={THEME.colors.textSecondary}
                        value={closureEnd}
                        onChangeText={setClosureEnd}
                      />
                      <TextInput
                        className="bg-white border border-slate-200/80 rounded-xl px-4 py-3.5 text-slate-800 text-xs font-semibold mb-4"
                        placeholder="Reason (e.g. Renovation)"
                        placeholderTextColor={THEME.colors.textSecondary}
                        value={closureReason}
                        onChangeText={setClosureReason}
                      />
                      <Pressable
                        onPress={handleAddClosure}
                        disabled={submittingClosure}
                        className="bg-black py-3.5 rounded-full items-center active:bg-slate-950"
                      >
                        {submittingClosure ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className="text-white font-black text-xs uppercase tracking-wider">
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
                    <Text className="text-slate-400 text-xs text-center font-semibold py-4">
                      No custom closures scheduled.
                    </Text>
                  ) : (
                    <View className="space-y-2">
                      {closures.map((item) => (
                        <View
                          key={item.id}
                          className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex-row items-center justify-between mb-2"
                        >
                          <View className="flex-1 mr-4">
                            <Text className="text-slate-900 font-extrabold text-xs">
                              {item.reason}
                            </Text>
                            <Text className="text-slate-500 text-xs font-semibold mt-0.5">
                              {item.start_date} to {item.end_date}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleDeleteClosure(item.id)}
                            className="bg-white border border-slate-200/80 p-2 rounded-full active:bg-neutral-200"
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
                <GlassCard className="p-6 rounded-luxury border-slate-200/80 shadow-sm">
                  <View className="mb-6 border-b border-slate-100 pb-4">
                    <Text className="text-slate-900 font-extrabold text-xl">Customer Reviews</Text>
                    {loadingReviews ? (
                      <ActivityIndicator
                        color={THEME.colors.textSecondary}
                        className="mt-2 align-self-start"
                      />
                    ) : (
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="star-outline" size={16} color="#FFB800" />
                        <Text className="text-slate-900 font-extrabold ml-1.5 text-lg">
                          {Number(reviewData.rating_avg).toFixed(1)}
                        </Text>
                        <Text className="text-slate-500 text-xs ml-3 font-semibold">
                          ({reviewData.review_count} Reviews)
                        </Text>
                      </View>
                    )}
                  </View>

                  {loadingReviews ? (
                    <ActivityIndicator color={THEME.colors.textSecondary} className="my-8" />
                  ) : reviewData.reviews.length === 0 ? (
                    <View className="items-center py-12">
                      <Ionicons name="chatbubbles-outline" size={48} color={THEME.colors.border} />
                      <Text className="text-slate-500 font-semibold mt-4">
                        No reviews yet for this hub
                      </Text>
                    </View>
                  ) : (
                    <View className="space-y-4">
                      {reviewData.reviews.map((rev: any, idx: number) => (
                        <View
                          key={rev.id || idx}
                          className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-3"
                        >
                          <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-slate-900 font-extrabold text-sm">
                              {rev?.customer_name || 'Customer'}
                            </Text>
                            <View className="flex-row items-center">
                              {Array.from({ length: rev.rating }).map((_, starIdx) => (
                                <Ionicons key={starIdx} name="star" size={12} color="#FFB800" />
                              ))}
                            </View>
                          </View>
                          {rev.comment ? (
                            <Text className="text-slate-700 text-xs font-medium leading-relaxed">
                              {rev.comment}
                            </Text>
                          ) : (
                            <Text className="text-slate-400 text-xs italic font-medium">
                              No comment provided
                            </Text>
                          )}
                          <Text className="text-slate-400 text-xs font-semibold mt-2.5">
                            {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ''}
                          </Text>
                        </View>
                      ))}
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
