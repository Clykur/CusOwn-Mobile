import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useBookings } from '@/hooks/useBookings';
import { Booking } from '@/types/booking.types';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function OwnerBookingsScreen() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const { data: bookings, isLoading, isError, refetch } = useBookings('Owner');

  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.dark : THEME.light;

  const filteredBookings = React.useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((b: Booking) => {
      if (filter === 'all') return true;
      return b.status === filter;
    });
  }, [bookings, filter]);

  const renderBookingCard = ({ item }: { item: Booking }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/booking-detail/${item.id}`)}
      >
        <Card style={[styles.bookingCard, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.clientRow}>
              <Ionicons name="person" size={16} color={theme.textSecondary} />
              <Text style={[styles.clientName, { color: theme.text }]} numberOfLines={1}>
                {item.customer_name || 'Client Direct'}
              </Text>
            </View>
            <Badge status={item.status} />
          </View>

          <View style={styles.serviceDivider} />

          <View style={styles.detailsContainer}>
            <Text style={[styles.serviceName, { color: theme.text }]}>
              {item.service?.name || 'Curated Session'}
            </Text>
            <View style={styles.timePriceRow}>
              <View style={styles.iconText}>
                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                  {item.date} at {item.time}
                </Text>
              </View>
              <Text style={[styles.priceText, { color: theme.accent }]}>
                ${item.price?.toFixed(2) || item.service?.price?.toFixed(2) || '45.00'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.tabsContainer}>
        {(['all', 'pending', 'confirmed'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabBtn,
              filter === tab && [styles.activeTabBtn, { borderBottomColor: theme.accent }],
            ]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: filter === tab ? theme.accent : theme.textSecondary },
              ]}
            >
              {tab === 'all' ? 'All' : tab === 'pending' ? 'Pending' : 'Confirmed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <LoadingSkeleton height={130} borderRadius={12} style={{ marginBottom: 12 }} />
          <LoadingSkeleton height={130} borderRadius={12} />
        </View>
      ) : isError ? (
        <View style={[styles.errorBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.errorMsg, { color: theme.error }]}>Failed to load hub reservations</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={{ color: theme.accent, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={48} color={theme.gray} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Bookings Found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                No incoming request entries matching "{filter}" status.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {},
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  errorBox: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorMsg: {
    fontSize: 14,
    marginBottom: 10,
  },
  retryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  bookingCard: {
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 6,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
  },
  serviceDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  detailsContainer: {
    gap: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
  },
  timePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
