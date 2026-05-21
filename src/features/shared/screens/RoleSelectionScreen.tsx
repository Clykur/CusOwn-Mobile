import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { GlassCard } from '@/components/ui/GlassCard';

import { useOnboardingStore, UserRole } from '@/store/onboarding.store';
import { useActiveRoleStore } from '@/store/active-role.store';
import { useAuth } from '@/hooks/useAuth';

import { THEME } from '@/theme/theme';

const RoleOption = ({
  title,
  icon,
  selected,
  onPress,
  description,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  description: string;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.98);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={onPress}
      className="mb-4"
    >
      <Animated.View style={animatedStyle}>
        <GlassCard
          className={`rounded-[28px] border p-2 ${selected ? 'border-primary' : 'border-border'}`}
        >
          <View className="flex-row items-center">
            {/* Icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 18,
              }}
            >
              <Ionicons
                name={icon}
                size={28}
                color={selected ? THEME.colors.text : THEME.colors.textSecondary}
              />
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '900',
                  color: THEME.colors.primary,
                  marginBottom: 6,
                }}
              >
                {title}
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 24,
                  color: THEME.colors.textSecondary,
                }}
              >
                {description}
              </Text>
            </View>

            {/* Check */}
            {selected && (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  backgroundColor: THEME.colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="checkmark" size={18} color={THEME.colors.text} />
              </View>
            )}
          </View>
        </GlassCard>
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
      <View className="flex-1 px-7 pt-24 pb-14 justify-between">
        {/* Header */}
        <AnimatedSection direction="down">
          <View>
            <Text
              className="uppercase font-semibold mb-5"
              style={{
                letterSpacing: 5,
                fontSize: 11,
                color: '#D97706',
              }}
            >
              Choose Your Experience
            </Text>

            <Text
              style={{
                fontSize: 42,
                fontWeight: '800',
                color: THEME.colors.primary,
                lineHeight: 50,
                letterSpacing: -2,
                marginBottom: 8,
              }}
            >
              Select Your{'\n'}Premium Access
            </Text>

            <Text
              style={{
                fontSize: 16,
                lineHeight: 30,
                color: THEME.colors.textSecondary,
                maxWidth: '95%',
              }}
            >
              Select the experience that best matches your journey on the platform.
            </Text>
          </View>
        </AnimatedSection>

        {/* Options */}
        <AnimatedSection delay={300} direction="up">
          <View>
            <RoleOption
              title="Customer"
              icon="person-outline"
              selected={role === 'Customer'}
              onPress={() => setRole('Customer')}
              description="Book appointments, manage schedules, and discover premium services."
            />

            <RoleOption
              title="Business"
              icon="briefcase-outline"
              selected={role === 'Owner'}
              onPress={() => setRole('Owner')}
              description="Manage customers, bookings, schedules, and business growth."
            />
          </View>
        </AnimatedSection>

        {/* Footer */}
        <AnimatedSection delay={500} direction="up">
          <View>
            <PremiumButton
              title="Continue with Google"
              onPress={handleContinue}
              disabled={!role || loading}
              loading={loading}
              className="w-full"
            />

            <View className="items-center mt-4">
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: THEME.colors.textSecondary,
                }}
              >
                Secure Authentication Powered By Google
              </Text>
            </View>
          </View>
        </AnimatedSection>
      </View>
    </PremiumBackground>
  );
}
