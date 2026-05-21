import { THEME } from '@/theme/theme';
import React from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Ionicons } from '@expo/vector-icons';
import { useOwnerBusinesses } from '@/hooks/useOwner';
import { router } from 'expo-router';

export default function OwnerBusinessesScreen() {
  const { data: businesses, isLoading, isError, refetch } = useOwnerBusinesses();

  const onAddBusiness = () => {
    router.push('/setup/create');
  };

  const onManageBusiness = (id: string) => {
    router.push(`/(owner)/hub/${id}`);
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
              onRefresh={refetch}
              tintColor={THEME.colors.primary}
            />
          }
        >
          <AnimatedSection direction="down" className="mb-8">
            <Text className="text-textSecondary text-xs font-black uppercase tracking-[3px] mb-1">
              Management
            </Text>
            <Text className="text-text text-3xl font-black tracking-tight">Businesses</Text>
          </AnimatedSection>

          <View className="gap-y-4">
            {businesses?.map((b, index) => (
              <AnimatedSection key={b.id} delay={index * 100} direction="up">
                <GlassCard className="p-2 border border-border rounded-luxury">
                  <View className="flex-row justify-between items-start mb-6">
                    <View className="flex-1 mr-4">
                      <Text className="text-text text-xl font-extrabold mb-1">{b.salon_name}</Text>
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
                    <View className="flex-row items-center">
                      <View className="w-1.5 h-1.5 rounded-full bg-success mr-2" />

                      <Text className="text-success text-xs font-bold uppercase tracking-[2px]">
                        Active
                      </Text>
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
                    <Pressable
                      onPress={() => onManageBusiness(b.id)}
                      className="flex-row items-center"
                    >
                      <Text className="text-primary text-xs font-black uppercase tracking-wider">
                        Manage
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={THEME.colors.primary}
                        style={{ marginLeft: 6 }}
                      />
                    </Pressable>
                  </View>
                </GlassCard>
              </AnimatedSection>
            ))}

            <AnimatedSection
              delay={businesses?.length ? businesses.length * 100 : 100}
              direction="up"
            >
              <Pressable
                onPress={onAddBusiness}
                className="border border-dashed border-border rounded-luxury p-8 items-center justify-center bg-input/40 active:bg-input"
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
          </View>
        </ScrollView>
      </SafeAreaView>
    </PremiumBackground>
  );
}
