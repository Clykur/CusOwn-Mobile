import { THEME } from '@/theme/theme';
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Business } from '@/types/business.types';
import { getShopStatus } from '@/utils/time';

interface BrowseSalonCardProps {
  item: Business;
  index?: number;
  onPress?: () => void;
}

export function BusinessCard({ item, index = 0, onPress }: BrowseSalonCardProps) {
  const status = getShopStatus(item.opening_time, item.closing_time);

  return (
    <AnimatedSection delay={index * 100} direction="right" className="mr-4">
      <Pressable onPress={onPress}>
        <GlassCard className="w-[220px] p-2  bg-card shadow-sm rounded-[28px] items-center">
          {/* Profile Image */}
          <View className="items-center justify-center mb-4">
            <Avatar
              userId={item.owner_user_id}
              name={item.salon_name}
              size={110}
              className="w-[110px] h-[110px] rounded-full"
            />
          </View>

          {/* Content */}
          <View className="w-full items-center">
            {/* Name */}
            <Text
              className="text-text text-lg font-black tracking-tight text-center"
              numberOfLines={1}
            >
              {item.salon_name}
            </Text>

            {/* Address */}
            <Text
              className="text-textSecondary text-xs leading-5 text-center px-2 min-h-[40px]"
              numberOfLines={2}
            >
              {item.address}
            </Text>

            {/* Bottom Meta */}
            <View className="flex-row items-center justify-center">
              {/* Rating */}
              <View className="flex-row items-center">
                <Ionicons
                  name={item.rating_avg && Number(item.rating_avg) > 0 ? 'star' : 'star-outline'}
                  size={14}
                  color={
                    item.rating_avg && Number(item.rating_avg) > 0
                      ? THEME.colors.warning
                      : THEME.colors.textSecondary
                  }
                />

                <Text className="text-text text-xs font-bold ml-1">
                  {item.rating_avg && Number(item.rating_avg) > 0
                    ? Number(item.rating_avg).toFixed(1)
                    : 'New'}
                </Text>
              </View>

              {/* Divider */}
              <View
                className={`w-1 h-1 rounded-full mx-3 ${status.isOpen ? 'bg-success' : 'bg-error'}`}
              />
              {/* Status */}
              <Text
                className={`${
                  status.isOpen ? 'text-success' : 'text-error'
                } text-xs font-bold uppercase tracking-wide`}
                numberOfLines={1}
              >
                {status.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </AnimatedSection>
  );
}
