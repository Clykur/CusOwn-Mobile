import React from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { CreateBusinessForm } from '@/components/setup/CreateBusinessForm';

export default function CreateBusinessScreen() {
  const handleSuccess = () => {
    router.push('/setup/success');
  };

  return (
    <PremiumBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-luxury pt-16 pb-12" showsVerticalScrollIndicator={false}>
          <AnimatedSection direction="down">
            <Text className="text-accent-premium text-sm font-bold tracking-[6px] uppercase mb-4">
              Step 1: Establishment
            </Text>
            <Text className="text-white text-4xl font-bold tracking-tighter leading-[44px] mb-8">
              Create Your{"\n"}
              <Text className="text-accent-premium">Business</Text> Identity.
            </Text>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <GlassCard className="p-6 mb-8">
              <CreateBusinessForm onSuccess={handleSuccess} />
            </GlassCard>
            <View className="h-12" />
          </AnimatedSection>
        </ScrollView>
      </KeyboardAvoidingView>
    </PremiumBackground>
  );
}
