import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useBookingStore } from '@/store/booking.store';
import { useSlots } from '@/hooks/useSlots';
import { Slot } from '@/types/slot.types';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useBusinessHours } from '@/hooks/useBusinessHours';
import { useRealtimeClock } from '@/features/booking/hooks/useRealtimeClock';
import { getDefaultBookingDate } from '@/utils/shopTime';
import { queryClient } from '@/lib/queryClient';
import { queryKeys } from '@/lib/queryClient';

export default function SelectSlotScreen() {
  const { selectedBusiness, selectedService, setSlot } = useBookingStore();

  // ─── Live clock — ticks every minute, fires exactly at midnight ──────────────
  // Pass selectedBusiness?.timezone here once that column exists.
  const clock = useRealtimeClock(/* selectedBusiness?.timezone */);

  // ─── Selected date — defaults to today; corrected once business hours load ───
  const [selectedDate, setSelectedDate] = useState<string>(clock.todayStr);

  // Animated value for the shop-closed banner slide-in
  const bannerAnim = React.useRef(new Animated.Value(0)).current;

  const { data: slots, isLoading, isError } = useSlots(selectedBusiness?.id ?? null, selectedDate);
  const { data: businessHours } = useBusinessHours(selectedBusiness?.id ?? null, selectedDate);

  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.colors : THEME.colors;

  // ─── Shop-closed detection (driven by live clock) ─────────────────────────────
  const isShopClosed = useMemo(() => {
    if (!businessHours) return false;
    if (businessHours.isClosed) return true;
    if (!businessHours.closing_time) return false;

    // Only flag as "closed" when the selected day is today
    const isToday = selectedDate === clock.todayStr;
    if (!isToday) return false;

    const closingMinutes = businessHours.closing_time
      .split(':')
      .slice(0, 2)
      .reduce((acc, v, i) => acc + (i === 0 ? Number(v) * 60 : Number(v)), 0);

    const currentMinutes = clock.now.hour() * 60 + clock.now.minute();
    return currentMinutes >= closingMinutes;
  }, [clock.now, clock.todayStr, selectedDate, businessHours]);

  // ─── Auto-advance to tomorrow when shop is closed ────────────────────────────
  useEffect(() => {
    if (isShopClosed && selectedDate === clock.todayStr) {
      const tomorrow = dayjs(clock.todayStr).add(1, 'day').format('YYYY-MM-DD');
      setSelectedDate(tomorrow);
    }
  }, [isShopClosed, selectedDate, clock.todayStr]);

  // ─── Midnight rollover: auto-advance selectedDate when clock rolls over ───────
  useEffect(() => {
    // When the date rolls over (todayStr changes), if the user was still on the
    // previous "today" we advance them to the new today and invalidate slots.
    setSelectedDate((prev) => {
      const prevDay = dayjs(prev);
      const newToday = dayjs(clock.todayStr);
      // If prev was "yesterday" relative to the new today, move to new today
      if (newToday.isAfter(prevDay, 'day')) {
        // Invalidate stale slot caches from the old day
        queryClient.invalidateQueries({ queryKey: queryKeys.slots.all() });
        return clock.todayStr;
      }
      return prev;
    });
  }, [clock.todayStr]);

  // ─── Default date correction once business hours are known ───────────────────
  useEffect(() => {
    if (!businessHours || businessHours.isClosed) return;
    const correct = getDefaultBookingDate(
      businessHours.closing_time ?? null,
      /* selectedBusiness?.timezone */
    );
    setSelectedDate((prev) => {
      // Only move forward, never backward
      return dayjs(correct).isAfter(dayjs(prev), 'day') ? correct : prev;
    });
  }, [businessHours]);

  // ─── Banner animation ─────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(bannerAnim, {
      toValue: isShopClosed ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isShopClosed, bannerAnim]);

  // ─── Date strip (14 days from today) ─────────────────────────────────────────
  const datesList = useMemo(() => {
    const list = [];
    const base = dayjs(clock.todayStr); // Always start from today per clock
    for (let i = 0; i < 14; i++) {
      const d = base.add(i, 'day');
      list.push({
        iso: d.format('YYYY-MM-DD'),
        dayOfWeek: d.format('ddd'),
        dayNum: d.date(),
        monthStr: d.format('MMM'),
        isToday: i === 0,
      });
    }
    return list;
  }, [clock.todayStr]);

  if (!selectedBusiness || !selectedService) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorMsg, { color: theme.text }]}>Missing booking criteria.</Text>
        <TouchableOpacity className="mt-3" onPress={() => router.back()}>
          <Text className="font-semibold" style={{ color: theme.primary }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSlotPress = (slot: Slot) => {
    if (!slot.is_available) return;
    setSlot(slot);
    router.push('/booking/confirm');
  };

  const handleDateSelect = useCallback((iso: string) => {
    setSelectedDate(iso);
  }, []);

  // ─── Render helpers ───────────────────────────────────────────────────────────

  const renderDateItem = ({ item }: { item: (typeof datesList)[0] }) => {
    const isSelected = item.iso === selectedDate;
    return (
      <TouchableOpacity
        style={[
          styles.dateCard,
          { backgroundColor: theme.card, borderColor: theme.border },
          isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
        ]}
        onPress={() => handleDateSelect(item.iso)}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.dateDay, { color: isSelected ? THEME.colors.text : theme.textSecondary }]}
        >
          {item.isToday ? 'Today' : item.dayOfWeek}
        </Text>
        <Text style={[styles.dateNum, { color: isSelected ? THEME.colors.text : theme.text }]}>
          {item.dayNum}
        </Text>
        <Text
          style={[
            styles.dateMonth,
            { color: isSelected ? THEME.colors.text : theme.textSecondary },
          ]}
        >
          {item.monthStr}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSlotItem = ({ item }: { item: Slot }) => {
    const timeStr = dayjs(`${item.date}T${item.time}`).format('h:mm A');
    const isBooked = !item.is_available;

    return (
      <TouchableOpacity
        style={[
          styles.slotBox,
          { backgroundColor: theme.card, borderColor: theme.border },
          isBooked && {
            opacity: 0.45,
            backgroundColor: isDark ? THEME.colors.border : '#F1F5F9',
          },
        ]}
        disabled={isBooked}
        onPress={() => handleSlotPress(item)}
        activeOpacity={0.8}
        accessibilityLabel={`${timeStr} ${isBooked ? 'Booked' : 'Available'}`}
        accessibilityState={{ disabled: isBooked }}
      >
        <Text style={[styles.slotTimeText, { color: isBooked ? theme.textSecondary : theme.text }]}>
          {timeStr}
        </Text>
        <View style={[styles.slotBadge, isBooked && styles.slotBadgeBooked]}>
          <Text
            style={[
              styles.slotAvailText,
              { color: isBooked ? theme.textSecondary : theme.primary },
            ]}
          >
            {isBooked ? 'Booked' : 'Available'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Shop-closed banner ───────────────────────────────────────────────────────
  const renderClosedBanner = () => {
    const translateY = bannerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-40, 0],
    });
    const opacity = bannerAnim;

    return (
      <Animated.View style={[styles.closedBanner, { opacity, transform: [{ translateY }] }]}>
        <Ionicons className="mr-2" name="lock-closed" size={16} color="#fff" />
        <Text style={styles.closedBannerText}>
          Shop is closed. Showing availability for tomorrow.
        </Text>
      </Animated.View>
    );
  };

  // ─── Empty / closed states ────────────────────────────────────────────────────
  const renderSlotArea = () => {
    if (isLoading) {
      return (
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <LoadingSkeleton key={key} height={64} width="47%" borderRadius={12} />
          ))}
        </View>
      );
    }

    if (isError) {
      return (
        <View style={[styles.errorBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            Failed to load availability slots
          </Text>
        </View>
      );
    }

    if (!slots || slots.length === 0) {
      const emptyMsg = businessHours?.isClosed
        ? 'Shop is closed on this day.'
        : 'No slots available for this date.';
      return (
        <View style={styles.emptyWrap}>
          <Ionicons name="time-outline" size={40} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{emptyMsg}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={slots}
        renderItem={renderSlotItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={styles.slotGridCols}
        contentContainerStyle={styles.slotsGridContent}
      />
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          Select Date & Time
        </Text>
        <View className="w-6" />
      </View>

      {/* Shop closed banner */}
      {renderClosedBanner()}

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <Text style={[styles.stepText, { color: theme.primary }]}>Step 2 of 3: Choose Slot</Text>
        <Text style={[styles.stepDesc, { color: theme.textSecondary }]} numberOfLines={1}>
          {selectedService.name} ({selectedService.duration} min)
        </Text>
      </View>

      {/* Date strip */}
      <View style={[styles.datesWrapper, { borderBottomColor: theme.border }]}>
        <FlatList
          data={datesList}
          renderItem={renderDateItem}
          keyExtractor={(item) => item.iso}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datesContent}
        />
      </View>

      {/* Slot grid */}
      <ScrollView style={styles.slotsScroll}>
        <Text style={[styles.slotsGridHeader, { color: theme.textSecondary }]}>
          {selectedDate === clock.todayStr
            ? `Today — ${dayjs(selectedDate).format('MMM D, YYYY')}`
            : `${dayjs(selectedDate).format('ddd, MMM D, YYYY')}`}
        </Text>

        {renderSlotArea()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMsg: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  // ── Closed banner ────────────────────────────────────────────────────────────
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53E3E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  closedBannerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  // ── Step indicator ───────────────────────────────────────────────────────────
  stepIndicator: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
    fontWeight: '600',
  },
  // ── Date strip ───────────────────────────────────────────────────────────────
  datesWrapper: {
    borderBottomWidth: 1,
    paddingBottom: 14,
  },
  datesContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  dateCard: {
    width: 62,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateNum: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '500',
  },
  // ── Slot grid ────────────────────────────────────────────────────────────────
  slotsScroll: {
    flex: 1,
  },
  slotsGridHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 12,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    justifyContent: 'space-between',
  },
  errorBox: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  slotsGridContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  slotGridCols: {
    gap: 12,
    marginBottom: 12,
  },
  slotBox: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTimeText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  slotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  slotBadgeBooked: {
    // subtle distinction for booked state
  },
  slotAvailText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
