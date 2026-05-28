import React, { useState, useEffect } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';

import { THEME } from '@/theme/theme';
import { useAuthStore } from '@/store/auth.store';
import { apiService } from '@/services/api.service';

export default function RecoveryScreen() {
  const { profile, refreshProfile, clearSession, role } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.permanent_deletion_at) {
      const permanentDate = new Date(profile.permanent_deletion_at);

      const now = new Date();

      const diffMs = permanentDate.getTime() - now.getTime();

      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      setDaysRemaining(diffDays > 0 ? diffDays : 0);
    } else {
      setDaysRemaining(30);
    }
  }, [profile]);

  const handleRestore = async () => {
    setLoading(true);

    try {
      await apiService.restoreAccount();

      await refreshProfile();

      Alert.alert('Account Restored', 'Welcome back!');

      const target = role === 'Owner' ? '/(owner)' : '/(customer)';
      router.replace(target as any);
    } catch (err: any) {
      Alert.alert('Restore Failed', err?.message || 'Could not restore account.');
    } finally {
      setLoading(false);
    }
  };

  const handleHardDelete = () => {
    Alert.alert(
      'Permanent Deletion',
      'Are you absolutely sure? This action cannot be undone and all your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);

            try {
              await apiService.hardDeleteAccount();

              await clearSession();

              router.replace('/(public)/welcome');
            } catch (err: any) {
              Alert.alert('Deletion Failed', err?.message || 'Could not delete account.');

              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1 justify-center px-6">
        <AnimatedSection direction="up">
          <GlassCard className="p-2 rounded-[32px] border border-border items-center">
            {/* Icon */}
            <View className="rounded-full items-center justify-center mb-8 mt-6">
              <Ionicons name="trash-outline" size={42} color={THEME.colors.error} />
            </View>

            {/* Title */}
            <Text className="text-white text-4xl font-black text-center leading-tight mb-4">
              Account{'\n'}Deactivated
            </Text>

            {/* Description */}
            <Text className="text-textSecondary text-center text-lg leading-8 mb-8 px-2">
              Your account is currently scheduled for permanent deletion.
            </Text>

            {/* Days Remaining */}
            {daysRemaining !== null && (
              <Text className="text-error text-center text-2xl font-black leading-10 mb-10">
                It will be permanently deleted in {daysRemaining} days.
              </Text>
            )}

            {/* Buttons */}
            <View className="gap-y-3">
              {/* Restore */}
              <Pressable
                onPress={handleRestore}
                disabled={loading}
                className="bg-primary rounded-full py-5 items-center justify-center active:opacity-80"
              >
                <Text className="text-black font-black text-sm uppercase tracking-[2px]">
                  {loading ? 'Processing...' : 'Restore Account'}
                </Text>
              </Pressable>

              {/* Delete */}
              <Pressable
                onPress={handleHardDelete}
                disabled={loading}
                className="border border-red-500 rounded-full py-5 items-center justify-center active:opacity-80"
              >
                <Text className="px-3 text-red-500 font-black text-sm uppercase tracking-[3px]">
                  Delete Permanently
                </Text>
              </Pressable>
            </View>
          </GlassCard>
        </AnimatedSection>
      </SafeAreaView>
    </PremiumBackground>
  );
}
