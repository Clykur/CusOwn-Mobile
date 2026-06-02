import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, TextInput, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { BookingCard } from '@/features/owner/components/BookingCard';
import { OwnerBookingDetailModal } from '@/features/owner/components/OwnerBookingDetailModal';
import {
  useBookings,
  useConfirmBooking,
  useRejectBooking,
  useUndoConfirm,
  useUndoReject,
  useMarkNoShow,
} from '@/hooks/useBookings';
import { useModal } from '@/hooks/useModal';
import { useOwnerBusinesses } from '@/hooks/useOwner';
import { THEME } from '@/theme/theme';

import type { Booking } from '@/types/booking.types';

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';

// Reservations Hub
export default function OwnerBookingsScreen() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState<string>(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: bookings, isLoading, isError, refetch } = useBookings('Owner');
  const { data: businessesData } = useOwnerBusinesses();
  const { showModal } = useModal();
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = params.bookingId;

  // Handle deep-linked booking from notifications
  React.useEffect(() => {
    if (bookingId && bookings) {
      const b = bookings.find((b) => b.id === bookingId);
      if (b) {
        setSelectedBooking(b);
        setShowDetailModal(true);
        // Clear param so it doesn't reopen on subsequent renders
        router.setParams({ bookingId: '' });
      }
    }
  }, [bookingId, bookings]);

  // Synchronize selectedBooking with fresh data from the bookings list
  React.useEffect(() => {
    if (selectedBooking && bookings) {
      const fresh = bookings.find((b) => b.id === selectedBooking.id);
      if (fresh) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedBooking(fresh);
      }
    }
  }, [bookings, selectedBooking]);

  const { mutate: confirmBooking } = useConfirmBooking();
  const { mutate: rejectBooking } = useRejectBooking();
  const { mutate: undoConfirm } = useUndoConfirm();
  const { mutate: undoReject } = useUndoReject();
  const { mutate: markNoShow } = useMarkNoShow();

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

  const handleUndoAccept = (id: string) => {
    showModal({
      variant: 'warning',
      title: 'Undo Approval',
      description: 'Revert this booking back to pending status?',
      dismissible: true,
      actions: [{ label: 'Undo', variant: 'primary', onPress: () => undoConfirm(id) }],
    });
  };

  const handleUndoReject = (id: string) => {
    showModal({
      variant: 'warning',
      title: 'Undo Rejection',
      description: 'Revert this booking back to pending status?',
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

  const selectedBusinessName = React.useMemo(() => {
    if (selectedBusinessId === 'all') return 'All Hubs';
    return (
      businessesData?.find((b: { id: string; salon_name?: string }) => b.id === selectedBusinessId)
        ?.salon_name || 'Business'
    );
  }, [selectedBusinessId, businessesData]);

  // Compute exact human-readable date bounds for the filters
  const dateBounds = React.useMemo(() => {
    const now = new Date();

    const formatLabelDate = (d: Date) => {
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    };

    const getLocalDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${date}`;
    };

    // Week boundaries (Monday to Sunday)
    const day = now.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysSinceMonday);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      todayStr: getLocalDateString(now),
      weekStartStr: getLocalDateString(weekStart),
      weekEndStr: getLocalDateString(weekEnd),
      monthStartStr: getLocalDateString(monthStart),
      monthEndStr: getLocalDateString(monthEnd),
      todayLabel: formatLabelDate(now),
      weekLabel: `${formatLabelDate(weekStart)} - ${formatLabelDate(weekEnd)}`,
      monthLabel: `${formatLabelDate(monthStart)} - ${formatLabelDate(monthEnd)}`,
    };
  }, []);

  const filterSummary = React.useMemo(() => {
    let dateStr = 'All Dates';
    if (dateFilter === 'today') dateStr = `Today (${dateBounds.todayLabel})`;
    else if (dateFilter === 'week') dateStr = `This Week (${dateBounds.weekLabel})`;
    else if (dateFilter === 'month') dateStr = `This Month (${dateBounds.monthLabel})`;
    else if (dateFilter === 'custom') {
      dateStr =
        startDate || endDate
          ? `Custom: ${startDate || 'any'} to ${endDate || 'any'}`
          : 'Custom Date';
    }

    return `${selectedBusinessName} • ${dateStr}`;
  }, [selectedBusinessName, dateFilter, startDate, endDate, dateBounds]);

  const filteredBookings = React.useMemo(() => {
    if (!bookings) return [];

    // Helper to normalize double-digit date string components
    const normalizeDateStr = (dateStr: string) => {
      const parts = dateStr.trim().split('-');
      if (parts.length !== 3) return dateStr;
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const targetToday = normalizeDateStr(dateBounds.todayStr);
    const targetWeekStart = normalizeDateStr(dateBounds.weekStartStr);
    const targetWeekEnd = normalizeDateStr(dateBounds.weekEndStr);
    const targetMonthStart = normalizeDateStr(dateBounds.monthStartStr);
    const targetMonthEnd = normalizeDateStr(dateBounds.monthEndStr);

    return bookings.filter((b: Booking) => {
      // 1. Filter by Status (Case-Insensitive Match)
      if (filter !== 'all' && (b.status || '').toLowerCase() !== filter.toLowerCase()) {
        return false;
      }

      // 2. Filter by Selected Business Hub
      if (selectedBusinessId !== 'all' && b.business_id !== selectedBusinessId) {
        return false;
      }

      // 3. Filter by Date
      const bookingDateRaw = b.date;
      if (!bookingDateRaw) return dateFilter === 'all';

      // Trim and extract date component safely by split on either 'T' or space
      const bookingDate = normalizeDateStr(bookingDateRaw.trim().split(/[T ]/)[0]);

      if (dateFilter === 'today') {
        return bookingDate === targetToday;
      }

      if (dateFilter === 'week') {
        return bookingDate >= targetWeekStart && bookingDate <= targetWeekEnd;
      }

      if (dateFilter === 'month') {
        return bookingDate >= targetMonthStart && bookingDate <= targetMonthEnd;
      }

      if (dateFilter === 'custom') {
        if (startDate) {
          const targetStart = normalizeDateStr(startDate);
          if (bookingDate < targetStart) return false;
        }
        if (endDate) {
          const targetEnd = normalizeDateStr(endDate);
          if (bookingDate > targetEnd) return false;
        }
        return true;
      }

      return true; // 'all'
    });
  }, [bookings, filter, dateFilter, startDate, endDate, selectedBusinessId, dateBounds]);

  const renderBookingCard = ({ item, index }: { item: Booking; index: number }) => {
    return (
      <BookingCard
        item={item}
        index={index}
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

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Cinematic Header & Filter Action */}
        <View className="px-luxury pt-5 pb-2 flex-row justify-between items-center">
          <View className="flex-1 mr-4">
            <Text className="text-textSecondary text-xs font-black uppercase tracking-1 mb-1">
              Bookings
            </Text>
            <Text className="text-text text-3xl font-black tracking-tight">Appointments</Text>
            <Text className="text-textSecondary text-xs mt-1" numberOfLines={1}>
              {filterSummary}
            </Text>
          </View>
          <Pressable onPress={() => setShowFilter(true)} className="p-3 rounded-2xl">
            <Ionicons name="funnel-outline" size={20} color={THEME.colors.primary} />
          </Pressable>
        </View>

        {/* Custom Premium Header Tab Bar */}
        <View className="flex-row px-luxury pt-3 pb-1 border-b border-border bg-card/95 mt-2">
          {(['all', 'pending', 'confirmed', 'rejected'] as const).map((tab) => (
            <Pressable
              key={tab}
              className={`flex-1 py-3 items-center border-b-2 ${
                filter === tab ? 'border-primary' : 'border-transparent'
              }`}
              onPress={() => setFilter(tab)}
            >
              <Text
                className={`text-xs font-black uppercase tracking-wider ${
                  filter === tab ? 'text-primary' : 'text-textSecondary'
                }`}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View className="flex-1 px-luxury pt-6">
            <LoadingSkeleton height={140} borderRadius={20} className="mb-4" />
            <LoadingSkeleton height={140} borderRadius={20} className="mb-4" />
            <LoadingSkeleton height={140} borderRadius={20} />
          </View>
        ) : isError ? (
          <View className="flex-1 justify-center items-center px-luxury">
            <GlassCard className="items-center w-full bg-card border border-border p-6">
              <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.error} />
              <Text className="text-text text-lg font-bold mt-4 text-center">
                Failed to load your reservations
              </Text>
              <Pressable
                onPress={() => refetch()}
                className="mt-6 bg-primary border border-primary px-8 py-3 rounded-full"
              >
                <Text className="text-background font-bold uppercase tracking-widest text-xs">
                  Retry Connection
                </Text>
              </Pressable>
            </GlassCard>
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingCard}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-luxury pt-6 pb-24"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <AnimatedSection direction="up" className="items-center justify-center pt-24">
                <View className="w-20 h-20 items-center justify-center mb-6">
                  <Ionicons
                    name="calendar-clear-outline"
                    size={36}
                    color={THEME.colors.textSecondary}
                  />
                </View>
                <Text className="text-text text-xl font-black uppercase tracking-tight mb-2">
                  No Bookings Found
                </Text>
                <Text className="text-textSecondary text-center px-8 text-sm leading-relaxed">
                  No incoming entries matching the selected status, hub, and date filters.
                </Text>
              </AnimatedSection>
            }
          />
        )}

        {/* Unified Filter Modal */}
        <Modal
          visible={showFilter}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFilter(false)}
        >
          <Pressable
            className="flex-1 justify-end bg-black/70"
            onPress={() => setShowFilter(false)}
          >
            <View className="bg-card rounded-t-3xl p-6 border-t border-border max-h-full flex-1">
              <View className="items-center mb-6">
                <View className="w-12 h-1.5 bg-border rounded-full mb-6" />
                <Text className="text-text text-xl font-black uppercase tracking-wider">
                  Configure Filters
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
                {/* 1. Business Selection */}
                <Text className="text-xs text-textSecondary font-black uppercase tracking-0.5 mb-3">
                  Select Business
                </Text>

                <Pressable
                  onPress={() => setSelectedBusinessId('all')}
                  className={`px-4 py-3.5 border-b border-border flex-row items-center justify-between rounded-xl mb-2 ${selectedBusinessId === 'all' ? 'bg-input' : ''}`}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="grid-outline"
                      size={18}
                      color={
                        selectedBusinessId === 'all'
                          ? THEME.colors.primary
                          : THEME.colors.textSecondary
                      }
                    />
                    <Text
                      className={`text-sm ml-3 ${selectedBusinessId === 'all' ? 'text-primary font-extrabold' : 'text-textSecondary font-medium'}`}
                    >
                      All Hubs (Portfolio)
                    </Text>
                  </View>
                  {selectedBusinessId === 'all' && (
                    <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
                  )}
                </Pressable>

                {businessesData?.map((biz: { id: string; salon_name: string }) => (
                  <Pressable
                    key={biz.id}
                    onPress={() => setSelectedBusinessId(biz.id)}
                    className={`px-4 py-3.5 border-b border-border flex-row items-center justify-between rounded-xl mb-2 ${selectedBusinessId === biz.id ? 'bg-input' : ''}`}
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name="business-outline"
                        size={18}
                        color={
                          selectedBusinessId === biz.id
                            ? THEME.colors.primary
                            : THEME.colors.textSecondary
                        }
                      />
                      <Text
                        className={`text-sm ml-3 ${selectedBusinessId === biz.id ? 'text-primary font-extrabold' : 'text-textSecondary font-medium'}`}
                      >
                        {biz.salon_name}
                      </Text>
                    </View>
                    {selectedBusinessId === biz.id && (
                      <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
                    )}
                  </Pressable>
                ))}

                <View className="h-hairline bg-border my-5" />

                {/* 2. Date Selection */}
                <Text className="text-xs text-textSecondary font-black uppercase tracking-0.5 mb-3">
                  Select Period
                </Text>

                {(
                  [
                    { key: 'all', label: 'All Dates', icon: 'infinite-outline', desc: '' },
                    {
                      key: 'today',
                      label: 'Today',
                      icon: 'today-outline',
                      desc: dateBounds.todayLabel,
                    },
                    {
                      key: 'week',
                      label: 'This Week',
                      icon: 'calendar-outline',
                      desc: dateBounds.weekLabel,
                    },
                    {
                      key: 'month',
                      label: 'This Month',
                      icon: 'time-outline',
                      desc: dateBounds.monthLabel,
                    },
                    {
                      key: 'custom',
                      label: 'Custom Date Range',
                      icon: 'options-outline',
                      desc: '',
                    },
                  ] as const
                ).map((period) => (
                  <Pressable
                    key={period.key}
                    onPress={() => setDateFilter(period.key)}
                    className={`px-4 py-3.5 border-b border-border flex-row items-center justify-between rounded-xl mb-2 ${dateFilter === period.key ? 'bg-input' : ''}`}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons
                        name={period.icon}
                        size={18}
                        color={
                          dateFilter === period.key
                            ? THEME.colors.primary
                            : THEME.colors.textSecondary
                        }
                      />
                      <View className="ml-3 flex-1">
                        <Text
                          className={`text-sm ${dateFilter === period.key ? 'text-primary font-extrabold' : 'text-textSecondary font-medium'}`}
                        >
                          {period.label}
                        </Text>
                        {period.desc ? (
                          <Text className="text-textSecondary text-xs mt-0.5 font-semibold">
                            {period.desc}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {dateFilter === period.key && (
                      <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
                    )}
                  </Pressable>
                ))}

                {/* Custom Date Range Inputs */}
                {dateFilter === 'custom' && (
                  <View className="flex-row gap-x-2 mt-4 px-2">
                    <View className="flex-1">
                      <Text className="text-xs text-textSecondary font-bold uppercase tracking-wider mb-1.5">
                        Start Date
                      </Text>
                      <TextInput
                        value={startDate}
                        onChangeText={setStartDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={THEME.colors.textSecondary}
                        className="bg-input border border-border rounded-xl px-4 py-2.5 text-xs text-text"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-textSecondary font-bold uppercase tracking-wider mb-1.5">
                        End Date
                      </Text>
                      <TextInput
                        value={endDate}
                        onChangeText={setEndDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={THEME.colors.textSecondary}
                        className="bg-input border border-border rounded-xl px-4 py-2.5 text-xs text-text"
                      />
                    </View>
                  </View>
                )}
              </ScrollView>

              <Pressable
                onPress={() => setShowFilter(false)}
                className="bg-primary py-4 rounded-full items-center justify-center active:opacity-80"
              >
                <Text className="text-background font-black text-sm uppercase tracking-widest">
                  Apply & Close
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

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
