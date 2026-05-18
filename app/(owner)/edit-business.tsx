import React from 'react';
import { View, Text, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { EditBusinessForm } from '@/components/owner/EditBusinessForm';
import { useOwnerBusinesses } from '@/hooks/useOwner';

export default function EditBusinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: businesses, isLoading } = useOwnerBusinesses();

  const business = businesses?.find(b => b.id === id);

  const handleSuccess = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <PremiumBackground>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#000000" size="large" />
        </View>
      </PremiumBackground>
    );
  }

  if (!business) {
    return (
      <PremiumBackground>
        <View className="flex-1 justify-center items-center px-10">
          <Text className="text-slate-900 text-xl font-black mb-4 text-center">Business Not Found</Text>
          <Text className="text-slate-500 text-center mb-8 font-medium">We couldn't locate the hub details you're trying to edit.</Text>
          <EditBusinessForm
            business={{} as any}
            onCancel={() => router.back()}
          />
        </View>
      </PremiumBackground>
    );
  }

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-luxury"
            contentContainerClassName="pb-12 pt-4"
            showsVerticalScrollIndicator={false}
          >
            <AnimatedSection direction="down" className="mb-8">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-1">Refinement</Text>
              <Text className="text-slate-900 text-3xl font-black tracking-tight">
                Edit Hub Profile
              </Text>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <GlassCard className="p-6 border-slate-200/80 shadow-sm rounded-luxury">
                <EditBusinessForm
                  business={business}
                  onSuccess={handleSuccess}
                  onCancel={() => router.back()}
                />
              </GlassCard>
            </AnimatedSection>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PremiumBackground>
  );
}