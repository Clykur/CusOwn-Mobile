import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useBookingDetail, useUpdateBookingStatus } from '@/hooks/useBookings';
import { useAuthStore, Role } from '@/store/auth.store';
import { BookingStatus } from '@/types/booking.types';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function BookingDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { data: booking, isLoading, isError } = useBookingDetail(id || '');
  const { mutateAsync: updateStatus, isPending } = useUpdateBookingStatus();

  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.dark : THEME.light;

  const role = (user?.user_metadata?.role as Role) || 'Customer';
  const isOwner = role === 'Owner';

  const handleStatusChange = (newStatus: BookingStatus) => {
    const statusLabels = {
      confirmed: 'Confirm',
      completed: 'Complete',
      cancelled: 'Cancel',
      no_show: 'Mark as No-Show',
      pending: 'Pending',
    };

    Alert.alert(
      `${statusLabels[newStatus]} Booking`,
      `Are you sure you want to update this reservation to "${newStatus}" status?`,
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Yes, Update',
          style: newStatus === 'cancelled' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await updateStatus({ id: id!, status: newStatus });
              Alert.alert('Success', 'Booking state updated successfully.');
            } catch (err: any) {
              Alert.alert('Update Failed', err.message || 'Could not alter status parameter.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.handleBar} />
        <View style={styles.skeletonBox}>
          <LoadingSkeleton height={40} borderRadius={8} style={{ marginBottom: 16 }} />
          <LoadingSkeleton height={160} borderRadius={12} style={{ marginBottom: 16 }} />
          <LoadingSkeleton height={100} borderRadius={12} />
        </View>
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorMsg, { color: theme.text }]}>Failed to load reservation entity.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.primary, fontWeight: '600' }}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedDate = booking.date || 'Today';
  const formattedTime = booking.time || '12:00 PM';

  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const canConfirm = isOwner && booking.status === 'pending';
  const canComplete = isOwner && booking.status === 'confirmed';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.handleBar} />

      <View style={styles.topHeader}>
        <Text style={[styles.modalTitle, { color: theme.text }]}>Reservation Details</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close-circle" size={24} color={theme.gray} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Current Status</Text>
          <Badge status={booking.status} />
        </View>

        <Card style={[styles.detailCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardSectionHeading, { color: theme.textSecondary }]}>
            {isOwner ? 'Client Information' : 'Salon Hub'}
          </Text>
          <Text style={[styles.valText, { color: theme.text }]}>
            {isOwner ? booking.customer_name || 'Guest User' : booking.salon?.name}
          </Text>
          {!isOwner && booking.salon?.address ? (
            <Text style={[styles.subValText, { color: theme.textSecondary }]}>
              {booking.salon.address}
            </Text>
          ) : null}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.cardSectionHeading, { color: theme.textSecondary }]}>
            Service Package
          </Text>
          <View style={styles.rowBetween}>
            <Text style={[styles.valText, { color: theme.text }]} numberOfLines={1}>
              {booking.service?.name || 'Standard Session'}
            </Text>
            <Text style={[styles.priceVal, { color: isOwner ? theme.accent : theme.primary }]}>
              ${booking.service?.price?.toFixed(2) || '50.00'}
            </Text>
          </View>
          <Text style={[styles.subValText, { color: theme.textSecondary }]}>
            Duration: {booking.service?.duration || 30} mins
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.cardSectionHeading, { color: theme.textSecondary }]}>
            Scheduled Slot
          </Text>
          <Text style={[styles.valText, { color: theme.text }]}>{formattedDate}</Text>
          <Text style={[styles.timeText, { color: isOwner ? theme.accent : theme.primary }]}>
            {formattedTime}
          </Text>
        </Card>

        <View style={styles.actionsWrap}>
          {isOwner ? (
            <View style={styles.ownerActionsGrid}>
              {canConfirm ? (
                <Button
                  variant="primary"
                  loading={isPending}
                  onPress={() => handleStatusChange('confirmed')}
                  style={[styles.actionBtn, { backgroundColor: theme.accent }]}
                >
                  Approve Request
                </Button>
              ) : null}

              {canComplete ? (
                <Button
                  variant="primary"
                  loading={isPending}
                  onPress={() => handleStatusChange('completed')}
                  style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                >
                  Mark Completed
                </Button>
              ) : null}

              {canCancel ? (
                <Button
                  variant="danger"
                  loading={isPending}
                  onPress={() => handleStatusChange('cancelled')}
                  style={styles.actionBtn}
                >
                  Decline / Cancel
                </Button>
              ) : null}

              {booking.status === 'confirmed' ? (
                <Button
                  variant="secondary"
                  loading={isPending}
                  onPress={() => handleStatusChange('no_show')}
                  style={styles.actionBtn}
                >
                  Report No-Show
                </Button>
              ) : null}
            </View>
          ) : (
            // Customer actions
            canCancel && (
              <Button
                variant="danger"
                loading={isPending}
                onPress={() => handleStatusChange('cancelled')}
                style={styles.actionBtn}
              >
                Cancel Reservation
              </Button>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMsg: {
    fontSize: 15,
    fontWeight: '600',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 2,
  },
  skeletonBox: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailCard: {
    padding: 20,
    marginBottom: 20,
  },
  cardSectionHeading: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  valText: {
    fontSize: 16,
    fontWeight: '700',
  },
  subValText: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  actionsWrap: {
    marginTop: 8,
  },
  ownerActionsGrid: {
    gap: 12,
  },
  actionBtn: {},
});
