import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useBookings,
  useAcceptBooking,
  useRejectBooking,
  useUndoAccept,
  useUndoReject,
  useMarkNoShow
} from '@/hooks/useBookings';
import { useOwnerBusinesses } from '@/hooks/useOwner';
import { Booking } from '@/types/booking.types';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import { BookingCard } from '@/components/owner/BookingCard';

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';

// Reservations Hub
export default function OwnerBookingsScreen() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState<string>(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('all');
  const [showFilter, setShowFilter] = useState(false);

  const { data: bookings, isLoading, isError, refetch } = useBookings('Owner');
  const { data: businessesData } = useOwnerBusinesses();

  const { mutate: acceptBooking } = useAcceptBooking();
  const { mutate: rejectBooking } = useRejectBooking();
  const { mutate: undoAccept } = useUndoAccept();
  const { mutate: undoReject } = useUndoReject();
  const { mutate: markNoShow } = useMarkNoShow();

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

  const selectedBusinessName = React.useMemo(() => {
    if (selectedBusinessId === 'all') return 'All Hubs';
    return businessesData?.find((b: any) => b.id === selectedBusinessId)?.salon_name || 'Business';
  }, [selectedBusinessId, businessesData]);

  // Compute exact human-readable date bounds for the filters
  const dateBounds = React.useMemo(() => {
    const now = new Date();

    const formatLabelDate = (d: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
      monthLabel: `${formatLabelDate(monthStart)} - ${formatLabelDate(monthEnd)}`
    };
  }, []);

  const filterSummary = React.useMemo(() => {
    let dateStr = 'All Dates';
    if (dateFilter === 'today') dateStr = `Today (${dateBounds.todayLabel})`;
    else if (dateFilter === 'week') dateStr = `This Week (${dateBounds.weekLabel})`;
    else if (dateFilter === 'month') dateStr = `This Month (${dateBounds.monthLabel})`;
    else if (dateFilter === 'custom') {
      dateStr = (startDate || endDate)
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
        onAccept={handleAccept}
        onReject={handleReject}
        onUndoAccept={handleUndoAccept}
        onUndoReject={handleUndoReject}
        onNoShow={handleNoShow}
      />
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Hub Header & Status Filters */}
        <View className="px-luxury pt-6 pb-5 bg-white border-b border-slate-200">
          <View className="flex-row justify-between items-end mb-5">
            <View className="flex-1 mr-4">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-1">Bookings</Text>
              <Text className="text-slate-900 text-3xl font-extrabold tracking-tight" numberOfLines={1}>
                Bookings
              </Text>
              <Text className="text-slate-500 text-xs mt-1" numberOfLines={1}>
                {filterSummary}
              </Text>
            </View>
            <Pressable
              onPress={() => setShowFilter(true)}
              className="bg-slate-50 p-3 rounded-2xl border border-slate-200 active:bg-slate-100"
            >
              <Ionicons name="funnel-outline" size={20} color="#334155" />
            </Pressable>
          </View>

          {/* Status Filters */}
          <View className="flex-row gap-x-2">
            {(['all', 'pending', 'confirmed', 'rejected'] as const).map((tab) => (
              <Pressable
                key={tab}
                className={`flex-1 py-2.5 items-center rounded-full border ${filter === tab
                  ? 'bg-slate-900 border-slate-900'
                  : 'bg-slate-50 border-slate-200'
                  }`}
                onPress={() => setFilter(tab)}
              >
                <Text className={`text-[10px] font-black uppercase tracking-widest ${filter === tab ? 'text-white' : 'text-slate-600'
                  }`}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 px-luxury pt-6">
            <LoadingSkeleton height={130} borderRadius={28} className="mb-4" />
            <LoadingSkeleton height={130} borderRadius={28} className="mb-4" />
            <LoadingSkeleton height={130} borderRadius={28} />
          </View>
        ) : isError ? (
          <View className="flex-1 justify-center items-center px-luxury">
            <View className="bg-white border border-slate-200 items-center w-full p-8 rounded-2xl">
              <Ionicons name="alert-circle-outline" size={48} color="#000000" />
              <Text className="text-slate-900 text-lg font-extrabold mt-4 text-center">
                Failed to load hub reservations
              </Text>
              <Pressable
                onPress={() => refetch()}
                className="mt-8 bg-slate-900 border border-slate-900 px-10 py-4 rounded-full active:bg-slate-800"
              >
                <Text className="text-white font-bold uppercase tracking-widest text-xs">Retry Connection</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingCard}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-luxury pt-6 pb-12"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <AnimatedSection direction="up" className="items-center justify-center pt-24">
                <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-6">
                  <Ionicons name="calendar-clear-outline" size={40} color="#94A3B8" />
                </View>
                <Text className="text-slate-900 text-xl font-extrabold mb-2">No Results Found</Text>
                <Text className="text-slate-500 text-center px-12 text-sm font-medium">
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
            className="flex-1 justify-end"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
            onPress={() => setShowFilter(false)}
          >
            <View className="bg-white rounded-t-[40px] p-6 border-t border-slate-200 max-h-[90%]">
              <View className="items-center mb-6">
                <View className="w-12 h-1.5 bg-slate-200 rounded-full mb-6" />
                <Text className="text-slate-900 text-xl font-extrabold uppercase tracking-wider">Configure Filters</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
                {/* 1. Hub Selection */}
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Select Hub</Text>

                <Pressable
                  onPress={() => setSelectedBusinessId('all')}
                  className={`px-4 py-3.5 border-b border-slate-100 flex-row items-center justify-between rounded-xl mb-2 ${selectedBusinessId === 'all' ? 'bg-slate-50' : ''}`}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="grid-outline" size={18} color={selectedBusinessId === 'all' ? '#000000' : '#64748B'} />
                    <Text className={`text-sm ml-3 ${selectedBusinessId === 'all' ? 'text-slate-900 font-extrabold' : 'text-slate-600 font-medium'}`}>
                      All Hubs (Portfolio)
                    </Text>
                  </View>
                  {selectedBusinessId === 'all' && <Ionicons name="checkmark-circle" size={20} color="#000000" />}
                </Pressable>

                {businessesData?.map((biz: any) => (
                  <Pressable
                    key={biz.id}
                    onPress={() => setSelectedBusinessId(biz.id)}
                    className={`px-4 py-3.5 border-b border-slate-100 flex-row items-center justify-between rounded-xl mb-2 ${selectedBusinessId === biz.id ? 'bg-slate-50' : ''}`}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="business-outline" size={18} color={selectedBusinessId === biz.id ? '#000000' : '#64748B'} />
                      <Text className={`text-sm ml-3 ${selectedBusinessId === biz.id ? 'text-slate-900 font-extrabold' : 'text-slate-600 font-medium'}`}>
                        {biz.salon_name}
                      </Text>
                    </View>
                    {selectedBusinessId === biz.id && <Ionicons name="checkmark-circle" size={20} color="#000000" />}
                  </Pressable>
                ))}

                <View className="h-[1px] bg-slate-100 my-5" />

                {/* 2. Date Selection */}
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Select Period</Text>

                {([
                  { key: 'all', label: 'All Dates', icon: 'infinite-outline', desc: '' },
                  { key: 'today', label: 'Today', icon: 'today-outline', desc: dateBounds.todayLabel },
                  { key: 'week', label: 'This Week', icon: 'calendar-outline', desc: dateBounds.weekLabel },
                  { key: 'month', label: 'This Month', icon: 'time-outline', desc: dateBounds.monthLabel },
                  { key: 'custom', label: 'Custom Date Range', icon: 'options-outline', desc: '' }
                ] as const).map((period) => (
                  <Pressable
                    key={period.key}
                    onPress={() => setDateFilter(period.key)}
                    className={`px-4 py-3.5 border-b border-slate-100 flex-row items-center justify-between rounded-xl mb-2 ${dateFilter === period.key ? 'bg-slate-50' : ''}`}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons name={period.icon as any} size={18} color={dateFilter === period.key ? '#000000' : '#64748B'} />
                      <View className="ml-3 flex-1">
                        <Text className={`text-sm ${dateFilter === period.key ? 'text-slate-900 font-extrabold' : 'text-slate-600 font-medium'}`}>
                          {period.label}
                        </Text>
                        {period.desc ? (
                          <Text className="text-slate-400 text-[10px] mt-0.5 font-semibold">
                            {period.desc}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {dateFilter === period.key && <Ionicons name="checkmark-circle" size={20} color="#000000" />}
                  </Pressable>
                ))}

                {/* Custom Date Range Inputs */}
                {dateFilter === 'custom' && (
                  <View className="flex-row gap-x-2 mt-4 px-2">
                    <View className="flex-1">
                      <Text className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Start Date</Text>
                      <TextInput
                        value={startDate}
                        onChangeText={setStartDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">End Date</Text>
                      <TextInput
                        value={endDate}
                        onChangeText={setEndDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800"
                      />
                    </View>
                  </View>
                )}
              </ScrollView>

              <Pressable
                onPress={() => setShowFilter(false)}
                className="bg-slate-900 py-4 rounded-full items-center justify-center active:bg-slate-800"
              >
                <Text className="text-white font-extrabold text-sm uppercase tracking-widest">Apply & Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
