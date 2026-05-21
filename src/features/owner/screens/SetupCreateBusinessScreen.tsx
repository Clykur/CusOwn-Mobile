import React from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { CreateBusinessForm } from '@/features/owner/components/setup/CreateBusinessForm';

export default function CreateBusinessScreen() {
  const handleSuccess = () => {
    router.push('/setup/success');
  };

  return (
    <PremiumBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-luxury pt-16 pb-12" showsVerticalScrollIndicator={false}>
          <AnimatedSection direction="down">
            <Text className="text-slate-400 text-xs font-black uppercase tracking-[3px] mb-2">
              Create Business
            </Text>
            <Text className="text-slate-900 text-3xl font-black tracking-tight mb-8">
              Create Your{'\n'}
              Business Identity
            </Text>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <GlassCard className="p-2 mb-8 border-slate-200/80 shadow-sm rounded-luxury">
              <CreateBusinessForm onSuccess={handleSuccess} />
            </GlassCard>
            <View className="h-12" />
          </AnimatedSection>
        </ScrollView>
      </KeyboardAvoidingView>
    </PremiumBackground>
  );
}
