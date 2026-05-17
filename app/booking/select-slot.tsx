import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useBookingStore } from '@/store/booking.store';
import { useSlots } from '@/hooks/useSlots';
import { Slot } from '@/types/slot.types';
import { Card } from '@/components/Card';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SelectSlotScreen() {
  const { selectedBusiness, selectedService, setSlot } = useBookingStore();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const { data: slots, isLoading, isError } = useSlots(selectedBusiness?.id || null, selectedDate);

  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.dark : THEME.light;

  const datesList = useMemo(() => {
    const list = [];
    const base = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push({
        iso: d.toISOString().split('T')[0],
        dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthStr: d.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    return list;
  }, []);

  if (!selectedBusiness || !selectedService) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorMsg, { color: theme.text }]}>Missing booking criteria.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSlotPress = (slot: Slot) => {
    if (!slot.is_available) return;
    setSlot(slot);
    router.push('/booking/confirm');
  };

  const renderDateItem = ({ item }: { item: any }) => {
    const isSelected = item.iso === selectedDate;
    return (
      <TouchableOpacity
        style={[
          styles.dateCard,
          { backgroundColor: theme.card, borderColor: theme.border },
          isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
        ]}
        onPress={() => setSelectedDate(item.iso)}
        activeOpacity={0.8}
      >
        <Text style={[styles.dateDay, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
          {item.dayOfWeek}
        </Text>
        <Text style={[styles.dateNum, { color: isSelected ? '#FFFFFF' : theme.text }]}>
          {item.dayNum}
        </Text>
        <Text style={[styles.dateMonth, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
          {item.monthStr}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSlotItem = ({ item }: { item: Slot }) => {
    const timeStr = new Date(item.time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={[
          styles.slotBox,
          { backgroundColor: theme.card, borderColor: theme.border },
          !item.is_available && { opacity: 0.4, backgroundColor: isDark ? '#1A1A1A' : '#F8FAFC' },
        ]}
        disabled={!item.is_available}
        onPress={() => handleSlotPress(item)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.slotTimeText,
            { color: item.is_available ? theme.text : theme.textSecondary },
          ]}
        >
          {timeStr}
        </Text>
        <Text
          style={[
            styles.slotAvailText,
            { color: item.is_available ? theme.primary : theme.textSecondary },
          ]}
        >
          {item.is_available ? 'Available' : 'Booked'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          Select Date & Time
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.stepIndicator}>
        <Text style={[styles.stepText, { color: theme.primary }]}>Step 2 of 3: Choose Slot</Text>
        <Text style={[styles.stepDesc, { color: theme.textSecondary }]} numberOfLines={1}>
          {selectedService.name} ({selectedService.duration} min)
        </Text>
      </View>

      <View style={styles.datesWrapper}>
        <FlatList
          data={datesList}
          renderItem={renderDateItem}
          keyExtractor={(item) => item.iso}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datesContent}
        />
      </View>

      <ScrollView style={styles.slotsScroll}>
        <Text style={[styles.slotsGridHeader, { color: theme.textSecondary }]}>
          Available Times on {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}
        </Text>

        {isLoading ? (
          <View style={styles.skeletonGrid}>
            {[1, 2, 3, 4, 5, 6].map((key) => (
              <LoadingSkeleton key={key} height={64} width="47%" borderRadius={12} />
            ))}
          </View>
        ) : isError ? (
          <View style={[styles.errorBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.errorText, { color: theme.error }]}>Failed to load availability slots</Text>
          </View>
        ) : !slots || slots.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="time-outline" size={40} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No slots configured for this date.
            </Text>
          </View>
        ) : (
          <FlatList
            data={slots}
            renderItem={renderSlotItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.slotGridCols}
            contentContainerStyle={styles.slotsGridContent}
          />
        )}
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
  datesWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    fontSize: 12,
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
    marginBottom: 2,
  },
  slotAvailText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
