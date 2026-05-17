import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/Avatar';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

import { Business } from '@/types/business.types';

interface BrowseSalonCardProps {
    item: Business;
    index?: number;
    onPress?: () => void;
}

export function BusinessCard({
    item,
    index = 0,
    onPress,
}: BrowseSalonCardProps) {
    return (
        <AnimatedSection
            delay={index * 100}
            direction="right"
            className="mr-4"
        >
            <Pressable onPress={onPress}>
                <GlassCard className="w-[220px] p-4 border border-slate-200/80 bg-white/90 shadow-sm items-center">

                    {/* Salon Image */}
                    <Avatar
                        url={item.image_url}
                        name={item.salon_name}
                        size={120}
                        className="w-[120px] h-[120px] rounded-full mb-4"
                    />

                    {/* Salon Details */}
                    <View className="items-center w-full">

                        <Text
                            className="text-slate-900 text-lg font-bold tracking-tight text-center"
                            numberOfLines={1}
                        >
                            {item.salon_name}
                        </Text>

                        <Text
                            className="text-slate-500 text-xs leading-4 text-center mt-1"
                            numberOfLines={2}
                        >
                            {item.address}
                        </Text>

                        <View className="flex-row items-center mt-3 gap-x-1">
                            <Ionicons name="star" size={14} color="#000000" />

                            <Text className="text-accent-premium text-xs font-bold">
                                {Number.isFinite(Number(item.rating_avg)) && Number(item.rating_avg) > 0
                                    ? Number(item.rating_avg).toFixed(1)
                                    : '0.0'}
                            </Text>
                        </View>

                    </View>

                </GlassCard>
            </Pressable>
        </AnimatedSection>
    );
}