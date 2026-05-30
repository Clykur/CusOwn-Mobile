import { THEME } from '@/theme/theme';
import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Business } from '@/types/business.types';
import { Avatar } from '@/components/ui/Avatar';
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
        <View className="flex-row items-center bg-card rounded-full p-4">
          {/* Business Image */}
          <View className="mr-4">
            <Avatar
              userId={item.owner_user_id}
              name={item.salon_name}
              size={76}
              type="business"
              className="w-20 h-20 rounded-full"
            />
          </View>

          {/* Content */}
          <View className="flex-1 min-w-0 justify-center">
            {/* Salon Name */}
            <Text
              className="text-text text-2xl font-extrabold tracking-tight"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.salon_name}
            </Text>

            {/* Address */}
            <Text
              className="text-textSecondary text-sm mt-1 leading-5"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.address || 'Location unavailable'}
            </Text>

            {/* Meta */}
            <View className="flex-row items-center flex-wrap mt-3">
              {/* Rating */}
              <View className="flex-row items-center">
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

              {/* Divider */}
              <View className="w-1 h-1 rounded-full bg-border mx-2" />

              {/* Status */}
              <Text
                className={`${
                  status.isOpen ? 'text-success' : 'text-error'
                } text-xs font-black uppercase tracking-wide`}
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
