import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React from 'react';
import { View, Text, Pressable } from 'react-native';

import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { THEME } from '@/theme/theme';

import type { Business } from '@/features/shared/types/business.types';

export interface FlashDeal {
  business?: Business | null;
  id: string;
  business_id: string;
  salon_name: string;
  title: string;
  discount_text: string;
  expires_at: string;
}

interface DealCardProps {
  item: FlashDeal;
  index?: number;
  onPress?: () => void;
}

function DealCardBase({ item, index = 0, onPress }: DealCardProps) {
  const isExpiringSoon = dayjs(item.expires_at).diff(dayjs(), 'hours') < 24;

  return (
    <AnimatedSection delay={index * 100} direction="up" className="mr-4">
      <Pressable onPress={onPress}>
        <GlassCard className="w-64 p-0">
          <View className="px-4 py-3 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons name="pricetag-outline" size={16} color={THEME.colors.primary} />
              <Text className="text-primary font-bold ml-2 text-sm">{item.discount_text}</Text>
            </View>
            <View className={`flex-row items-center px-2 py-1 rounded-md`}>
              <Ionicons
                name="time-outline"
                size={12}
                color={isExpiringSoon ? THEME.colors.error : THEME.colors.textSecondary}
              />
              <Text
                className={`text-xs font-bold ml-1 ${isExpiringSoon ? 'text-error' : 'text-textSecondary'}`}
              >
                {isExpiringSoon ? 'Ends Soon' : dayjs(item.expires_at).format('MMM D')}
              </Text>
            </View>
          </View>

          <View className="p-4">
            <Text className="text-text font-bold text-lg mb-1" numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="text-textSecondary text-xs mb-3" numberOfLines={1}>
              at {item.salon_name}
            </Text>

            <View className="bg-primary/20 rounded-xl py-2 items-center">
              <Text className="text-primary font-bold text-xs uppercase tracking-widest">
                Claim Offer
              </Text>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </AnimatedSection>
  );
}

export const DealCard = React.memo(DealCardBase);
