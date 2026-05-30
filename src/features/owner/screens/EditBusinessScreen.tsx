import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { EditBusinessForm } from '@/features/owner/components/EditBusinessForm';
import { useOwnerBusinesses } from '@/hooks/useOwner';
import { THEME } from '@/theme/theme';

export default function EditBusinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: businesses, isLoading } = useOwnerBusinesses();

  const business = businesses?.find((b) => b.id === id);

  const handleSuccess = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <PremiumBackground>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color={THEME.colors.primary} size="large" />
          <Text className="text-textSecondary text-sm font-semibold mt-4">
            Loading business details...
          </Text>
        </View>
      </PremiumBackground>
    );
  }

  if (!business) {
    return (
      <PremiumBackground>
        <SafeAreaView className="flex-1 justify-center items-center px-luxury">
          <GlassCard className="bg-card rounded-3xl p-1 w-full items-center">
            <Ionicons name="business-outline" size={48} color={THEME.colors.textSecondary} />
            <Text className="text-text text-xl font-black mb-3 text-center mt-4">
              Business Not Found
            </Text>
            <Text className="text-textSecondary text-center mb-6 font-medium text-sm leading-6">
              We couldn't locate the business details you're trying to edit.
            </Text>
            <Pressable onPress={() => router.back()} className="bg-primary px-8 py-3 rounded-full">
              <Text className="text-background font-bold">Go Back</Text>
            </Pressable>
          </GlassCard>
        </SafeAreaView>
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
            {/* Header */}
            <AnimatedSection direction="down" className="mb-8">
              <Text className="text-textSecondary text-xs font-black uppercase tracking-1 mb-1">
                Manage Business
              </Text>
              <Text className="text-text text-3xl font-black tracking-tight">
                Edit Business{'\n'}
                <Text className="text-primary">Profile</Text>
              </Text>
            </AnimatedSection>

            {/* Form Card */}
            <AnimatedSection delay={200}>
              <GlassCard className="p-2 border-border shadow-sm rounded-luxury bg-card">
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
