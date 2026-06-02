import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, Pressable } from 'react-native';

import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Avatar } from '@/components/ui/Avatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { THEME } from '@/theme/theme';
import { getShopStatus } from '@/utils/time';

import type { Business } from '@/types/business.types';

export interface NearbySalon extends Business {
  distance_km?: number;
  next_available_time?: string;
  starting_price?: number;
}

interface NearbySalonCardProps {
  item: NearbySalon;
  index?: number;
  onPress?: () => void;
}

function NearbySalonCardBase({ item, index = 0, onPress }: NearbySalonCardProps) {
  const status = getShopStatus(item.opening_time, item.closing_time);

  return (
    <AnimatedSection delay={index * 100} direction="right" className="mr-4">
      <Pressable onPress={onPress}>
        <GlassCard className="w-56 h-64 p-2 bg-card shadow-sm relative">
          {/* Top Right Status */}
          <View className="absolute top-1 right-4 flex-row items-center z-10">
            {/* Pulse Circle */}
            <View className="relative mr-1.5 items-center justify-center">
              {/* Outer Wave */}
              <View
                className={`absolute w-3.5 h-3.5 rounded-full opacity-25 ${
                  status.isOpen ? 'bg-success' : 'bg-error'
                }`}
              />

              {/* Inner Dot */}
              <View
                className={`w-2 h-2 rounded-full ${status.isOpen ? 'bg-success' : 'bg-error'}`}
              />
            </View>

            {/* Status Text */}
            <Text
              className={`${
                status.isOpen ? 'text-success' : 'text-error'
              } text-xs font-black uppercase tracking-wider`}
            >
              {status.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
          {/* Profile Image */}
          <View className="items-center justify-center mb-2">
            <View className="w-28 h-28 rounded-full overflow-hidden items-center justify-center">
              <Avatar
                userId={item.owner_user_id}
                name={item.salon_name}
                size={100}
                type="business"
              />
            </View>
          </View>

          {/* Content */}
          <View className="w-full items-center mt-2 px-2">
            {/* Name */}
            <Text
              className="text-text text-lg font-black tracking-tight text-center"
              numberOfLines={1}
            >
              {item.salon_name}
            </Text>

            {/* Distance */}
            <View className="flex-row items-center min-h-6 mt-1">
              <Ionicons name="location-outline" size={12} color={THEME.colors.primary} />

              <Text className="text-textSecondary text-xs ml-1 font-medium">
                {item.distance_km ? `${item.distance_km.toFixed(1)} km away` : 'Nearby'}
              </Text>
            </View>

            {/* Rating */}
            <View className="flex-row items-center justify-center mt-1">
              <Ionicons
                name={item.rating_avg && Number(item.rating_avg) > 0 ? 'star' : 'star-outline'}
                size={14}
                color={
                  item.rating_avg && Number(item.rating_avg) > 0
                    ? THEME.colors.gold
                    : THEME.colors.textSecondary
                }
              />

              <Text className="text-text text-xs font-bold ml-1">
                {item.rating_avg && Number(item.rating_avg) > 0
                  ? Number(item.rating_avg).toFixed(1)
                  : 'New'}
              </Text>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </AnimatedSection>
  );
}

export const NearbySalonCard = React.memo(NearbySalonCardBase);
