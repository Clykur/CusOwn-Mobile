import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  RefreshControl,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar';
import { useOwnerBusinesses, useOwnerDashboard } from '@/hooks/useOwner';
import {
  useConfirmBooking,
  useRejectBooking,
  useUndoConfirm,
  useUndoReject,
  useMarkNoShow,
} from '@/hooks/useBookings';
import { Booking } from '@/types/booking.types';
import { useModal } from '@/hooks/useModal';
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
  const { showModal } = useModal();

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
    showModal({
      variant: 'confirmation',
      title: 'Approve Booking',
      description: 'Are you sure you want to confirm this reservation?',
      dismissible: true,
      actions: [{ label: 'Confirm', variant: 'primary', onPress: () => confirmBooking(id) }],
    });
  };

  const handleReject = (id: string) => {
    showModal({
      variant: 'delete',
      title: 'Decline Booking',
      description: 'Are you sure you want to reject this reservation?',
      dismissible: true,
      actions: [{ label: 'Reject', variant: 'danger', onPress: () => rejectBooking(id) }],
    });
  };

  const handleUndoConfirm = (id: string) => {
    showModal({
      variant: 'warning',
      title: 'Undo Confirm',
      description: 'Are you sure you want to revert this to pending?',
      dismissible: true,
      actions: [{ label: 'Undo', variant: 'primary', onPress: () => undoConfirm(id) }],
    });
  };

  const handleUndoReject = (id: string) => {
    showModal({
      variant: 'warning',
      title: 'Undo Reject',
      description: 'Are you sure you want to revert this to pending?',
      dismissible: true,
      actions: [{ label: 'Undo', variant: 'primary', onPress: () => undoReject(id) }],
    });
  };

  const handleNoShow = (id: string) => {
    showModal({
      variant: 'delete',
      title: 'Mark No-Show',
      description: 'Mark this client as a no-show for their appointment?',
      dismissible: true,
      actions: [{ label: 'Confirm', variant: 'danger', onPress: () => markNoShow(id) }],
    });
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
              />
            </Pressable>
          </AnimatedSection>

          {/* Search & Filters */}
          <AnimatedSection delay={50} direction="up" className="px-luxury mb-8 z-50">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                gap: 12,
              }}
            >
              {/* Search Bar */}
              <View
                style={{
                  flex: 1,
                  height: 58,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  borderRadius: 22,
                  backgroundColor: THEME.colors.input,
                  borderWidth: 1,
                  borderColor: THEME.colors.border,

                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  elevation: 3,
                }}
              >
                {/* Search Icon */}
                <View
                  style={{
                    width: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="search-outline" size={20} color={THEME.colors.textSecondary} />
                </View>

                {/* Input */}
                <TextInput
                  placeholder="Search clients or services..."
                  placeholderTextColor={THEME.colors.textSecondary}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  returnKeyType="search"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    color: THEME.colors.text,
                    fontSize: 14,
                    fontWeight: '600',

                    paddingVertical: Platform.OS === 'ios' ? 14 : 10,

                    includeFontPadding: false,
                    textAlignVertical: 'center',
                  }}
                />

                {/* Clear Button */}
                {searchTerm.length > 0 && (
                  <Pressable
                    hitSlop={12}
                    onPress={() => setSearchTerm('')}
                    style={{
                      width: 26,
                      height: 26,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color={THEME.colors.textSecondary} />
                  </Pressable>
                )}
              </View>

              {/* Filter Button */}
              <Pressable
                hitSlop={12}
                onPress={() => setShowBusinessMenu(true)}
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',

                  backgroundColor: THEME.colors.input,

                  borderWidth: 1,
                  borderColor: THEME.colors.border,

                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  elevation: 3,
                }}
              >
                <Ionicons name="options-outline" size={20} color={THEME.colors.textSecondary} />
              </Pressable>

              {/* Bottom Sheet Modal */}
              <Modal
                visible={showBusinessMenu}
                transparent
                animationType="slide"
                statusBarTranslucent
                onRequestClose={() => setShowBusinessMenu(false)}
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    backgroundColor: 'rgba(0,0,0,0.45)',
                  }}
                >
                  {/* Backdrop */}
                  <Pressable
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                    onPress={() => setShowBusinessMenu(false)}
                  />

                  {/* Sheet */}
                  <View
                    style={{
                      backgroundColor: THEME.colors.card,
                      borderTopLeftRadius: 32,
                      borderTopRightRadius: 32,
                      paddingHorizontal: 20,
                      paddingTop: 14,
                      paddingBottom: 42,
                      minHeight: 320,
                      borderTopWidth: 1,
                      borderColor: THEME.colors.border,
                    }}
                  >
                    {/* Handle */}
                    <View
                      style={{
                        alignItems: 'center',
                        marginBottom: 24,
                      }}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 5,
                          borderRadius: 999,
                          backgroundColor: THEME.colors.border,
                        }}
                      />
                    </View>

                    {/* Header */}
                    <Text
                      style={{
                        color: THEME.colors.text,
                        fontSize: 22,
                        fontWeight: '900',
                        marginBottom: 24,
                        letterSpacing: -0.5,
                      }}
                    >
                      Select Business
                    </Text>

                    {/* All Businesses */}
                    <Pressable
                      onPress={() => {
                        setSelectedBusinessId(null);
                        setShowBusinessMenu(false);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 16,
                        paddingHorizontal: 4,
                      }}
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
                        style={{
                          flex: 1,
                          marginLeft: 16,
                          fontSize: 14,
                          fontWeight: '900',
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          color:
                            selectedBusinessId === null
                              ? THEME.colors.primary
                              : THEME.colors.textSecondary,
                        }}
                      >
                        All Businesses
                      </Text>

                      {selectedBusinessId === null && (
                        <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
                      )}
                    </Pressable>

                    <View
                      style={{
                        height: 1,
                        backgroundColor: THEME.colors.border,
                        marginVertical: 4,
                      }}
                    />

                    {/* Business List */}
                    {businesses?.map((biz) => (
                      <Pressable
                        key={biz.id}
                        onPress={() => {
                          setSelectedBusinessId(biz.id);
                          setShowBusinessMenu(false);
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 16,
                          paddingHorizontal: 4,
                        }}
                      >
                        <Avatar
                          userId={biz.owner_user_id}
                          name={biz.owner_name || biz.salon_name || 'Owner'}
                          size={40}
                        />

                        <View
                          style={{
                            flex: 1,
                            marginLeft: 16,
                          }}
                        >
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 14,
                              fontWeight: '900',
                              letterSpacing: 1,
                              textTransform: 'uppercase',

                              color:
                                selectedBusinessId === biz.id
                                  ? THEME.colors.primary
                                  : THEME.colors.textSecondary,
                            }}
                          >
                            {biz.salon_name}
                          </Text>
                        </View>

                        {selectedBusinessId === biz.id && (
                          <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
                        )}
                      </Pressable>
                    ))}
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
