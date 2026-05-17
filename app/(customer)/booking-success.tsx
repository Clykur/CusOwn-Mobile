import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';

export default function BookingSuccessScreen() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return <BookingSuccessScreenInner />;
}

function BookingSuccessScreenInner() {
  const { salonName, serviceName, bookingDate, bookingTime, bookingId } = useLocalSearchParams();

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1 justify-center px-luxury" edges={['top', 'bottom']}>
        
        {/* Animated Checkmark and Title */}
        <AnimatedSection direction="up" className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-black items-center justify-center border-4 border-slate-200 shadow-2xl mb-6">
            <Ionicons name="checkmark-circle" size={56} color="#EAB308" />
          </View>
          
          <Text className="text-slate-900 text-3xl font-black tracking-tight text-center uppercase mb-2">
            Booking Confirmed!
          </Text>
          <Text className="text-slate-500 text-sm text-center px-4">
            Your appointment has been successfully scheduled. The service provider has been notified.
          </Text>
        </AnimatedSection>

        {/* Detailed Booking Summary Card */}
        <AnimatedSection direction="up" delay={200} className="mb-10">
          <GlassCard className="p-6 border border-slate-200 bg-white/95 shadow-lg rounded-3xl">
            
            {/* Header Details */}
            <View className="border-b border-slate-100 pb-4 mb-4 items-center">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">
                Appointment ID
              </Text>
              <Text className="text-slate-950 font-black text-lg select-all">
                {bookingId || 'BK-54923'}
              </Text>
            </View>

            {/* List Details */}
            <View className="gap-y-4">
              
              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                    <Ionicons name="business" size={16} color="#0F172A" />
                  </View>
                  <Text className="text-slate-500 text-sm font-semibold">Salon / Studio</Text>
                </View>
                <Text className="text-slate-900 font-extrabold text-sm flex-1 text-right ml-4" numberOfLines={1}>
                  {salonName || 'Signature Styling'}
                </Text>
              </View>

              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                    <Ionicons name="cut" size={16} color="#0F172A" />
                  </View>
                  <Text className="text-slate-500 text-sm font-semibold">Curated Service</Text>
                </View>
                <Text className="text-slate-900 font-extrabold text-sm flex-1 text-right ml-4" numberOfLines={1}>
                  {serviceName || 'Custom Haircut & Trim'}
                </Text>
              </View>

              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                    <Ionicons name="calendar" size={16} color="#0F172A" />
                  </View>
                  <Text className="text-slate-500 text-sm font-semibold">Selected Date</Text>
                </View>
                <Text className="text-slate-900 font-extrabold text-sm flex-1 text-right ml-4" numberOfLines={1}>
                  {bookingDate || 'Monday, May 18, 2026'}
                </Text>
              </View>

              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                    <Ionicons name="time" size={16} color="#0F172A" />
                  </View>
                  <Text className="text-slate-500 text-sm font-semibold">Appointment Time</Text>
                </View>
                <Text className="text-slate-900 font-extrabold text-sm flex-1 text-right ml-4" numberOfLines={1}>
                  {bookingTime || '10:30 AM'}
                </Text>
              </View>

            </View>

            {/* Note block */}
            <View className="mt-6 bg-slate-50 border border-slate-100 p-4 rounded-2xl flex-row items-start">
              <Ionicons name="information-circle-outline" size={18} color="#64748B" className="mt-0.5 mr-2" />
              <Text className="text-slate-500 text-xs leading-relaxed flex-1">
                Please arrive 5-10 minutes prior to your scheduled time. You can view or modify this appointment in the My Bookings section.
              </Text>
            </View>

          </GlassCard>
        </AnimatedSection>

        {/* CTA Buttons */}
        <AnimatedSection direction="up" delay={400} className="gap-y-3">
          <PremiumButton
            title="View My Bookings"
            onPress={() => router.replace('/(customer)/bookings')}
            className="w-full h-14 bg-black rounded-2xl"
          />

          <Pressable
            onPress={() => router.replace('/(customer)')}
            className="w-full h-14 rounded-2xl border border-slate-200 bg-white items-center justify-center shadow-sm"
          >
            <Text className="text-slate-900 font-bold text-base">Back to Dashboard</Text>
          </Pressable>
        </AnimatedSection>

      </SafeAreaView>
    </PremiumBackground>
  );
}
