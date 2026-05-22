import React from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';

import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/theme/theme';

const { width, height } = Dimensions.get('window');

export default function SuccessScreen() {
  const isSmallDevice = height < 700;
  const { businessId } = useLocalSearchParams();
  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
          }}
          bounces={false}
        >
          <View
            className="flex-1 px-6"
            style={{
              paddingTop: isSmallDevice ? 14 : 24,
              paddingBottom: isSmallDevice ? 18 : 30,
            }}
          >
            {/* SUCCESS HERO */}
            <AnimatedSection direction="down" className="items-center">
              {/* Glow */}
              <View
                className="absolute rounded-full bg-primary/10"
                style={{
                  width: width * 0.45,
                  height: width * 0.45,
                }}
              />

              {/* Success Icon */}
              <View
                className="rounded-full bg-primary items-center justify-center shadow-lg"
                style={{
                  width: isSmallDevice ? 66 : 82,
                  height: isSmallDevice ? 66 : 82,
                  marginBottom: isSmallDevice ? 20 : 28,
                }}
              >
                <Ionicons
                  name="checkmark"
                  size={isSmallDevice ? 34 : 44}
                  color={THEME.colors.background}
                />
              </View>

              {/* Heading */}
              <Text
                className="text-text font-black text-center tracking-tight"
                style={{
                  fontSize: isSmallDevice ? 25 : 31,
                  lineHeight: isSmallDevice ? 34 : 40,
                }}
              >
                Business{'\n'}
                <Text className="text-primary">Successfully Created</Text>
              </Text>

              {/* Description */}
              <Text
                className="text-textSecondary text-center font-medium px-4"
                style={{
                  marginTop: 16,
                  fontSize: isSmallDevice ? 13 : 15,
                  lineHeight: isSmallDevice ? 24 : 28,
                }}
              >
                Your business profile is now live on CusOwn and ready to accept customer bookings.
              </Text>
            </AnimatedSection>

            {/* STATUS CARDS */}
            <AnimatedSection delay={150} direction="up" className="mt-6">
              {/* CARD 1 */}
              <GlassCard className="bg-card rounded-[28px] px-4 py-4 border border-white/5 mb-4">
                <View className="flex-row items-start">
                  <View className="w-12 h-12 rounded-2xl items-center justify-center border border-success/20">
                    <Ionicons name="radio-outline" size={22} color={THEME.colors.success} />
                  </View>

                  <View className="flex-1 ml-4">
                    <Text className="text-text text-sm font-black mb-1">Business Profile Live</Text>

                    <Text className="text-textSecondary text-xs leading-6">
                      Customers can now discover your salon and book appointments instantly through
                      CusOwn.
                    </Text>
                  </View>
                </View>
              </GlassCard>

              {/* CARD 2 */}
              <GlassCard className="bg-card rounded-[28px] px-4 py-4 border border-white/5">
                <View className="flex-row items-start">
                  <View className="w-12 h-12 rounded-2xl items-center justify-center border border-primary/20">
                    <Ionicons name="sparkles-outline" size={22} color={THEME.colors.primary} />
                  </View>

                  <View className="flex-1 ml-4">
                    <Text className="text-text text-sm font-black mb-1">Ready for Growth</Text>

                    <Text className="text-textSecondary text-xs leading-6">
                      Manage bookings, services, business timings, and customer engagement directly
                      from your dashboard.
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </AnimatedSection>

            {/* ACTIONS */}
            <AnimatedSection delay={300} direction="up" className="mt-8">
              <PremiumButton
                title="Enter Dashboard"
                onPress={() => router.replace('/(owner)')}
                className="w-full mb-3"
              />

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(owner)/hub/[id]',
                    params: {
                      id: businessId as string,
                    },
                  })
                }
              >
                <Text className="text-textSecondary text-center text-sm font-semibold">
                  View Business Profile
                </Text>
              </Pressable>
            </AnimatedSection>
          </View>
        </ScrollView>
      </SafeAreaView>
    </PremiumBackground>
  );
}
