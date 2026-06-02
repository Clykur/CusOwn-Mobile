import React, { useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import relativeTime from 'dayjs/plugin/relativeTime';

import { THEME } from '@/theme/theme';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationLog } from '@/hooks/useNotifications';
import { getRouteForNotification } from '@/constants/notification-routes';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useNotificationContext } from '@/providers/NotificationProvider';
import { useAuthStore } from '@/store/auth.store';

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(relativeTime);

export default function NotificationsScreen() {
  const {
    notifications,
    isLoading,
    refetch,
    markAsRead,
    markAllAsRead,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();

  // Get real-time unread count from the provider
  const { unreadCount } = useNotificationContext();
  const { role } = useAuthStore();

  // Group notifications into Today, Yesterday, Earlier
  const sections = useMemo(() => {
    if (!notifications?.length) return [];

    const today: NotificationLog[] = [];
    const yesterday: NotificationLog[] = [];
    const earlier: NotificationLog[] = [];

    notifications.forEach((notif) => {
      const date = dayjs(notif.created_at);
      if (date.isToday()) {
        today.push(notif);
      } else if (date.isYesterday()) {
        yesterday.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    const result = [];
    if (today.length > 0) result.push({ title: 'Today', data: today });
    if (yesterday.length > 0) result.push({ title: 'Yesterday', data: yesterday });
    if (earlier.length > 0) result.push({ title: 'Earlier', data: earlier });

    return result;
  }, [notifications]);

  const handleNotificationPress = (notification: NotificationLog) => {
    if (!notification.opened_at) {
      markAsRead(notification.id);
    }

    let route =
      notification.deep_link ||
      getRouteForNotification(notification.notification_type, notification.payload);

    // Role-based routing override for bookings
    if (route && (route.startsWith('/booking-detail/') || route.startsWith('/owner/bookings/'))) {
      const segments = route.split('/');
      const bookingId = segments[segments.length - 1]; // get the ID part

      if (role === 'Owner') {
        // Route to the standalone OwnerBookingDetailScreen
        route = `/owner-booking-detail/${bookingId}`;
      } else {
        // Route to the Customer BookingDetailScreen
        route = `/booking-detail/${bookingId}`;
      }
    }

    if (route) {
      router.push(route as `/${string}`);
    }
  };

  const getIconForType = (type: string, category?: string) => {
    if (category === 'payment')
      return { name: 'card-outline' as const, color: THEME.colors.success };
    if (category === 'review') return { name: 'star-outline' as const, color: THEME.colors.gold };
    if (category === 'promotion')
      return { name: 'pricetag-outline' as const, color: THEME.colors.primary };

    if (type.includes('booking_confirmed'))
      return { name: 'checkmark-circle-outline' as const, color: THEME.colors.success };
    if (type.includes('rejected') || type.includes('cancelled'))
      return { name: 'close-circle-outline' as const, color: THEME.colors.error };
    if (type.includes('reminder'))
      return { name: 'time-outline' as const, color: THEME.colors.warning };
    if (type.includes('new_booking_request'))
      return { name: 'calendar-outline' as const, color: THEME.colors.primary };

    return { name: 'notifications-outline' as const, color: THEME.colors.primary };
  };

  const renderItem = ({ item }: { item: NotificationLog }) => {
    const isUnread = !item.opened_at;
    const { name, color } = getIconForType(item.notification_type, item.category);

    return (
      <Pressable onPress={() => handleNotificationPress(item)} className="mb-3 px-4">
        <GlassCard className={`p-2 ${isUnread ? 'border-primary/40' : 'border-border'}`}>
          <View className="flex-row items-start">
            <View className="w-10 h-10 rounded-full items-center justify-center mr-3 mt-1">
              <Ionicons name={name} size={20} color={color} />
            </View>
            <View className="flex-1">
              <View className="flex-row justify-between items-start mb-1">
                <Text
                  className={`text-base flex-1 pr-2 ${isUnread ? 'text-text font-black' : 'text-textSecondary font-bold'}`}
                >
                  {item.title ||
                    (item.payload?.title ? String(item.payload.title) : null) ||
                    'Notification'}
                </Text>
                <Text className="text-xs text-textSecondary font-medium">
                  {dayjs(item.created_at).fromNow(true)}
                </Text>
              </View>
              <Text
                className={`text-sm ${isUnread ? 'text-textSecondary font-medium' : 'text-textSecondary/70'}`}
                numberOfLines={2}
              >
                {item.body ||
                  (item.payload?.body ? String(item.payload.body) : null) ||
                  'You have a new update.'}
              </Text>
            </View>
            {isUnread && <View className="w-2 h-2 rounded-full bg-primary mt-2 ml-2" />}
          </View>
        </GlassCard>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <Text className="px-5 py-2 text-xs font-bold text-textSecondary uppercase tracking-widest bg-background">
      {title}
    </Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border mb-2">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-4 p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color={THEME.colors.text} />
          </Pressable>
          <Text className="text-2xl font-black text-text tracking-tight">Notifications</Text>
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={() => markAllAsRead()}>
            <Text className="text-primary font-bold text-sm">Mark all read</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View className="px-4">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} height={90} className="mb-3 w-full" borderRadius={16} />
          ))}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={THEME.colors.primary}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={THEME.colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20 px-8">
              <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
                <Ionicons name="notifications-off-outline" size={32} color={THEME.colors.primary} />
              </View>
              <Text className="text-xl font-black text-text mb-2 text-center">
                No notifications yet
              </Text>
              <Text className="text-center text-textSecondary leading-5">
                When you get bookings, updates, or messages, they'll show up here.
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        />
      )}
    </SafeAreaView>
  );
}
