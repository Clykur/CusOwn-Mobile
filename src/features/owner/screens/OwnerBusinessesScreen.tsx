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
            <GlassCard className="items-center w-full p-8 rounded-luxury border-slate-200/80">
              <View className="w-20 h-20 rounded-full bg-neutral-100 items-center justify-center mb-6 border border-neutral-200">
                <Ionicons name="alert-circle-outline" size={40} color="#000000" />
              </View>
              <Text className="text-slate-900 text-xl font-bold mb-2">Fetch Error</Text>
              <Text className="text-slate-500 text-center px-12 text-sm font-medium">
                We couldn't retrieve your business portfolio. Please check your connection.
              </Text>
              <Pressable
                onPress={() => refetch()}
                className="mt-8 bg-black px-8 py-3.5 rounded-full active:bg-slate-950"
              >
                <Text className="text-white font-black text-xs uppercase tracking-widest">
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
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor="#000000" />
          }
        >
          <AnimatedSection direction="down" className="mb-8">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-1">
              Management
            </Text>
            <Text className="text-slate-900 text-3xl font-black tracking-tight">Businesses</Text>
          </AnimatedSection>

          <View className="gap-y-4">
            {businesses?.map((b, index) => (
              <AnimatedSection key={b.id} delay={index * 100} direction="up">
                <GlassCard className="p-6 border-slate-200/80 rounded-luxury shadow-sm">
                  <View className="flex-row justify-between items-start mb-6">
                    <View className="flex-1 mr-4">
                      <Text className="text-slate-900 text-xl font-extrabold mb-1">
                        {b.salon_name}
                      </Text>
                      <View className="flex-row items-center opacity-60">
                        <Ionicons name="location-outline" size={12} color="#64748B" />
                        <Text className="text-slate-500 text-xs ml-1" numberOfLines={1}>
                          {b.location || 'No location set'}
                        </Text>
                      </View>
                    </View>
                    <View className="bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
                      <Text className="text-slate-900 text-[9px] font-black uppercase tracking-widest">
                        Active Hub
                      </Text>
                    </View>
                  </View>

                  <View className="h-[0.5px] bg-slate-200/60 w-full mb-6" />

                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">
                        Operational Since
                      </Text>
                      <Text className="text-slate-900 text-xs font-semibold">
                        {new Date(b.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => onManageBusiness(b.id)}
                      className="bg-black px-6 py-3 rounded-full"
                    >
                      <Text className="text-white text-xs font-black uppercase tracking-wider">
                        Manage Hub
                      </Text>
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
                className="border border-dashed border-slate-300 rounded-luxury p-8 items-center justify-center bg-white/40 active:bg-white/60"
              >
                <View className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 items-center justify-center mb-4">
                  <Ionicons name="add" size={24} color="#000000" />
                </View>
                <Text className="text-slate-900 font-black text-xs uppercase tracking-wider">
                  Launch New Business Hub
                </Text>
                <Text className="text-slate-500 text-xs mt-1 font-medium">
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
