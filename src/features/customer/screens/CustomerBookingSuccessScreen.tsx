import { BASE_COLORS, THEME } from '@/theme/theme';
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { isValidImageUrl } from '@/utils/image';

export default function BookingSuccessScreen() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: THEME.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  return <BookingSuccessScreenInner />;
}

function BookingSuccessScreenInner() {
  const params = useLocalSearchParams();
  const salonName = Array.isArray(params.salonName) ? params.salonName[0] : params.salonName;
  const salonImage = Array.isArray(params.salonImage) ? params.salonImage[0] : params.salonImage;
  const serviceName = Array.isArray(params.serviceName)
    ? params.serviceName[0]
    : params.serviceName;
  const bookingDate = Array.isArray(params.bookingDate)
    ? params.bookingDate[0]
    : params.bookingDate;
  const bookingTime = Array.isArray(params.bookingTime)
    ? params.bookingTime[0]
    : params.bookingTime;
  const bookingId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId;
  const totalPrice = Array.isArray(params.totalPrice) ? params.totalPrice[0] : params.totalPrice;
  const ownerUserId = Array.isArray(params.ownerUserId)
    ? params.ownerUserId[0]
    : params.ownerUserId;

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 28,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Section */}
          <AnimatedSection direction="up" className="items-center mb-5">
            <View className="w-20 h-20 rounded-full border border-primary/30 items-center justify-center  mb-5">
              <Ionicons name="checkmark" size={42} color={THEME.colors.primary} />
            </View>

            <Text className="text-text text-4xl font-black tracking-tight text-center uppercase">
              Booking Confirmed!
            </Text>

            <Text className="text-textSecondary text-base text-center leading-7 mt-3 px-4">
              Your appointment has been successfully scheduled. The service provider has been
              notified.
            </Text>
          </AnimatedSection>

          {/* Booking Summary */}
          <AnimatedSection direction="up" delay={120} className="mb-6">
            <GlassCard className="bg-card  rounded-[30px] p-2 shadow-sm">
              {/* Booking ID */}
              <View className="items-center pb-5 border-b border-border">
                <Text className="text-textSecondary text-sm font-black uppercase tracking-[2px] mb-2">
                  Appointment ID
                </Text>

                <Text className="text-text text-base text-[15px] font-black text-center">
                  {bookingId || 'CUSOWN-54923'}
                </Text>
              </View>

              {/* Service Details */}
              <View className="mt-5 gap-y-5">
                {/* Salon */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1 mr-3">
                    <Avatar
                      userId={ownerUserId}
                      name={String(salonName || 'Salon')}
                      size={44}
                      className="mr-3"
                    />

                    <View className="flex-1">
                      <Text className="text-textSecondary text-xs font-black uppercase tracking-wider">
                        Salon Name
                      </Text>

                      <Text className="text-text font-black text-sm mt-1" numberOfLines={1}>
                        {salonName || 'Signature Styling'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Service */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-11 h-11 rounded-full border border-primary/30 items-center justify-center mr-3 ">
                      <Ionicons name="cut-outline" size={18} color={THEME.colors.primary} />
                    </View>

                    <View className="flex-1">
                      <Text className="text-textSecondary text-xs font-black uppercase tracking-wider">
                        Service
                      </Text>

                      <Text className="text-text font-black text-sm mt-1" numberOfLines={1}>
                        {serviceName || 'Haircut & Styling'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Date */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-11 h-11 rounded-full border border-primary/30 items-center justify-center mr-3 ">
                      <Ionicons name="calendar-outline" size={18} color={THEME.colors.primary} />
                    </View>

                    <View className="flex-1">
                      <Text className="text-textSecondary text-xs font-black uppercase tracking-wider">
                        Selected Date
                      </Text>

                      <Text className="text-text font-black text-sm mt-1" numberOfLines={1}>
                        {bookingDate || 'Monday, May 18, 2026'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Time */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-11 h-11 rounded-full border border-primary/30 items-center justify-center mr-3 ">
                      <Ionicons name="time-outline" size={18} color={THEME.colors.primary} />
                    </View>

                    <View className="flex-1">
                      <Text className="text-textSecondary text-xs font-black uppercase tracking-wider">
                        Appointment Time
                      </Text>

                      <Text className="text-text font-black text-sm mt-1" numberOfLines={1}>
                        {bookingTime || '10:30 AM'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Price */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-11 h-11 rounded-full items-center justify-center mr-3 border border-primary/30">
                      <Ionicons name="cash-outline" size={18} color={THEME.colors.primary} />
                    </View>

                    <View className="flex-1">
                      <Text className="text-textSecondary text-xs font-black uppercase tracking-wider">
                        Total Amount
                      </Text>

                      <Text className="text-primary font-black text-lg mt-1">
                        ₹
                        {(() => {
                          const rawVal = Array.isArray(totalPrice) ? totalPrice[0] : totalPrice;
                          const parsed = Number(rawVal);
                          const calculatedPrice = isNaN(parsed) || parsed <= 0 ? 0 : parsed;
                          return calculatedPrice.toFixed(2);
                        })()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Info Note */}
              <View className="mt-6 bg-border/30  rounded-2xl p-3 flex-row items-start">
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={THEME.colors.textSecondary}
                  style={{ marginTop: 1, marginRight: 8 }}
                />

                <Text className="text-textSecondary text-xs leading-6 flex-1">
                  Please arrive 5–10 minutes before your scheduled appointment. You can manage this
                  booking anytime from the My Bookings section.
                </Text>
              </View>
            </GlassCard>
          </AnimatedSection>

          {/* Buttons */}
          <AnimatedSection direction="up" delay={250} className="gap-y-3 mt-auto">
            <PremiumButton
              title="View My Bookings"
              onPress={() => router.replace('/(customer)/bookings')}
              className="w-full h-14 bg-primary rounded-2xl"
            />

            <Pressable
              onPress={() => router.replace('/(customer)')}
              className="w-full h-14 rounded-2xl  bg-card items-center justify-center"
            >
              <Text className="text-text font-bold text-base">Back to Dashboard</Text>
            </Pressable>
          </AnimatedSection>
        </ScrollView>
      </SafeAreaView>
    </PremiumBackground>
  );
}
