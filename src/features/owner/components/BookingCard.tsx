import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, Pressable } from 'react-native';

import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { CONFIG } from '@/constants/config';
import { getBookingPrice } from '@/services/api.service';
import { THEME } from '@/theme/theme';
import { formatBookingDate, formatBookingTime } from '@/utils/time';

import type { Booking } from '@/types/booking.types';

interface BookingCardProps {
  item: Booking;
  index: number;
  businessImage?: string;
  businessId?: string; // added to avoid type error from previous patch
  onPress?: (item: Booking) => void;

  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onUndoAccept?: (id: string) => void;
  onUndoReject?: (id: string) => void;
  onNoShow?: (id: string) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  item,
  index,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  businessImage,
  onPress,
  onAccept,
  onReject,
  onUndoAccept,
  onUndoReject,
  onNoShow,
}) => {
  const isPast = React.useMemo(() => {
    if (!item.date || !item.time) return false;
    const slotDateTime = new Date(`${item.date}T${item.time}`);
    // eslint-disable-next-line react-hooks/purity
    return slotDateTime.getTime() < Date.now();
  }, [item.date, item.time]);

  const canUndo = React.useMemo(() => {
    if (isPast) return false;
    if (item.status !== 'confirmed' && item.status !== 'rejected') {
      return false;
    }

    if (item.undo_used_at) {
      return false;
    }

    const windowMs = (CONFIG.UNDO_WINDOW_MINUTES || 15) * 60 * 1000;

    // eslint-disable-next-line react-hooks/purity
    const updatedAt = new Date(item.updated_at || item.created_at || Date.now()).getTime();

    // eslint-disable-next-line react-hooks/purity
    return !isNaN(updatedAt) && Date.now() - updatedAt < windowMs;
  }, [isPast, item.status, item.updated_at, item.created_at, item.undo_used_at]);

  return (
    <AnimatedSection delay={index * 50} direction="up" className="mb-4">
      <Pressable
        onPress={() => {
          if (onPress) {
            onPress(item);
          } else {
            router.push(`/booking-detail/${item.id}`);
          }
        }}
      >
        <GlassCard className="p-1">
          {/* Header */}
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-row items-center flex-1 gap-x-3">
              <Avatar
                userId={item.customer_user_id}
                name={item.customer_name || 'Client Direct'}
                size={48}
              />

              {/* Booking Info */}
              <View className="flex-1 min-w-0">
                {/* Customer Name */}
                <Text
                  className="text-text text-xl font-bold"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.customer_name || 'Client Direct'}
                </Text>

                {/* Services */}
                <Text
                  className="text-textSecondary text-sm font-semibold"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.services && item.services.length > 0
                    ? item.services.map((s: { name?: string }) => s.name).join(', ')
                    : item.service?.name || 'Standard Slot'}
                </Text>
              </View>
            </View>
            <View className="mt-1">
              <Badge status={item.status} />
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-border mb-2" />

          {/* Footer */}
          <View className="flex-row justify-between items-center">
            {/* Date */}
            <View className="flex-row items-center gap-x-2">
              <View className="gap-x-4">
                <Ionicons name="calendar-outline" size={14} color={THEME.colors.textSecondary} />
              </View>
              <Text className="text-textSecondary text-xs font-medium">
                {formatBookingDate(item.date)} - {formatBookingTime(item.time)}
              </Text>
            </View>

            {/* Actions */}
            <View className="flex-row gap-x-2">
              {/* Pending */}
              {item.status === 'pending' && onAccept && onReject && (
                <>
                  <Pressable
                    onPress={() => onReject(item.id)}
                    className="w-8 h-8 rounded-full bg-input items-center justify-center border border-border"
                  >
                    <Ionicons name="close" size={16} color={THEME.colors.textSecondary} />
                  </Pressable>

                  <Pressable
                    onPress={() => onAccept(item.id)}
                    className="w-8 h-8 rounded-full bg-primary items-center justify-center border border-primary"
                  >
                    <Ionicons name="checkmark" size={16} color={THEME.colors.background} />
                  </Pressable>
                </>
              )}

              {/* Confirmed */}
              {item.status === 'confirmed' && onUndoAccept && canUndo && !isPast && (
                <View className="flex-row gap-x-2">
                  {onNoShow && !item.no_show && !isPast && (
                    <Pressable
                      onPress={() => onNoShow(item.id)}
                      className="w-8 h-8 rounded-full bg-warning/20 items-center justify-center border border-warning/30"
                    >
                      <Ionicons
                        name="person-remove-outline"
                        size={16}
                        color={THEME.colors.warning}
                      />
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => onUndoAccept(item.id)}
                    className="w-8 h-8 rounded-full bg-input items-center justify-center border border-border"
                  >
                    <Ionicons name="refresh-outline" size={16} color={THEME.colors.textSecondary} />
                  </Pressable>
                </View>
              )}

              {/* Rejected */}
              {item.status === 'rejected' && onUndoReject && canUndo && (
                <Pressable
                  onPress={() => onUndoReject(item.id)}
                  className="w-8 h-8 rounded-full bg-input items-center justify-center border border-border"
                >
                  <Ionicons name="refresh-outline" size={16} color={THEME.colors.textSecondary} />
                </Pressable>
              )}

              {/* Price */}
              <Text className="text-accent-premium text-base font-black ml-2 align-middle self-center">
                ₹{getBookingPrice(item).toFixed(0)}
              </Text>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </AnimatedSection>
  );
};
