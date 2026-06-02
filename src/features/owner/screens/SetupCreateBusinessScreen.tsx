import { router } from 'expo-router';
import React from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { CreateBusinessForm } from '@/features/owner/components/setup/CreateBusinessForm';
import type { Business } from '@/types/business.types';

export default function CreateBusinessScreen() {
  const handleSuccess = (data: Business) => {
    router.push({
      pathname: '/setup/success',
      params: { businessId: data.id },
    });
  };

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-luxury"
            contentContainerClassName="pt-8 pb-12"
            showsVerticalScrollIndicator={false}
          >
            <AnimatedSection direction="down" className="mb-8">
              <Text className="text-textSecondary text-xs font-black uppercase tracking-1 mb-2">
                Create Business
              </Text>
              <Text className="text-text text-3xl font-black tracking-tight">
                Create Your{'\n'}
                <Text className="text-primary">Business Identity</Text>
              </Text>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <GlassCard className="p-2 mb-8 border-border shadow-sm rounded-luxury bg-card">
                <CreateBusinessForm onSuccess={handleSuccess} />
              </GlassCard>
              <View className="h-12" />
            </AnimatedSection>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PremiumBackground>
  );
}
