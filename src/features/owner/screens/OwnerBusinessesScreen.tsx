import { THEME } from '@/theme/theme';
import React from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Ionicons } from '@expo/vector-icons';
import {
  useOwnerBusinesses,
  useDeletedOwnerBusinesses,
  useRestoreBusiness,
  useHardDeleteBusiness,
} from '@/hooks/useOwner';
import { router } from 'expo-router';
import { useState } from 'react';
import { useModal } from '@/hooks/useModal';

export default function OwnerBusinessesScreen() {
  const { data: businesses, isLoading, isError, refetch } = useOwnerBusinesses();
  const { data: deletedBusinesses, refetch: refetchDeleted } = useDeletedOwnerBusinesses();
  const restoreMutation = useRestoreBusiness();
  const hardDeleteMutation = useHardDeleteBusiness();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { showModal } = useModal();

  const onAddBusiness = () => {
    router.push('/setup/create');
  };

  const onManageBusiness = (id: string) => {
    router.push(`/(owner)/hub/${id}`);
  };

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchDeleted()]);
  };

  if (isError) {
    return (
      <PremiumBackground>
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 justify-center items-center px-luxury">
            <GlassCard className="items-center w-full p-8 rounded-luxury border border-border">
              <View className="w-20 h-20 rounded-full bg-input items-center justify-center mb-6 border border-border">
                <Ionicons name="alert-circle-outline" size={40} color={THEME.colors.error} />
              </View>
              <Text className="text-text text-xl font-bold mb-2">Fetch Error</Text>
              <Text className="text-textSecondary text-center px-12 text-sm font-medium">
                We couldn't retrieve your business portfolio. Please check your connection.
              </Text>
              <Pressable
                onPress={() => refetch()}
                className="mt-8 bg-primary px-8 py-3.5 rounded-full active:opacity-80"
              >
                <Text className="text-background font-black text-xs uppercase tracking-widest">
                  Retry
                </Text>
              </Pressable>
            </GlassCard>
          </View>
        </SafeAreaView>
      </PremiumBackground>
    );
  }

  if (isLoading) {
    return (
      <PremiumBackground>
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="px-luxury pt-6">
            <LoadingSkeleton height={40} width={150} className="mb-8" />
            <LoadingSkeleton height={140} className="mb-4" borderRadius={28} />
            <LoadingSkeleton height={140} className="mb-4" borderRadius={28} />
          </View>
        </SafeAreaView>
      </PremiumBackground>
    );
  }

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-luxury pb-12 pt-4"
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor={THEME.colors.primary}
            />
          }
        >
          <AnimatedSection direction="down" className="mb-8">
            <Text className="text-textSecondary text-xs font-black uppercase tracking-1 mb-1">
              Management
            </Text>
            <Text className="text-text text-3xl font-black tracking-tight">Businesses</Text>
          </AnimatedSection>

          <View className="gap-y-4">
            {businesses?.map((b, index) => (
              <AnimatedSection key={b.id} delay={index * 100} direction="up">
                <Pressable onPress={() => onManageBusiness(b.id)}>
                  <GlassCard className="p-2 border border-border rounded-luxury">
                    <View className="flex-row justify-between items-start mb-6">
                      <View className="flex-1 mr-4">
                        <Text className="text-text text-xl font-extrabold mb-1">
                          {b.salon_name}
                        </Text>

                        <View className="flex-row items-center opacity-70">
                          <Ionicons
                            name="location-outline"
                            size={12}
                            color={THEME.colors.textSecondary}
                          />

                          <Text className="text-textSecondary text-xs ml-1" numberOfLines={1}>
                            {b.location || 'No location set'}
                          </Text>
                        </View>
                      </View>

                      {/* Chevron */}
                      <View className="flex-row items-center">
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={THEME.colors.textSecondary}
                        />
                      </View>
                    </View>

                    <View className="h-[0.5px] bg-border w-full mb-2" />

                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-textSecondary text-xs font-black uppercase tracking-widest mb-1">
                          Operational Since
                        </Text>

                        <Text className="text-text text-xs font-semibold">
                          {new Date(b.created_at).toLocaleDateString()}
                        </Text>
                      </View>

                      {/* Active Status */}
                      <View className="flex-row items-center">
                        <View className="w-1.5 h-1.5 rounded-full bg-success mr-2" />

                        <Text className="text-success text-xs font-bold uppercase tracking-0.5">
                          Active
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>
              </AnimatedSection>
            ))}

            <AnimatedSection
              delay={businesses?.length ? businesses.length * 100 : 100}
              direction="up"
            >
              <Pressable
                onPress={onAddBusiness}
                className="border border-dashed border-border rounded-luxury p-8 items-center justify-center bg-input/40 active:bg-input mb-8"
              >
                <View className="w-12 h-12 rounded-full border border-primary/30 bg-secondary/30 items-center justify-center mb-4">
                  <Ionicons name="add" size={24} color={THEME.colors.primary} />
                </View>
                <Text className="text-text font-black text-xs uppercase tracking-wider">
                  Launch New Business Hub
                </Text>
                <Text className="text-textSecondary text-xs mt-1 font-medium">
                  Expand your portfolio with a new location
                </Text>
              </Pressable>
            </AnimatedSection>

            {/* Deleted Businesses Section */}
            {deletedBusinesses && deletedBusinesses.length > 0 && (
              <AnimatedSection direction="up" className="mt-4">
                <Text className="text-textSecondary text-xs font-black uppercase tracking-1 mb-4">
                  Recently Deleted
                </Text>

                {deletedBusinesses.map((b) => {
                  let daysRemaining = 30;
                  if (b.permanent_deletion_at) {
                    const diffMs =
                      new Date(b.permanent_deletion_at).getTime() - new Date().getTime();
                    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                  }

                  return (
                    <GlassCard
                      key={b.id}
                      className="p-2 border border-error/30 bg-error/5 rounded-luxury mb-4"
                    >
                      <View className="flex-row justify-between items-start mb-6">
                        <View className="flex-1 mr-4">
                          <Text className="text-text text-xl font-extrabold mb-1">
                            {b.salon_name}
                          </Text>

                          <Text className="text-error text-xs font-bold uppercase tracking-0.5">
                            {daysRemaining} Days until permanent deletion
                          </Text>
                        </View>
                      </View>

                      <View className="h-[0.5px] bg-border w-full mb-2" />

                      <View className="flex-row justify-between items-center mt-2">
                        {/* Delete Left */}
                        <Pressable
                          disabled={processingId === b.id}
                          onPress={() => {
                            showModal({
                              variant: 'delete',
                              title: 'Permanent Deletion',
                              description: `Are you sure you want to permanently delete ${b.salon_name} now? This cannot be undone.`,
                              dismissible: true,
                              actions: [
                                {
                                  label: 'Delete Permanently',
                                  variant: 'danger',
                                  onPress: () => {
                                    setProcessingId(b.id);

                                    hardDeleteMutation.mutate(b.id, {
                                      onSettled: () => setProcessingId(null),

                                      onSuccess: () =>
                                        showModal({
                                          variant: 'success',
                                          title: 'Deleted',
                                          description: `${b.salon_name} has been permanently deleted.`,
                                        }),

                                      onError: (err) =>
                                        showModal({
                                          variant: 'error',
                                          title: 'Deletion Failed',
                                          description: err.message,
                                        }),
                                    });
                                  },
                                },
                              ],
                            });
                          }}
                          className="px-4 py-2"
                        >
                          <Text className="text-error text-xs font-black uppercase tracking-wider">
                            Delete Now
                          </Text>
                        </Pressable>

                        {/* Restore Right */}
                        <Pressable
                          disabled={processingId === b.id}
                          onPress={() => {
                            setProcessingId(b.id);

                            restoreMutation.mutate(b.id, {
                              onSettled: () => setProcessingId(null),

                              onSuccess: () =>
                                showModal({
                                  variant: 'success',
                                  title: 'Restored',
                                  description: `${b.salon_name} has been restored successfully.`,
                                }),

                              onError: (err) =>
                                showModal({
                                  variant: 'error',
                                  title: 'Restore Failed',
                                  description: err.message,
                                }),
                            });
                          }}
                          className="bg-primary px-4 py-2 rounded-full"
                        >
                          <Text className="text-background text-xs font-black uppercase tracking-wider">
                            {processingId === b.id ? 'Restoring...' : 'Restore'}
                          </Text>
                        </Pressable>
                      </View>
                    </GlassCard>
                  );
                })}
              </AnimatedSection>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </PremiumBackground>
  );
}
