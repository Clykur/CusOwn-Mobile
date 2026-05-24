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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar';
import { useOwnerBusinesses, useOwnerDashboard } from '@/hooks/useOwner';
import { apiService } from '@/services/api.service';
import {
  useConfirmBooking,
  useRejectBooking,
  useUndoConfirm,
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
import { THEME } from '@/theme/theme';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export default function OwnerDashboardScreen() {
  const { profile, user, profileImageUrl } = useAuthStore();
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

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

  const { mutate: confirmBooking } = useConfirmBooking();
  const { mutate: rejectBooking } = useRejectBooking();
  const { mutate: undoConfirm } = useUndoConfirm();
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
      { text: 'Confirm', onPress: () => confirmBooking(id) },
    ]);
  };

  const handleReject = (id: string) => {
    Alert.alert('Decline Booking', 'Are you sure you want to reject this reservation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => rejectBooking(id) },
    ]);
  };

  const handleUndoConfirm = (id: string) => {
    Alert.alert('Undo Confirm', 'Are you sure you want to revert this to pending?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Undo', onPress: () => undoConfirm(id) },
    ]);
  };

  const handleUndoReject = (id: string) => {
    Alert.alert('Undo Reject', 'Are you sure you want to revert this to pending?', [
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
        businessId={item.business?.id || item.business_id}
        onPress={(booking) => {
          setSelectedBooking(booking);
          setShowDetailModal(true);
        }}
        onAccept={handleAccept}
        onReject={handleReject}
        onUndoAccept={handleUndoConfirm}
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
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              tintColor={THEME.colors.primary}
            />
          }
          contentContainerClassName="pb-12"
        >
          {/* Dashboard Header */}
          <AnimatedSection
            direction="down"
            className="px-luxury pt-4 pb-6 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-textSecondary text-[10px] font-black uppercase tracking-[3px] mb-1">
                Welcome back to
              </Text>
              <Text className="text-text text-3xl font-black tracking-tight">Dashboard</Text>
            </View>
            <Pressable onPress={() => router.push('/(owner)/settings')}>
              <Avatar
                userId={user?.id}
                name={profile?.full_name || user?.user_metadata?.full_name || 'Owner'}
                size={50}
                type="business"
                className="border-2 border-primary/30"
              />
            </Pressable>
          </AnimatedSection>

          {/* Search & Filters */}
          <AnimatedSection delay={50} direction="up" className="px-luxury mb-8 z-50">
            <View className="flex-row items-center gap-x-3">
              {/* Search Bar */}
              <View className="flex-1 flex-row items-center bg-input border border-border rounded-2xl px-4 py-3.5">
                <Ionicons name="search-outline" size={20} color={THEME.colors.textSecondary} />

                <TextInput
                  placeholder="Search clients or services..."
                  placeholderTextColor={THEME.colors.textSecondary}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  className="flex-1 ml-3 text-text text-sm font-semibold"
                />

                {searchTerm.length > 0 && (
                  <Pressable onPress={() => setSearchTerm('')}>
                    <Ionicons name="close-circle" size={18} color={THEME.colors.textSecondary} />
                  </Pressable>
                )}
              </View>

              {/* Filter Button */}
              <Pressable
                onPress={() => setShowBusinessMenu(true)}
                className="flex-row items-center bg-input border border-border rounded-2xl px-4 py-3.5"
              >
                <Ionicons name="options-outline" size={20} color={THEME.colors.textSecondary} />
              </Pressable>

              {/* Bottom Sheet Modal */}
              <Modal
                visible={showBusinessMenu}
                transparent
                animationType="slide"
                onRequestClose={() => setShowBusinessMenu(false)}
              >
                <View className="flex-1 justify-end">
                  {/* Backdrop */}
                  <Pressable
                    className="absolute inset-0"
                    onPress={() => setShowBusinessMenu(false)}
                  />

                  {/* Sheet */}
                  <View
                    className="bg-card rounded-t-[32px] px-5 pt-4 pb-10 border-t border-border"
                    style={{
                      minHeight: 320,
                    }}
                  >
                    {/* Handle */}
                    <View className="items-center mb-6">
                      <View className="w-14 h-1.5 rounded-full bg-border" />
                    </View>

                    {/* Header */}
                    <Text className="text-text text-xl font-black tracking-tight mb-6">
                      Select Business
                    </Text>

                    {/* All Businesses */}
                    <Pressable
                      onPress={() => {
                        setSelectedBusinessId(null);
                        setShowBusinessMenu(false);
                      }}
                      className="flex-row items-center px-2 py-4"
                    >
                      <Ionicons
                        name="business-outline"
                        size={20}
                        color={
                          selectedBusinessId === null
                            ? THEME.colors.primary
                            : THEME.colors.textSecondary
                        }
                      />

                      <Text
                        className={`ml-4 flex-1 text-sm font-black uppercase tracking-wider ${
                          selectedBusinessId === null ? 'text-primary' : 'text-textSecondary'
                        }`}
                      >
                        All Businesses
                      </Text>

                      {selectedBusinessId === null && (
                        <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
                      )}
                    </Pressable>

                    <View className="h-px bg-border my-1" />

                    {/* Businesses */}
                    {businesses?.length === 1 ? (
                      <Pressable
                        onPress={() => {
                          setSelectedBusinessId(businesses[0].id);
                          setShowBusinessMenu(false);
                        }}
                        className="flex-row items-center px-2 py-4"
                      >
                        <Ionicons name="business-outline" size={20} color={THEME.colors.primary} />

                        <View className="flex-1 ml-4">
                          <Text
                            className="text-sm font-black uppercase tracking-wider text-primary"
                            numberOfLines={1}
                          >
                            {businesses[0].salon_name}
                          </Text>
                        </View>

                        <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
                      </Pressable>
                    ) : (
                      <>
                        {/* All Businesses */}
                        <Pressable
                          onPress={() => {
                            setSelectedBusinessId(null);
                            setShowBusinessMenu(false);
                          }}
                          className="flex-row items-center px-2 py-4"
                        >
                          <Ionicons
                            name="business-outline"
                            size={20}
                            color={
                              selectedBusinessId === null
                                ? THEME.colors.primary
                                : THEME.colors.textSecondary
                            }
                          />

                          <Text
                            className={`ml-4 flex-1 text-sm font-black uppercase tracking-wider ${
                              selectedBusinessId === null ? 'text-primary' : 'text-textSecondary'
                            }`}
                          >
                            All Businesses
                          </Text>

                          {selectedBusinessId === null && (
                            <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
                          )}
                        </Pressable>

                        <View className="h-px bg-border my-1" />

                        {/* Business List */}
                        {businesses?.map((biz) => (
                          <Pressable
                            key={biz.id}
                            onPress={() => {
                              setSelectedBusinessId(biz.id);
                              setShowBusinessMenu(false);
                            }}
                            className="flex-row items-center px-2 py-4"
                          >
                            <Avatar
                              userId={biz.owner_user_id}
                              name={biz.owner_name || biz.salon_name || 'Owner'}
                              size={38}
                            />

                            <View className="flex-1 ml-4">
                              <Text
                                className={`text-sm font-black uppercase tracking-wider ${
                                  selectedBusinessId === biz.id
                                    ? 'text-primary'
                                    : 'text-textSecondary'
                                }`}
                                numberOfLines={1}
                              >
                                {biz.salon_name}
                              </Text>
                            </View>

                            {selectedBusinessId === biz.id && (
                              <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
                            )}
                          </Pressable>
                        ))}
                      </>
                    )}
                  </View>
                </View>
              </Modal>
            </View>
          </AnimatedSection>

          {/* Stats Grid (2 x 2 Layout) */}
          <View className="px-luxury mb-8">
            {/* First Row */}
            <View className="flex-row gap-x-2 mb-4">
              {/* Active Businesses */}
              <AnimatedSection delay={200} direction="left" className="flex-1">
                <GlassCard className="p-5 border border-border rounded-[28px] overflow-hidden relative min-h-[170px] justify-between">
                  <View className="absolute -top-5 -right-5 w-24 h-24 bg-input rounded-full opacity-60" />

                  <View className="flex-row items-center gap-1">
                    <Ionicons name="business-outline" size={22} color={THEME.colors.primary} />

                    <Text className="text-textSecondary text-[11px] font-extrabold uppercase tracking-[2px]">
                      Active Businesses
                    </Text>
                  </View>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={34} width={70} />
                  ) : (
                    <Text className="text-text text-[48px] font-black leading-none mt-6">
                      {stats?.total_businesses || '0'}
                    </Text>
                  )}
                </GlassCard>
              </AnimatedSection>

              {/* Total Bookings */}
              <AnimatedSection delay={300} direction="right" className="flex-1">
                <GlassCard className="p-5 border border-border rounded-[28px] overflow-hidden relative min-h-[170px] justify-between">
                  <View className="absolute -top-5 -right-5 w-24 h-24 bg-input rounded-full opacity-60" />

                  <View className="flex-row items-center gap-2">
                    <Ionicons name="calendar-outline" size={22} color={THEME.colors.primary} />

                    <Text className="text-textSecondary text-[11px] font-extrabold uppercase tracking-[2px]">
                      Total Bookings
                    </Text>
                  </View>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={34} width={70} />
                  ) : (
                    <Text className="text-text text-[48px] font-black leading-none mt-6">
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
                <GlassCard className="p-5 border border-border rounded-[28px] overflow-hidden relative min-h-[170px] justify-between">
                  <View className="absolute -top-5 -right-5 w-24 h-24 bg-input rounded-full opacity-60" />

                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={22}
                      color={THEME.colors.success}
                    />

                    <Text className="text-textSecondary text-[11px] font-extrabold uppercase tracking-[2px]">
                      Confirmed
                    </Text>
                  </View>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={34} width={70} />
                  ) : (
                    <Text className="text-text text-[48px] font-black leading-none mt-6">
                      {stats?.confirmed_bookings || '0'}
                    </Text>
                  )}
                </GlassCard>
              </AnimatedSection>

              {/* Pending */}
              <AnimatedSection delay={500} direction="right" className="flex-1">
                <GlassCard className="p-5 border border-border rounded-[28px] overflow-hidden relative min-h-[170px] justify-between">
                  <View className="absolute -top-5 -right-5 w-24 h-24 bg-input rounded-full opacity-60" />

                  <View className="flex-row items-center gap-2">
                    <Ionicons name="time-outline" size={22} color={THEME.colors.warning} />

                    <Text className="text-textSecondary text-[11px] font-extrabold uppercase tracking-[2px]">
                      Pending
                    </Text>
                  </View>

                  {bookingsLoading ? (
                    <LoadingSkeleton height={34} width={70} />
                  ) : (
                    <Text className="text-text text-[48px] font-black leading-none mt-6">
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
                <Text className="text-text text-xl font-black uppercase tracking-tight">
                  {statusFilter === 'all' ? 'Business Bookings' : `${statusFilter} Hub`}
                </Text>
                <View className="h-1 w-8 bg-primary rounded-full mt-1" />
              </View>
              <Pressable
                onPress={() => router.push('/(owner)/bookings')}
                className="px-4 py-2 rounded-full"
              >
                <Text className="text-primary font-black text-[10px] uppercase tracking-widest">
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
                      <GlassCard className="w-full h-[420px] p-10 items-center justify-center border-dashed border-border">
                        <View className="items-center justify-center mb-6">
                          <Ionicons
                            name="calendar-clear-outline"
                            size={48}
                            color={THEME.colors.textSecondary}
                          />
                        </View>

                        <Text className="text-text text-lg text-center font-bold mb-2">
                          No bookings yet
                        </Text>

                        <Text className="text-textSecondary text-sm text-center leading-7 max-w-[260px]">
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
          onUndoAccept={handleUndoConfirm}
          onUndoReject={handleUndoReject}
          onNoShow={handleNoShow}
        />
      </SafeAreaView>
    </PremiumBackground>
  );
}
