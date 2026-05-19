import React from 'react';
import { View, Text, Pressable, Alert, Image } from 'react-native';

import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Badge } from '@/components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '@/types/booking.types';
import { router } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { getBookingPrice } from '@/services/api.service';
import { supabase } from '@/lib/supabase';
import { CONFIG } from '@/constants/config';
import { formatBookingDate, formatBookingTime } from '@/utils/time';

interface BookingCardProps {
  item: Booking;
  index: number;
  businessImage?: string;
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
  businessImage,
  onPress,
  onAccept,
  onReject,
  onUndoAccept,
  onUndoReject,
  onNoShow,
}) => {
  const canUndo = React.useMemo(() => {
    if (item.status !== 'confirmed' && item.status !== 'rejected') {
      return false;
    }

    if (item.undo_used_at) {
      return false;
    }

    const windowMs = (CONFIG.UNDO_WINDOW_MINUTES || 15) * 60 * 1000;

    const updatedAt = new Date(item.updated_at || item.created_at || Date.now()).getTime();

    return !isNaN(updatedAt) && Date.now() - updatedAt < windowMs;
  }, [item.status, item.updated_at, item.created_at, item.undo_used_at]);

  /**
   * Customer profile avatar fallback
   */
  const avatarUrl = React.useMemo(() => {
    const media = item.customer_profile?.profile_media;

    if (!media?.bucket_name || !media?.storage_path) {
      return null;
    }

    return supabase.storage.from(media.bucket_name).getPublicUrl(media.storage_path).data.publicUrl;
  }, [item.customer_profile?.profile_media]);

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
        <GlassCard className="p-2 border-slate-200/80 rounded-luxury">
          {/* Header */}
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-row items-center flex-1 gap-x-3">
              <Avatar
                url={avatarUrl}
                name={item.customer_name || 'Client Direct'}
                size={48}
                className="border border-accent-premium/20"
              />

              {/* Booking Info */}
              <View className="flex-1 min-w-0">
                {/* Customer Name */}
                <Text
                  className="text-slate-900 text-[16px] font-bold"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.customer_name || 'Client Direct'}
                </Text>

                {/* Services */}
                <Text
                  className="text-slate-500 text-[12px] font-semibold mt-1"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.services && item.services.length > 0
                    ? item.services.map((s: any) => s.name).join(', ')
                    : item.service?.name || 'Standard Slot'}
                </Text>
              </View>
            </View>
            <View className="mt-1">
              <Badge status={item.status} />
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-slate-100 mb-2" />

          {/* Footer */}
          <View className="flex-row justify-between items-center">
            {/* Date */}
            <View className="flex-row items-center gap-x-2">
              <View className="gap-x-4">
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
              </View>
              <Text className="text-slate-600 text-xs font-medium">
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
                    className="w-8 h-8 rounded-full bg-neutral-100 items-center justify-center border border-neutral-300"
                  >
                    <Ionicons name="close" size={16} color="#000000" />
                  </Pressable>

                  <Pressable
                    onPress={() => onAccept(item.id)}
                    className="w-8 h-8 rounded-full bg-black items-center justify-center border border-black"
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </Pressable>
                </>
              )}

              {/* Confirmed */}
              {item.status === 'confirmed' && onUndoAccept && canUndo && (
                <View className="flex-row gap-x-2">
                  {onNoShow && !item.no_show && (
                    <Pressable
                      onPress={() => onNoShow(item.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-500/10 border border-slate-500/20"
                    >
                      <Text className="text-slate-500 text-[10px] font-bold uppercase">
                        No Show
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => onUndoAccept(item.id)}
                    className="w-8 h-8 rounded-full bg-neutral-100 items-center justify-center border border-neutral-300"
                  >
                    <Ionicons name="refresh-outline" size={16} color="#000000" />
                  </Pressable>
                </View>
              )}

              {/* Rejected */}
              {item.status === 'rejected' && onUndoReject && canUndo && (
                <Pressable
                  onPress={() => onUndoReject(item.id)}
                  className="w-8 h-8 rounded-full bg-neutral-100 items-center justify-center border border-neutral-300"
                >
                  <Ionicons name="refresh-outline" size={16} color="#000000" />
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
