import React, { useState, useMemo, useEffect } from 'react'; import {
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
import {
  useOwnerBusinesses,
  useOwnerDashboard
} from '@/hooks/useOwner';
import { apiService } from '@/services/api.service';
import {
  useAcceptBooking,
  useRejectBooking,
  useUndoAccept,
  useUndoReject,
  useMarkNoShow
} from '@/hooks/useBookings';
import { Booking } from '@/types/booking.types';
import { BusinessStats } from '@/types/business.types';
import { Badge } from '@/components/Badge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import { BookingCard } from '@/components/owner/BookingCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { OwnerBookingDetailModal } from '@/components/owner/OwnerBookingDetailModal';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export default function OwnerDashboardScreen() {
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
              const signed = await apiService.getSignedUrl(
                businessAny.cover_media_id
              );

              if (signed?.url) {
                imageMap[biz.id] = signed.url;
              }
            }
          } catch (e) {
            const { logger, LogTag } = require('@/utils/logger');
            logger.error(LogTag.API, 'Failed loading business image');
          }
        })
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

    return Array.from(
      new Map(merged.map((b: any) => [b.id, b])).values()
    ) as Booking[];
  }, [dashboard]);

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    return bookings.filter((booking: Booking) => {
      const matchesSearch = !searchTerm ||
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
      { text: 'Confirm', onPress: () => acceptBooking(id) }
    ]);
  };

  const handleReject = (id: string) => {
    Alert.alert('Decline Booking', 'Are you sure you want to reject this reservation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => rejectBooking(id) }
    ]);
  };

  const handleUndoAccept = (id: string) => {
    Alert.alert('Undo Approval', 'Revert this booking back to pending status?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Undo', onPress: () => undoAccept(id) }
    ]);
  };

  const handleUndoReject = (id: string) => {
    Alert.alert('Undo Rejection', 'Revert this booking back to pending status?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Undo', onPress: () => undoReject(id) }
    ]);
  };

  const handleNoShow = (id: string) => {
    Alert.alert('Mark No-Show', 'Mark this client as a no-show for their appointment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: () => markNoShow(id) }
    ]);
  };

  const renderBookingItem = ({
    item,
    index,
  }: {
    item: Booking;
    index: number;
  }) => {
    return (
      <BookingCard
        item={item}
        index={index}
        businessImage={
          businessImages[
          item.business?.id || item.business_id
          ]
        }
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
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#000000" />
          }
          contentContainerClassName="pb-12"
        >
          {/* Dashboard Header */}
          <AnimatedSection direction="down" className="px-luxury pt-4 pb-6">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-1">Welcome back</Text>
            <Text className="text-slate-900 text-3xl font-black tracking-tight">Dashboard</Text>
          </AnimatedSection>

          {/* Search & Filters */}
          <AnimatedSection delay={100} direction="up" className="px-luxury mb-8">
            <View className="flex-row items-center bg-white/80 border border-slate-200/80 rounded-2xl px-4 py-3.5 mb-4 shadow-sm">
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

            {/* Business Filter */}
            {businesses && businesses.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-x-2"
              >
                <Pressable
                  onPress={() => setSelectedBusinessId(null)}
                  className={`px-4 py-2.5 rounded-xl border ${selectedBusinessId === null
                    ? 'bg-black border-black'
                    : 'bg-white/80 border-slate-200/80'
                    }`}
                >
                  <Text
                    className={`text-[10px] font-black uppercase tracking-wider ${selectedBusinessId === null
                      ? 'text-white'
                      : 'text-slate-500'
                      }`}
                  >
                    All Businesses
                  </Text>
                </Pressable>

                {businesses.map((biz) => (
                  <Pressable
                    key={biz.id}
                    onPress={() => setSelectedBusinessId(biz.id)}
                    className={`flex-row items-center px-4 py-2.5 rounded-xl border ${selectedBusinessId === biz.id
                      ? 'bg-black border-black'
                      : 'bg-white/80 border-slate-200/80'
                      }`}
                  >
                    {businessImages[biz.id] ? (
                      <Image
                        source={{ uri: businessImages[biz.id] }}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                        }}
                      />
                    ) : (
                      <View className="w-5 h-5 rounded-full bg-slate-900 items-center justify-center border border-slate-200 shadow-sm">
                        <Text className="text-white font-bold text-[8px]">
                          {biz.owner_name ? biz.owner_name.charAt(0) : biz.salon_name ? biz.salon_name.charAt(0) : 'O'}
                        </Text>
                      </View>
                    )}

                    <Text
                      className={`text-[10px] font-black uppercase tracking-wider ml-2 ${selectedBusinessId === biz.id
                        ? 'text-white'
                        : 'text-slate-500'
                        }`}
                    >
                      {biz.salon_name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </AnimatedSection>

          {/* Stats Grid (4-Grid) */}
          <View className="px-luxury mb-8">
            <View className="flex-row gap-x-4 mb-4">
              <AnimatedSection delay={200} direction="left" className="flex-1">
                <GlassCard className="p-5 border-slate-200/80 items-start rounded-luxury overflow-hidden">
                  <View className="absolute -top-6 -right-6 w-16 h-16 bg-neutral-100 rounded-full" />
                  <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center mb-4 border border-neutral-200">
                    <Ionicons name="business" size={20} color="#000000" />
                  </View>
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Active Businesses</Text>
                  {bookingsLoading ? (
                    <LoadingSkeleton height={28} width={60} />
                  ) : (
                    <Text className="text-slate-900 text-3xl font-black">{stats?.total_businesses || '0'}</Text>
                  )}
                </GlassCard>
              </AnimatedSection>

              <AnimatedSection delay={300} direction="right" className="flex-1">
                <GlassCard className="p-5 border-slate-200/80 items-start rounded-luxury">
                  <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center mb-4 border border-neutral-200">
                    <Ionicons name="calendar" size={20} color="#000000" />
                  </View>
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Bookings</Text>
                  {bookingsLoading ? (
                    <LoadingSkeleton height={28} width={40} />
                  ) : (
                    <Text className="text-slate-900 text-3xl font-black">{stats?.total_bookings || '0'}</Text>
                  )}
                </GlassCard>
              </AnimatedSection>
            </View>

            <View className="flex-row gap-x-4">
              <AnimatedSection delay={400} direction="left" className="flex-1">
                <GlassCard className="p-5 border-slate-200/80 items-start rounded-luxury">
                  <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center mb-4 border border-neutral-200">
                    <Ionicons name="checkmark-circle" size={20} color="#000000" />
                  </View>
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Confirmed</Text>
                  {bookingsLoading ? (
                    <LoadingSkeleton height={28} width={40} />
                  ) : (
                    <Text className="text-slate-900 text-3xl font-black">{stats?.confirmed_bookings || '0'}</Text>
                  )}
                </GlassCard>
              </AnimatedSection>

              <AnimatedSection delay={500} direction="right" className="flex-1">
                <GlassCard className="p-5 border-slate-200/80 items-start rounded-luxury">
                  <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center mb-4 border border-neutral-200">
                    <Ionicons name="time" size={20} color="#000000" />
                  </View>
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Pending</Text>
                  {bookingsLoading ? (
                    <LoadingSkeleton height={28} width={40} />
                  ) : (
                    <Text className="text-slate-900 text-3xl font-black">{stats?.pending_bookings || '0'}</Text>
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
                className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm"
              >
                <Text className="text-black font-black text-[10px] uppercase tracking-widest">See All</Text>
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
                    <AnimatedSection
                      direction="up"
                      className="w-full items-center justify-center"
                    >
                      <GlassCard className="w-full h-[420px] p-10 items-center justify-center border-dashed border-slate-200">
                        <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-6">
                          <Ionicons
                            name="calendar-clear-outline"
                            size={48}
                            color="#94A3B8"
                          />
                        </View>

                        <Text className="text-slate-900 text-lg text-center font-bold mb-2">
                          No bookings yet
                        </Text>

                        <Text className="text-slate-500 text-sm text-center leading-7 max-w-[260px]">
                          Your upcoming customer bookings will appear here once appointments are scheduled.
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