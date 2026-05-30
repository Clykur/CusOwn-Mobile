import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/theme/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { router } from 'expo-router';
import dayjs from 'dayjs';

interface UpcomingBookingCardProps {
  booking?: any; // The upcoming booking if available
  lastVisited?: any; // Fallback to last visited salon
}

export function UpcomingBookingCard({ booking, lastVisited }: UpcomingBookingCardProps) {
  if (!booking && !lastVisited) return null;

  return (
    <View className="px-luxury mb-8">
      <View className="flex-row items-center mb-4">
        <Text className="text-text text-xl font-bold tracking-tight uppercase">
          {booking ? 'Upcoming Booking' : 'Book Again'}
        </Text>
      </View>

      <GlassCard className="p-4 bg-card shadow-sm rounded-full">
        {booking ? (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Avatar
                userId={booking.business?.owner_user_id}
                name={booking.business?.salon_name || 'Salon'}
                size={60}
                type="business"
                className="rounded-2xl"
              />
              <View className="ml-4 flex-1">
                <Text className="text-text font-bold text-lg mb-1" numberOfLines={1}>
                  {booking.business?.salon_name || 'Salon'}
                </Text>
                <Text className="text-primary font-medium text-sm mb-1" numberOfLines={1}>
                  {booking.service?.name || 'Service'}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={12} color={THEME.colors.textSecondary} />
                  <Text className="text-textSecondary text-xs ml-1 mr-3">
                    {dayjs(booking.date).format('MMM D, YYYY')}
                  </Text>
                  <Ionicons name="time-outline" size={12} color={THEME.colors.textSecondary} />
                  <Text className="text-textSecondary text-xs ml-1">{booking.time}</Text>
                </View>
              </View>
            </View>
            <View className="items-end justify-center ml-2">
              <View className="bg-primary/20 px-3 py-1 rounded-full mb-3">
                <Text className="text-primary font-bold text-xs uppercase">{booking.status}</Text>
              </View>
              <Pressable
                onPress={() => router.push('/(customer)/bookings')}
                className="bg-primary px-4 py-2 rounded-xl"
              >
                <Text className="text-background font-bold text-xs">View</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Avatar
                userId={lastVisited?.owner_user_id}
                name={lastVisited?.salon_name || 'Salon'}
                size={60}
                type="business"
                className="rounded-2xl"
              />
              <View className="ml-4 flex-1">
                <Text className="text-text font-bold text-lg mb-1" numberOfLines={1}>
                  {lastVisited?.salon_name || 'Salon'}
                </Text>
                <Text className="text-textSecondary text-xs" numberOfLines={1}>
                  Last visited recently
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push(`/(customer)/browse/salons/${lastVisited?.id}`)}
              className="bg-primary px-5 py-2.5 rounded-xl ml-2"
            >
              <Text className="text-background font-bold text-xs">Rebook</Text>
            </Pressable>
          </View>
        )}
      </GlassCard>
    </View>
  );
}
