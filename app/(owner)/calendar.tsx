import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { useBookings } from '@/hooks/useBookings';
import { Booking } from '@/types/booking.types';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function OwnerCalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const { data: bookings } = useBookings('Owner');

  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.dark : THEME.light;

  const dayBookings = React.useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((b: Booking) => {
      const bDate = b.date || (b as any).slot_time?.split('T')[0];
      return bDate === selectedDate;
    });
  }, [bookings, selectedDate]);

  const markedDates = React.useMemo(() => {
    const marks: any = {};
    if (bookings) {
      bookings.forEach((b: Booking) => {
        const bDate = b.date || (b as any).slot_time?.split('T')[0];
        if (bDate) {
          marks[bDate] = {
            marked: true,
            dotColor: b.status === 'pending' ? '#F59E0B' : theme.accent,
          };
        }
      });
    }
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: theme.accent,
    };
    return marks;
  }, [bookings, selectedDate, theme.accent]);

  const renderBookingItem = ({ item }: { item: Booking }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/booking-detail/${item.id}`)}
      >
        <Card style={[styles.bookingCard, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.timeText, { color: theme.text }]} numberOfLines={1}>
              {item.time || '12:00'}
            </Text>
            <Badge status={item.status} />
          </View>
          <Text style={[styles.serviceName, { color: theme.text }]} numberOfLines={1}>
            {item.service?.name || 'Session'}
          </Text>
          <Text style={[styles.clientName, { color: theme.textSecondary }]} numberOfLines={1}>
            Client: {item.customer_name || 'Guest'}
          </Text>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Calendar
        current={selectedDate}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          calendarBackground: theme.card,
          textSectionTitleColor: theme.textSecondary,
          selectedDayBackgroundColor: theme.accent,
          selectedDayTextColor: '#FFFFFF',
          todayTextColor: theme.accent,
          dayTextColor: theme.text,
          textDisabledColor: theme.gray,
          dotColor: theme.accent,
          monthTextColor: theme.text,
          arrowColor: theme.accent,
          textDayFontWeight: '500',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
        }}
        style={styles.calendar}
      />

      <View style={styles.listContainer}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Schedule for {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}
        </Text>

        <FlatList
          data={dayBookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={40} color={theme.gray} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No scheduled slots for this date.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  listContainer: {
    flex: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  bookingCard: {
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  clientName: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 13,
    marginTop: 8,
  },
});
