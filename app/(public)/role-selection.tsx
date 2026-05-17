import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore, UserRole } from '@/store/onboarding.store';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRoleStore } from '@/store/active-role.store';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';

const RoleOption = ({ 
  title, 
  icon, 
  selected, 
  onPress,
  description
}: { 
  title: string, 
  icon: keyof typeof Ionicons.glyphMap, 
  selected: boolean,
  onPress: () => void,
  description: string
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: selected ? '#000000' : '#E2E8F0',
    backgroundColor: selected ? 'rgba(0, 0, 0, 0.04)' : '#FFFFFF'
  }));

  return (
    <Pressable 
      onPressIn={() => scale.value = withSpring(0.98)}
      onPressOut={() => scale.value = withSpring(1)}
      onPress={onPress}
      className="mb-6"
    >
      <Animated.View style={animatedStyle} className="p-6 rounded-3xl border-2 shadow-sm">
        <View className="flex-row items-center mb-2">
          <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${selected ? 'bg-accent-premium/15' : 'bg-slate-100'}`}>
            <Ionicons name={icon} size={28} color={selected ? '#000000' : '#64748B'} />
          </View>
          <Text className={`text-2xl font-bold ${selected ? 'text-slate-900' : 'text-slate-700'}`}>{title}</Text>
          {selected && (
            <View className="ml-auto bg-accent-premium rounded-full p-1">
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          )}
        </View>
        <Text className="text-base leading-relaxed text-slate-500">
          {description}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

export default function RoleSelectionScreen() {
  const [role, setRole] = useState<UserRole | null>(null);
  const setSelectedRole = useOnboardingStore((state) => state.setSelectedRole);
  const setActiveRole = useActiveRoleStore((state) => state.setActiveRole);
  const { signInWithGoogle, loading } = useAuth();

  const handleContinue = async () => {
    if (!role) return;
    setSelectedRole(role);
    setActiveRole(role);
    await signInWithGoogle(role);
  };

  return (
    <PremiumBackground>
      <View className="flex-1 px-luxury pt-24 pb-12">
        <AnimatedSection direction="down">
          <Text className="text-accent-premium text-sm font-bold tracking-[6px] uppercase mb-4">
            Select Your Role
          </Text>
          <Text className="text-slate-900 text-5xl font-bold tracking-tighter leading-[48px] mb-12">
            How will you{"\n"}
            <Text className="text-accent-premium">Experience</Text> CusOwn?
          </Text>
        </AnimatedSection>

        <View className="flex-1">
          <RoleOption 
            title="Customer" 
            icon="star" 
            selected={role === 'Customer'} 
            onPress={() => setRole('Customer')}
            description="Discover and book elite beauty services at the world's most exclusive salons."
          />
          <RoleOption 
            title="Business" 
            icon="diamond" 
            selected={role === 'Owner'} 
            onPress={() => setRole('Owner')}
            description="Elevate your salon operations with premium management and growth tools."
          />
        </View>

        <AnimatedSection delay={200} direction="up" className="mt-auto">
          <PremiumButton 
            title="Continue with Google" 
            onPress={handleContinue} 
            disabled={!role || loading}
            loading={loading}
            className="w-full h-16"
          />
          <Text className="text-slate-400 text-[10px] tracking-[2px] uppercase text-center mt-6">
            Secure Google Authentication Protocol
          </Text>
        </AnimatedSection>
      </View>
    </PremiumBackground>
  );
}