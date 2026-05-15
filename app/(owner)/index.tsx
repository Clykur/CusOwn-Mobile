import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useOwnerStats } from '@/hooks/useOwner';
import { useBookings } from '@/hooks/useBookings';
import { Booking } from '@/types/booking.types';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { THEME } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { Ionicons } from '@expo/vector-icons';

export default function OwnerDashboardScreen() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useOwnerStats();
  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useBookings('Owner');

  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.dark : THEME.light;

  const onRefresh = React.useCallback(() => {
    refetchStats();
    refetchBookings();
  }, [refetchStats, refetchBookings]);

  const pendingBookings = React.useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((b: Booking) => b.status === 'pending').slice(0, 5);
  }, [bookings]);

  const renderBookingItem = ({ item }: { item: Booking }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/booking-detail/${item.id}`)}
      >
        <Card style={[styles.bookingCard, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.clientInfo}>
              <Ionicons name="person-circle-outline" size={32} color={theme.accent} />
              <View>
                <Text style={[styles.clientName, { color: theme.text }]} numberOfLines={1}>
                  {item.customer_name || 'Client Direct'}
                </Text>
                <Text style={[styles.serviceName, { color: theme.textSecondary }]}>
                  {item.service?.name || 'Standard Slot'}
                </Text>
              </View>
            </View>
            <Badge status={item.status} />
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.timeRow}>
              <Ionicons name="time" size={14} color={theme.textSecondary} />
              <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                {item.date} at {item.time}
              </Text>
            </View>
            <Text style={[styles.priceText, { color: theme.accent }]}>
              ${item.price?.toFixed(2) || item.service?.price?.toFixed(2) || '50.00'}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const isLoading = statsLoading || bookingsLoading;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.accent} />
      }
    >
      <View style={styles.headerTitleRow}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Business Overview</Text>
        <Text style={[styles.dateSubtitle, { color: theme.textSecondary }]}>
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <Card style={[styles.statBox, { backgroundColor: theme.card }]}>
          <View style={styles.iconCircleAccent}>
            <Ionicons name="wallet" size={20} color={theme.accent} />
          </View>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Daily Earnings</Text>
          {statsLoading ? (
            <LoadingSkeleton height={24} width={80} style={{ marginTop: 4 }} />
          ) : (
            <Text style={[styles.statValue, { color: theme.text }]}>
              ${stats?.revenue?.toFixed(2) || '320.00'}
            </Text>
          )}
        </Card>

        <Card style={[styles.statBox, { backgroundColor: theme.card }]}>
          <View style={styles.iconCirclePrimary}>
            <Ionicons name="calendar" size={20} color={theme.primary} />
          </View>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Appointments</Text>
          {statsLoading ? (
            <LoadingSkeleton height={24} width={50} style={{ marginTop: 4 }} />
          ) : (
            <Text style={[styles.statValue, { color: theme.text }]}>
              {stats?.pending_bookings || '8'} Today
            </Text>
          )}
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Action Required</Text>
        <TouchableOpacity onPress={() => router.push('/(owner)/bookings')}>
          <Text style={[styles.seeAllLink, { color: theme.accent }]}>View All</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.skeletonList}>
          <LoadingSkeleton height={110} borderRadius={12} style={{ marginBottom: 12 }} />
          <LoadingSkeleton height={110} borderRadius={12} />
        </View>
      ) : (
        <FlatList
          data={pendingBookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="checkmark-done-circle-outline" size={44} color={theme.gray} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No pending requests requiring approval.
              </Text>
            </View>
          }
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitleRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  dateSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    padding: 16,
  },
  iconCircleAccent: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCirclePrimary: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  skeletonList: {
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  bookingCard: {
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
  },
  serviceName: {
    fontSize: 13,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    marginTop: 8,
  },
});
