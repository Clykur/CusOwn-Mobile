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
        <View className="flex-row bg-white border border-slate-200 rounded-[28px] p-4 shadow-sm">
          {/* Left Image with Owner Profile Overlay */}
          <View className="relative">
            {item.owner_image ? (
              <Image
                source={{ uri: item.owner_image }}
                className="w-[80px] h-[80px] rounded-full"
                style={{ objectFit: 'cover' }}
              />
            ) : item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                className="w-[80px] h-[80px] rounded-full"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <Avatar name={item.salon_name} size={80} className="w-[80px] h-[80px] rounded-full" />
            )}
            {item.owner_image ? (
              <Image
                source={{ uri: item.owner_image }}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full border-2 border-white shadow-md"
              />
            ) : null}
          </View>

          {/* Right Content */}
          <View className="flex-1 ml-4 justify-center">
            <Text className="text-slate-900 text-[20px] font-bold" numberOfLines={1}>
              {item.salon_name}
            </Text>

            <Text className="text-slate-500 text-sm mt-1 leading-5" numberOfLines={2}>
              {item.address}
            </Text>

            <View className="flex-row items-center mt-3">
              <View className="flex-row items-center">
                <Ionicons
                  name={item.rating_avg && Number(item.rating_avg) > 0 ? 'star' : 'star-outline'}
                  size={14}
                  color={item.rating_avg && Number(item.rating_avg) > 0 ? '#F59E0B' : '#94A3B8'}
                />

                <Text className="text-black text-xs font-bold ml-1">
                  {Number(item.rating_avg).toFixed(1)}
                </Text>
              </View>

              {item.review_count > 0 && (
                <>
                  <View className="w-1 h-1 rounded-full bg-slate-300 mx-2" />
                  <Text className="text-slate-500 text-[11px] font-bold uppercase tracking-wide">
                    {item.review_count} Reviews
                  </Text>
                </>
              )}

              <View className="w-1 h-1 rounded-full bg-slate-300 mx-2" />

              <Text
                className={`${status.isOpen ? 'text-green-600' : 'text-rose-500'} text-[11px] font-bold uppercase tracking-wide`}
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
