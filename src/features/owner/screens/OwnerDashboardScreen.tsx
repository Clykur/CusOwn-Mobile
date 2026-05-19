import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  RefreshControl,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOwnerBusinesses, useOwnerDashboard } from '@/hooks/useOwner';
import { apiService } from '@/services/api.service';
import {
  useAcceptBooking,
  useRejectBooking,
  useUndoAccept,
  useUndoReject,
  useMarkNoShow,
} from '@/hooks/useBookings';
import { Booking } from '@/types/booking.types';
import { BusinessStats } from '@/types/business.types';
import { Badge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import { BookingCard } from '@/features/owner/components/BookingCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { OwnerBookingDetailModal } from '@/features/owner/components/OwnerBookingDetailModal';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export default function OwnerDashboardScreen() {
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [businessImages, setBusinessImages] = useState<Record<string, string>>({});
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const {
    data: dashboard,
    isLoading: bookingsLoading,
    refetch,
  } = useOwnerDashboard({
    businessId: selectedBusinessId || 'all',
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });
  const { data: businesses } = useOwnerBusinesses();
  useEffect(() => {
    const loadBusinessImages = async () => {
      if (!businesses?.length) return;

      const imageMap: Record<string, string> = {};

      await Promise.all(
        businesses.map(async (biz) => {
          if (biz.owner_image) {
            imageMap[biz.id] = biz.owner_image;
            return;
          }
          if (biz.image_url) {
            imageMap[biz.id] = biz.image_url;
            return;
          }
          if (biz.cover_photo_url) {
            imageMap[biz.id] = biz.cover_photo_url;
            return;
          }
          try {
            const businessAny = biz as any;

            if (businessAny?.media?.signed_url) {
              imageMap[biz.id] = businessAny.media.signed_url;
              return;
            }

            if (businessAny?.media?.url) {
              imageMap[biz.id] = businessAny.media.url;
              return;
            }

            if (businessAny?.cover_media_id) {
              const signed = await apiService.getSignedUrl(businessAny.cover_media_id);

              if (signed?.url) {
                imageMap[biz.id] = signed.url;
              }
            }
          } catch (e) {
            const { logger, LogTag } = require('@/utils/logger');
            logger.error(LogTag.API, 'Failed loading business image');
          }
        }),
      );

      setBusinessImages(imageMap);
    };

    loadBusinessImages();
  }, [businesses]);

  const { mutate: acceptBooking } = useAcceptBooking();
  const { mutate: rejectBooking } = useRejectBooking();
  const { mutate: undoAccept } = useUndoAccept();
  const { mutate: undoReject } = useUndoReject();
  const { mutate: markNoShow } = useMarkNoShow();

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const stats = dashboard?.stats;

  const bookings = React.useMemo(() => {
    if (!dashboard) return [];

    const recent = dashboard.recentBookings || [];

    const grouped = dashboard.bookingsByBusiness
      ? Object.values(dashboard.bookingsByBusiness).flat()
      : [];

    const merged = [...recent, ...grouped];

    return Array.from(new Map(merged.map((b: any) => [b.id, b])).values()) as Booking[];
  }, [dashboard]);

  // Synchronize selectedBooking with fresh data from the dashboard bookings
  React.useEffect(() => {
    if (selectedBooking && bookings) {
      const fresh = bookings.find((b: any) => b.id === selectedBooking.id);
      if (fresh) {
        setSelectedBooking(fresh);
      }
    }
  }, [bookings, selectedBooking]);

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    return bookings.filter((booking: Booking) => {
      const matchesSearch =
        !searchTerm ||
        booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const matchesBusiness = !selectedBusinessId || booking.business_id === selectedBusinessId;

      const bookingDate = booking.date; // YYYY-MM-DD
      const matchesFromDate = !fromDate || (!!bookingDate && bookingDate >= fromDate);
      const matchesToDate = !toDate || (!!bookingDate && bookingDate <= toDate);

      return matchesSearch && matchesStatus && matchesBusiness && matchesFromDate && matchesToDate;
    });
  }, [bookings, searchTerm, statusFilter, selectedBusinessId, fromDate, toDate]);

  const handleAccept = (id: string) => {
    Alert.alert('Approve Booking', 'Are you sure you want to confirm this reservation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => acceptBooking(id) },
    ]);
  };

  const handleReject = (id: string) => {
    Alert.alert('Decline Booking', 'Are you sure you want to reject this reservation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => rejectBooking(id) },
    ]);
  };

  const handleUndoAccept = (id: string) => {
    Alert.alert('Undo Approval', 'Revert this booking back to pending status?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Undo', onPress: () => undoAccept(id) },
    ]);
  };

  const handleUndoReject = (id: string) => {
    Alert.alert('Undo Rejection', 'Revert this booking back to pending status?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Undo', onPress: () => undoReject(id) },
    ]);
  };

  const handleNoShow = (id: string) => {
    Alert.alert('Mark No-Show', 'Mark this client as a no-show for their appointment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: () => markNoShow(id) },
    ]);
  };

  const renderBookingItem = ({ item, index }: { item: Booking; index: number }) => {
    return (
      <BookingCard
        item={item}
        index={index}
        businessImage={businessImages[item.business?.id || item.business_id]}
        onPress={(booking) => {
          setSelectedBooking(booking);
          setShowDetailModal(true);
        }}
        onAccept={handleAccept}
        onReject={handleReject}
        onUndoAccept={handleUndoAccept}
        onUndoReject={handleUndoReject}
        onNoShow={handleNoShow}
      />
    );
  };

  const isLoading = bookingsLoading;

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#000000" />
          }
          contentContainerClassName="pb-12"
        >
          {/* Dashboard Header */}
          <AnimatedSection direction="down" className="px-luxury pt-4 pb-6">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-1">
              Welcome back to
            </Text>
            <Text className="text-slate-900 text-3xl font-black tracking-tight">Dashboard</Text>
          </AnimatedSection>

          {/* Search & Filters */}
          <AnimatedSection delay={50} direction="up" className="px-luxury mb-8 z-50">
            <View className="flex-row items-center gap-x-3">
              {/* Search Bar */}
              <View className="flex-1 flex-row items-center bg-white/80 border border-slate-200/80 rounded-2xl px-4 py-3.5 shadow-sm">
                <Ionicons name="search-outline" size={20} color="#94A3B8" />

                <TextInput
                  placeholder="Search clients or services..."
                  placeholderTextColor="#94A3B8"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  className="flex-1 ml-3 text-slate-900 text-sm font-semibold"
                />

                {searchTerm.length > 0 && (
                  <Pressable onPress={() => setSearchTerm('')}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </Pressable>
                )}
              </View>

              {/* Filter Menu Button */}
              <View className="relative z-50">
                <Pressable
                  onPress={() => setShowBusinessMenu(!showBusinessMenu)}
                  className="flex-1 flex-row items-center bg-white/80 border border-slate-200/80 rounded-2xl px-4 py-3.5 shadow-sm"
                >
                  <Ionicons name="options-outline" size={20} color="#111827" />
                </Pressable>

                {/* Dropdown Menu */}
                {showBusinessMenu && (
                  <View
                    className="absolute top-14 right-0 w-64 border border-slate-200 rounded-3xl p-2 z-[999] elevation-5"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.12,
                      shadowRadius: 20,
                      elevation: 12,
                    }}
                  >
                    {/* All Businesses */}
                    <Pressable
                      onPress={() => {
                        setSelectedBusinessId(null);
                        setShowBusinessMenu(false);
                      }}
                      className={`flex-row items-center px-3 py-3 rounded-2xl ${
                        selectedBusinessId === null ? 'bg-slate-100' : 'bg-white'
                      }`}
                    >
                      <View className="w-8 h-8 rounded-full items-center justify-center">
                        <Ionicons name="business-outline" size={16} color="#000000" />
                      </View>

                      <Text
                        className={`ml-3 text-[12px] font-black uppercase tracking-wider ${
                          selectedBusinessId === null ? 'text-black' : 'text-slate-500'
                        }`}
                        numberOfLines={1}
                      >
                        All Businesses
                      </Text>
                    </Pressable>

                    {/* Businesses */}
                    {businesses &&
                      businesses.length > 1 &&
                      businesses.map((biz) => (
                        <Pressable
                          key={biz.id}
                          onPress={() => {
                            setSelectedBusinessId(biz.id);
                            setShowBusinessMenu(false);
                          }}
                          className={`flex-row items-center px-3 py-3 rounded-2xl mt-1 ${
                            selectedBusinessId === biz.id ? 'bg-slate-100' : 'bg-white'
                          }`}
                        >
                          {businessImages[biz.id] ? (
                            <Image
                              source={{ uri: businessImages[biz.id] }}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                              }}
                            />
                          ) : (
                            <View className="w-8 h-8 rounded-full bg-slate-900 items-center justify-center">
                              <Text className="text-white font-bold text-[10px]">
                                {biz.owner_name
                                  ? biz.owner_name.charAt(0)
                                  : biz.salon_name
                                    ? biz.salon_name.charAt(0)
                                    : 'O'}
                              </Text>
                            </View>
                          )}

                          <Text
                            className={`ml-3 flex-1 text-[12px] font-black uppercase tracking-wider ${
                              selectedBusinessId === biz.id ? 'text-black' : 'text-slate-500'
                            }`}
                            numberOfLines={1}
                          >
                            {biz.salon_name}
                          </Text>

                          {selectedBusinessId === biz.id && (
                            <Ionicons name="checkmark-circle" size={18} color="#111827" />
                          )}
                        </Pressable>
                      ))}
                  </View>
                )}
              </View>
            </View>
          </AnimatedSection>

          {/* Stats Grid (2 x 2 Layout) */}
          <View className="px-luxury mb-8">
            {/* First Row */}
            <View className="flex-row gap-x-2 mb-4">
              {/* Active Businesses */}
              <AnimatedSection delay={200} direction="left" className="flex-1">
                <GlassCard className="p-5 border border-slate-200/80 rounded-[28px] overflow-hidden relative min-h-[170px] justify-between">
                  <View className="absolute -top-5 -right-5 w-24 h-24 bg-slate-100 rounded-full opacity-80" />

                  <View className="flex-row items-center gap-1">
                    <Ionicons name="business-outline" size={22} color="#111827" />

                    <Text className="text-slate-500 text-[11px] font-extrabold uppercase tracking-[2px]">
                      Active Businesses
                    </Text>
                  </View>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={34} width={70} />
                  ) : (
                    <Text className="text-slate-900 text-[48px] font-black leading-none mt-6">
                      {stats?.total_businesses || '0'}
                    </Text>
                  )}
                </GlassCard>
              </AnimatedSection>

              {/* Total Bookings */}
              <AnimatedSection delay={300} direction="right" className="flex-1">
                <GlassCard className="p-5 border border-slate-200/80 rounded-[28px] overflow-hidden relative min-h-[170px] justify-between">
                  <View className="absolute -top-5 -right-5 w-24 h-24 bg-slate-100 rounded-full opacity-80" />

                  <View className="flex-row items-center gap-2">
                    <Ionicons name="calendar-outline" size={22} color="#111827" />

                    <Text className="text-slate-500 text-[11px] font-extrabold uppercase tracking-[2px]">
                      Total Bookings
                    </Text>
                  </View>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={34} width={70} />
                  ) : (
                    <Text className="text-slate-900 text-[48px] font-black leading-none mt-6">
                      {stats?.total_bookings || '0'}
                    </Text>
                  )}
                </GlassCard>
              </AnimatedSection>
            </View>

            {/* Second Row */}
            <View className="flex-row gap-x-2">
              {/* Confirmed */}
              <AnimatedSection delay={400} direction="left" className="flex-1">
                <GlassCard className="p-5 border border-slate-200/80 rounded-[28px] overflow-hidden relative min-h-[170px] justify-between">
                  <View className="absolute -top-5 -right-5 w-24 h-24 bg-slate-100 rounded-full opacity-80" />

                  <View className="flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle-outline" size={22} color="#111827" />

                    <Text className="text-slate-500 text-[11px] font-extrabold uppercase tracking-[2px]">
                      Confirmed
                    </Text>
                  </View>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={34} width={70} />
                  ) : (
                    <Text className="text-slate-900 text-[48px] font-black leading-none mt-6">
                      {stats?.confirmed_bookings || '0'}
                    </Text>
                  )}
                </GlassCard>
              </AnimatedSection>

              {/* Pending */}
              <AnimatedSection delay={500} direction="right" className="flex-1">
                <GlassCard className="p-5 border border-slate-200/80 rounded-[28px] overflow-hidden relative min-h-[170px] justify-between">
                  <View className="absolute -top-5 -right-5 w-24 h-24 bg-slate-100 rounded-full opacity-80" />

                  <View className="flex-row items-center gap-2">
                    <Ionicons name="time-outline" size={22} color="#111827" />

                    <Text className="text-slate-500 text-[11px] font-extrabold uppercase tracking-[2px]">
                      Pending
                    </Text>
                  </View>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={34} width={70} />
                  ) : (
                    <Text className="text-slate-900 text-[48px] font-black leading-none mt-6">
                      {stats?.pending_bookings || '0'}
                    </Text>
                  )}
                </GlassCard>
              </AnimatedSection>
            </View>
          </View>

          {/* Recent Bookings Section */}
          <View className="px-luxury">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-slate-900 text-xl font-black uppercase tracking-tight">
                  {statusFilter === 'all' ? 'Business Bookings' : `${statusFilter} Hub`}
                </Text>
                <View className="h-1 w-8 bg-black rounded-full mt-1" />
              </View>
              <Pressable
                onPress={() => router.push('/(owner)/bookings')}
                className="px-4 py-2 rounded-full border border-slate-200"
              >
                <Text className="text-black font-black text-[10px] uppercase tracking-widest">
                  See All
                </Text>
              </Pressable>
            </View>

            {isLoading ? (
              <View>
                <LoadingSkeleton height={120} borderRadius={28} className="mb-4" />
                <LoadingSkeleton height={120} borderRadius={28} />
              </View>
            ) : (
              <FlatList
                data={filteredBookings.slice(0, 10)}
                renderItem={renderBookingItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={{
                  flexGrow: 1,
                }}
                ListEmptyComponent={
                  <View className="w-full items-center justify-center py-16">
                    <AnimatedSection direction="up" className="w-full items-center justify-center">
                      <GlassCard className="w-full h-[420px] p-10 items-center justify-center border-dashed border-slate-200">
                        <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-6">
                          <Ionicons name="calendar-clear-outline" size={48} color="#94A3B8" />
                        </View>

                        <Text className="text-slate-900 text-lg text-center font-bold mb-2">
                          No bookings yet
                        </Text>

                        <Text className="text-slate-500 text-sm text-center leading-7 max-w-[260px]">
                          Your upcoming customer bookings will appear here once appointments are
                          scheduled.
                        </Text>
                      </GlassCard>
                    </AnimatedSection>
                  </View>
                }
              />
            )}
          </View>
        </ScrollView>

        <OwnerBookingDetailModal
          visible={showDetailModal}
          booking={selectedBooking}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBooking(null);
          }}
          onAccept={handleAccept}
          onReject={handleReject}
          onUndoAccept={handleUndoAccept}
          onUndoReject={handleUndoReject}
          onNoShow={handleNoShow}
        />
      </SafeAreaView>
    </PremiumBackground>
  );
}
