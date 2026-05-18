import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';

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
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return <BookingSuccessScreenInner />;
}

function BookingSuccessScreenInner() {
  const { salonName, serviceName, bookingDate, bookingTime, bookingId, totalPrice, salonImage } =
    useLocalSearchParams();

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
            <View className="w-20 h-20 rounded-full bg-black items-center justify-center border border-slate-200 mb-5">
              <Ionicons name="checkmark" size={42} color="#EAB308" />
            </View>

            <Text className="text-slate-900 text-[34px] font-black tracking-tight text-center uppercase">
              Booking Confirmed!
            </Text>

            <Text className="text-slate-500 text-base text-center leading-7 mt-3 px-4">
              Your appointment has been successfully scheduled. The service provider has been
              notified.
            </Text>
          </AnimatedSection>

          {/* Booking Summary */}
          <AnimatedSection direction="up" delay={120} className="mb-6">
            <GlassCard className="bg-white border border-slate-200 rounded-[30px] p-6 shadow-sm">
              {/* Booking ID */}
              <View className="items-center pb-5 border-b border-slate-100">
                <Text className="text-slate-400 text-[11px] font-black uppercase tracking-[2px] mb-2">
                  Appointment ID
                </Text>

                <Text className="text-slate-950 text-[30px] font-black">
                  {bookingId || 'BK-54923'}
                </Text>
              </View>

              {/* Service Details */}
              <View className="mt-5 gap-y-5">
                {/* Salon */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1 mr-3">
                    {salonImage ? (
                      <Image
                        source={{ uri: String(salonImage) }}
                        className="w-11 h-11 rounded-full mr-3 border border-slate-200"
                      />
                    ) : (
                      <View className="w-11 h-11 rounded-full bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                        <Ionicons name="business" size={18} color="#0F172A" />
                      </View>
                    )}

                    <View className="flex-1">
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        Salon / Studio
                      </Text>

                      <Text className="text-slate-900 font-black text-sm mt-1" numberOfLines={1}>
                        {salonName || 'Signature Styling'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Service */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-11 h-11 rounded-full bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                      <Ionicons name="cut" size={18} color="#0F172A" />
                    </View>

                    <View className="flex-1">
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        Curated Service
                      </Text>

                      <Text className="text-slate-900 font-black text-sm mt-1" numberOfLines={1}>
                        {serviceName || 'Haircut & Styling'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Date */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-11 h-11 rounded-full bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                      <Ionicons name="calendar" size={18} color="#0F172A" />
                    </View>

                    <View className="flex-1">
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        Selected Date
                      </Text>

                      <Text className="text-slate-900 font-black text-sm mt-1" numberOfLines={1}>
                        {bookingDate || 'Monday, May 18, 2026'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Time */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-11 h-11 rounded-full bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                      <Ionicons name="time" size={18} color="#0F172A" />
                    </View>

                    <View className="flex-1">
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        Appointment Time
                      </Text>

                      <Text className="text-slate-900 font-black text-sm mt-1" numberOfLines={1}>
                        {bookingTime || '10:30 AM'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Price */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-11 h-11 rounded-full bg-emerald-50 items-center justify-center mr-3 border border-emerald-100">
                      <Ionicons name="cash-outline" size={18} color="#059669" />
                    </View>

                    <View className="flex-1">
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        Total Amount
                      </Text>

                      <Text className="text-emerald-600 font-black text-lg mt-1">
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
              <View className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-3 flex-row items-start">
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#64748B"
                  style={{ marginTop: 1, marginRight: 8 }}
                />

                <Text className="text-slate-500 text-xs leading-6 flex-1">
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
              className="w-full h-14 bg-black rounded-2xl"
            />

            <Pressable
              onPress={() => router.replace('/(customer)')}
              className="w-full h-14 rounded-2xl border border-slate-200 bg-white items-center justify-center"
            >
              <Text className="text-slate-900 font-bold text-base">Back to Dashboard</Text>
            </Pressable>
          </AnimatedSection>
        </ScrollView>
      </SafeAreaView>
    </PremiumBackground>
  );
}
