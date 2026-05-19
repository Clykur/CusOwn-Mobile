import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { isValidImageUrl } from '@/utils/image';

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
        <GlassCard className="w-[220px] p-4 border border-slate-200/80 bg-white/90 shadow-sm items-center">
          {/* Owner Profile Image */}
          <View className="relative mb-4">
            {isValidImageUrl(item.owner_image) ? (
              <Image
                source={{ uri: item.owner_image }}
                className="w-[120px] h-[120px] rounded-full"
                resizeMode="cover"
              />
            ) : (
              <Avatar
                name={item.salon_name}
                size={120}
                className="w-[120px] h-[120px] rounded-full"
              />
            )}
          </View>

          {/* Salon Details */}
          <View className="items-center w-full">
            <Text
              className="text-slate-900 text-lg font-bold tracking-tight text-center"
              numberOfLines={1}
            >
              {item.salon_name}
            </Text>

            <Text className="text-slate-500 text-xs leading-4 text-center mt-1" numberOfLines={2}>
              {item.address}
            </Text>

            <View className="flex-row items-center mt-3 gap-x-2">
              <View className="flex-row items-center gap-x-1">
                <Ionicons
                  name={item.rating_avg && Number(item.rating_avg) > 0 ? 'star' : 'star-outline'}
                  size={14}
                  color={item.rating_avg && Number(item.rating_avg) > 0 ? '#F59E0B' : '#94A3B8'}
                />
                <Text className="text-accent-premium text-xs font-bold">
                  {item.rating_avg && Number(item.rating_avg) > 0
                    ? Number(item.rating_avg).toFixed(1)
                    : 'New'}
                </Text>
              </View>

              <View className="w-1 h-1 rounded-full bg-slate-300" />

              <Text
                className={`${status.isOpen ? 'text-green-600' : 'text-rose-500'} text-[10px] font-bold uppercase tracking-wide`}
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
