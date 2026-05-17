import React from 'react';
import {
    View,
    Text,
    Pressable,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Business } from '@/types/business.types';

interface Props {
    item: Business;
    index?: number;
}

export const BusinessCard = ({
    item,
    index = 0,
}: Props) => {
    return (
        <AnimatedSection
            delay={index * 50}
            direction="up"
            className="mb-4"
        >
            <Pressable
                onPress={() =>
                    router.push(
                        `/(customer)/browse/salons/${item.id}`
                    )
                }
            >
                <View className="flex-row bg-white border border-slate-200 rounded-[28px] p-4 shadow-sm">

                    {/* Left Image */}
                    <Image
                        source={{
                            uri:
                                item.image_url ||
                                'https://via.placeholder.com/100',
                        }}
                        style={{
                            width: 96,
                            height: 96,
                            borderRadius: 24,
                        }}
                        resizeMode="cover"
                    />

                    {/* Right Content */}
                    <View className="flex-1 ml-4 justify-center">

                        <Text
                            className="text-slate-900 text-[20px] font-bold"
                            numberOfLines={1}
                        >
                            {item.salon_name}
                        </Text>

                        <Text
                            className="text-slate-500 text-sm mt-1 leading-5"
                            numberOfLines={2}
                        >
                            {item.address}
                        </Text>

                        <View className="flex-row items-center mt-3">

                            <View className="flex-row items-center">
                                <Ionicons
                                    name={item.rating_avg && Number(item.rating_avg) > 0 ? "star" : "star-outline"}
                                    size={14}
                                    color={item.rating_avg && Number(item.rating_avg) > 0 ? "#F59E0B" : "#94A3B8"}
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

                            <Text className="text-slate-500 text-[11px] font-bold uppercase tracking-wide">
                                Open Now
                            </Text>

                        </View>
                    </View>
                </View>
            </Pressable>
        </AnimatedSection>
    );
};