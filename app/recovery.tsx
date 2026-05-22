import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/theme/theme';
import { useAuthStore } from '@/store/auth.store';
import { apiService } from '@/services/api.service';
import { router } from 'expo-router';

export default function RecoveryScreen() {
  const { profile, refreshProfile, clearSession } = useAuthStore();
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
      // Default to 30 if no specific date is set but it's deleted
      setDaysRemaining(30);
    }
  }, [profile]);

  const handleRestore = async () => {
    setLoading(true);
    try {
      await apiService.restoreAccount();
      await refreshProfile(); // Refresh profile so _layout.tsx redirects user back to app
      Alert.alert('Account Restored', 'Welcome back!');
    } catch (err: any) {
      Alert.alert('Restore Failed', err.message || 'Could not restore account.');
    } finally {
      setLoading(false);
    }
  };

  const handleHardDelete = () => {
    Alert.alert(
      'Permanent Deletion',
      'Are you absolutely sure? This action cannot be undone. All your data will be permanently wiped.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await apiService.hardDeleteAccount();
              await clearSession(); // This signs out the user locally (since they are deleted from auth.users now)
              router.replace('/(public)/welcome');
            } catch (err: any) {
              Alert.alert('Deletion Failed', err.message || 'Could not delete account.');
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1 justify-center px-luxury">
        <AnimatedSection direction="up">
          <GlassCard className="p-8 border border-border rounded-[32px] items-center text-center">
            <View className="w-20 h-20 bg-error/10 border border-error/20 rounded-full items-center justify-center mb-6">
              <Ionicons name="trash-outline" size={40} color={THEME.colors.error} />
            </View>

            <Text className="text-text text-2xl font-black text-center mb-2">
              Account Deactivated
            </Text>

            <Text className="text-textSecondary text-center font-medium leading-6 mb-8">
              Your account is currently scheduled for permanent deletion.
              {daysRemaining !== null && (
                <Text className="text-primary font-bold">
                  {`\nIt will be permanently deleted in ${daysRemaining} days.`}
                </Text>
              )}
            </Text>

            <View className="w-full gap-y-4">
              <Pressable
                onPress={handleRestore}
                disabled={loading}
                className="w-full bg-primary rounded-full py-4 items-center justify-center active:opacity-80"
              >
                <Text className="text-background font-black text-xs uppercase tracking-widest">
                  {loading ? 'Processing...' : 'Restore Account'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleHardDelete}
                disabled={loading}
                className="w-full bg-transparent border border-error rounded-full py-4 items-center justify-center active:bg-error/10"
              >
                <Text className="text-error font-black text-xs uppercase tracking-widest">
                  Delete Permanently Now
                </Text>
              </Pressable>
            </View>
          </GlassCard>
        </AnimatedSection>
      </SafeAreaView>
    </PremiumBackground>
  );
}
