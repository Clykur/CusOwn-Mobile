import React from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
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
            <GlassCard className="items-center w-full p-8 rounded-luxury">
              <View className="w-20 h-20 rounded-full bg-neutral-100 items-center justify-center mb-6">
                <Ionicons name="alert-circle-outline" size={40} color="#000000" className="opacity-60" />
              </View>
              <Text className="text-black text-xl font-bold mb-2">Fetch Error</Text>
              <Text className="text-textLight text-center px-12 text-sm opacity-60 font-medium">
                We couldn't retrieve your business portfolio. Please check your connection.
              </Text>
              <Pressable
                onPress={() => refetch()}
                className="mt-8 bg-black px-8 py-3 rounded-full"
              >
                <Text className="text-white font-bold">Retry</Text>
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
          <View className="px-luxury pt-4">
            <LoadingSkeleton height={100} className="mb-4" />
            <LoadingSkeleton height={100} className="mb-4" />
            <LoadingSkeleton height={100} className="mb-4" />
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
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FFFFFF" />}
        >
          <AnimatedSection direction="down" className="mb-8">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-1">Management</Text>
            <Text className="text-slate-900 text-3xl font-bold tracking-tight">
              Your Businesses.
            </Text>
          </AnimatedSection>

          <View className="gap-y-4">
            {businesses?.map((b, index) => (
              <AnimatedSection key={b.id} delay={index * 100} direction="up">
                <GlassCard className="p-6">
                  <View className="flex-row justify-between items-start mb-6">
                    <View className="flex-1 mr-4">
                      <Text className="text-black text-xl font-bold mb-1">{b.salon_name}</Text>
                      <View className="flex-row items-center opacity-60">
                        <Ionicons name="location-outline" size={12} color="#000000" />
                        <Text className="text-textLight text-xs ml-1" numberOfLines={1}>
                          {b.location || 'No location set'}
                        </Text>
                      </View>
                    </View>
                    <View className="bg-black/10 px-3 py-1 rounded-full border border-black/20">
                      <Text className="text-black text-[9px] font-black uppercase tracking-widest">Active Hub</Text>
                    </View>
                  </View>

                  <View className="h-[1px] bg-white/5 w-full mb-6" />

                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-textLight text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">
                        Operational Since
                      </Text>
                      <Text className="text-black text-xs font-medium">
                        {new Date(b.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => onManageBusiness(b.id)}
                      className="bg-black px-6 py-2.5 rounded-full"
                    >
                      <Text className="text-white text-xs font-bold">Manage Hub</Text>
                    </Pressable>
                  </View>
                </GlassCard>
              </AnimatedSection>
            ))}

            <AnimatedSection delay={businesses?.length ? businesses.length * 100 : 100} direction="up">
              <Pressable
                onPress={onAddBusiness}
                className="border-2 border-dashed border-black/20 rounded-luxury p-8 items-center justify-center bg-black/5"
              >
                <View className="w-12 h-12 rounded-full bg-black/10 items-center justify-center mb-4">
                  <Ionicons name="add" size={24} color="#000000" />
                </View>
                <Text className="text-black font-bold">Launch New Business Hub</Text>
                <Text className="text-textLight text-xs opacity-50 mt-1">Expand your portfolio with a new location</Text>
              </Pressable>
            </AnimatedSection>
          </View>
        </ScrollView>
      </SafeAreaView>
    </PremiumBackground>
  );
}
