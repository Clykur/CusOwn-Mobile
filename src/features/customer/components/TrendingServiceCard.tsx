import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/theme/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';

export interface TrendingService {
  business: any;
  id: string;
  name: string;
  category: string;
  booking_count: number;
  starting_price: number;
  business_id?: string;
  salon_name?: string;
  rating_avg?: number;
}

interface TrendingServiceCardProps {
  item: TrendingService;
  index?: number;
  onPress?: () => void;
}

export function TrendingServiceCard({ item, index = 0, onPress }: TrendingServiceCardProps) {
  const salonName = item.business?.salon_name || item.salon_name;
  const rating = item.business?.rating_avg || item.rating_avg;

  return (
    <AnimatedSection delay={index * 100} direction="left" className="mr-4">
      <Pressable onPress={onPress}>
        <GlassCard className="w-[190px] p-2 bg-card shadow-sm rounded-[24px] items-center justify-center">
          {/* Icon */}
          <View className="items-center justify-center mb-3">
            <Ionicons name="trending-up" size={30} color={THEME.colors.primary} />
          </View>

          {/* Category */}
          <Text className="text-primary text-[10px] font-bold uppercase tracking-[2px] text-center mb-1">
            {item.category}
          </Text>

          {/* Service Name */}
          <Text
            className="text-text text-base font-black tracking-tight text-center px-2"
            numberOfLines={2}
          >
            {item.name}
          </Text>

          {/* Salon Name */}
          <View className="flex-row items-center justify-center mt-2 px-2">
            <Ionicons name="business-outline" size={12} color={THEME.colors.primary} />

            <Text
              className="text-textSecondary text-xs text-center ml-1 font-medium"
              numberOfLines={1}
            >
              {salonName || 'Premium Salon'}
            </Text>
          </View>

          {/* Price */}
          <View className="items-center justify-center mt-4">
            <Text className="text-textSecondary text-[10px] uppercase font-bold tracking-wider text-center mb-0.5">
              Starts At
            </Text>

            <Text className="text-text font-black text-sm text-center">₹{item.starting_price}</Text>
          </View>
        </GlassCard>
      </Pressable>
    </AnimatedSection>
  );
}
