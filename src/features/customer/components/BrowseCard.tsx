import { THEME } from '@/theme/theme';
import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Business } from '@/types/business.types';
import { Avatar } from '@/components/ui/Avatar';
import { isValidImageUrl } from '@/utils/image';

import { getShopStatus } from '@/utils/time';

interface Props {
  item: Business;
  index?: number;
}

export const BrowseCard = ({ item, index = 0 }: Props) => {
  const status = getShopStatus(item.opening_time, item.closing_time);

  return (
    <AnimatedSection delay={index * 50} direction="up" className="mb-4">
      <Pressable onPress={() => router.push(`/(customer)/browse/salons/${item.id}`)}>
        <View className="flex-row bg-card rounded-[28px] p-4 shadow-sm">
          {/* Profile/Business Image */}
          <View className="relative">
            <Avatar
              userId={item.owner_user_id}
              name={item.salon_name}
              size={80}
              className="w-[80px] h-[80px] rounded-full"
            />
          </View>

          {/* Right Content */}
          <View className="flex-1 ml-4 justify-center">
            <Text className="text-text text-xl font-bold" numberOfLines={1}>
              {item.salon_name}
            </Text>

            <Text className="text-textSecondary text-sm mt-1 leading-5" numberOfLines={2}>
              {item.address}
            </Text>

            <View className="flex-row items-center mt-3">
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

              {item.review_count > 0 && (
                <>
                  <View className="w-1 h-1 rounded-full bg-border mx-2" />
                  <Text className="text-textSecondary text-xs font-bold uppercase tracking-wide">
                    {item.review_count} Reviews
                  </Text>
                </>
              )}

              <View className="w-1 h-1 rounded-full bg-border mx-2" />

              <Text
                className={`${status.isOpen ? 'text-success' : 'text-error'} text-xs font-bold uppercase tracking-wide`}
              >
                {status.isOpen ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </AnimatedSection>
  );
};
