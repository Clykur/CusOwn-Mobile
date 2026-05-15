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
import { router } from 'expo-router';
import { useBookingStore } from '@/store/booking.store';
import { useCreateBooking } from '@/hooks/useBookings';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ConfirmBookingScreen() {
  const { selectedSalon, selectedService, selectedSlot, resetBooking } = useBookingStore();
  const { mutateAsync: createBooking, isPending } = useCreateBooking();

  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.dark : THEME.light;

  if (!selectedSalon || !selectedService || !selectedSlot) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorMsg, { color: theme.text }]}>Incomplete booking workflow state.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleConfirm = async () => {
    try {
      await createBooking({
        salon_id: selectedSalon.id,
        service_id: selectedService.id,
        slot_id: selectedSlot.id,
        date: selectedSlot.date,
        time: selectedSlot.time,
        price: selectedService.price,
      });

      // Clear wizard selections
      resetBooking();
      router.replace('/booking/success');
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Failed to finalize your reservation.');
    }
  };

  const formattedDate = selectedSlot.date;
  const formattedTime = selectedSlot.time;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          Review & Confirm
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.stepIndicator}>
          <Text style={[styles.stepText, { color: theme.primary }]}>Step 3 of 3: Receipt Review</Text>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
            Please verify your scheduled session options below before submitting.
          </Text>
        </View>

        <View style={styles.receiptWrapper}>
          <Card style={[styles.receiptCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>Salon Location</Text>
            <Text style={[styles.valText, { color: theme.text }]}>{selectedSalon.name}</Text>
            <Text style={[styles.subValText, { color: theme.textSecondary }]}>
              {selectedSalon.address}
            </Text>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>Service Package</Text>
            <View style={styles.serviceRow}>
              <Text style={[styles.valText, { color: theme.text }]} numberOfLines={1}>
                {selectedService.name}
              </Text>
              <Text style={[styles.priceVal, { color: theme.primary }]}>
                ${selectedService.price.toFixed(2)}
              </Text>
            </View>
            <Text style={[styles.subValText, { color: theme.textSecondary }]}>
              {selectedService.duration} minutes scheduled
            </Text>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>Appointment Slot</Text>
            <Text style={[styles.valText, { color: theme.text }]}>{formattedDate}</Text>
            <Text style={[styles.timeHighlight, { color: theme.primary }]}>{formattedTime}</Text>
          </Card>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total Due Now</Text>
          <Text style={[styles.totalVal, { color: theme.primary }]}>
            ${selectedService.price.toFixed(2)}
          </Text>
        </View>
        <Button
          variant="primary"
          loading={isPending}
          onPress={handleConfirm}
          style={styles.confirmBtn}
        >
          Confirm Reservation
        </Button>
      </View>
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
  content: {
    flex: 1,
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
  },
  receiptWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  receiptCard: {
    padding: 20,
    gap: 4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 2,
  },
  valText: {
    fontSize: 16,
    fontWeight: '700',
  },
  subValText: {
    fontSize: 13,
    marginTop: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  timeHighlight: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  confirmBtn: {},
});
