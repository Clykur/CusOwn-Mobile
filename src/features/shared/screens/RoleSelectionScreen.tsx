import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';

import CustomerIcon from '../../../../assets/Customer.svg';
import BusinessIcon from '../../../../assets/Business.svg';

import { useOnboardingStore, UserRole } from '@/store/onboarding.store';
import { useActiveRoleStore } from '@/store/active-role.store';
import { useAuth } from '@/hooks/useAuth';

import { THEME } from '@/theme/theme';
import { AnimatedSection } from '@/components/animations/AnimatedSection';

const RoleItem = ({
  selected,
  onPress,
  title,
  description,
  type,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  description: string;
  type: 'customer' | 'business';
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            paddingVertical: 26,
            borderBottomWidth: 1,
            opacity: selected ? 1 : 0.55,
          },
        ]}
      >
        <View className="flex-row items-center">
          {/* Icon */}
          <View className="w-22 items-center justify-center mr-4.5">
            {type === 'customer' ? (
              <CustomerIcon width={72} height={72} color={THEME.colors.primary} />
            ) : (
              <BusinessIcon width={72} height={72} color={THEME.colors.primary} />
            )}
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text className="text-2xl font-black text-primary mb-2 tracking-tighter">{title}</Text>

            <Text className="text-base leading-6 text-textSecondary">{description}</Text>
          </View>

          {/* Active */}
          {selected && <View className="w-2.5 h-2.5 rounded-full bg-primary ml-2.5" />}
        </View>
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
      <View className="flex-1 px-7 pt-24 pb-14">
        {/* Header */}
        <View className="mb-14">
          <Text className="text-4xl font-black text-primary leading-12 tracking-tighter mb-3.5">
            Choose Your{'\n'}Experience
          </Text>

          <Text
            className="text-base leading-7 text-textSecondary"
            style={{
              maxWidth: '90%',
            }}
          >
            Pick your role to get started
          </Text>
        </View>

        {/* Options */}
        <View className="flex-1">
          <RoleItem
            type="customer"
            title="Customer"
            description="Book appointments and manage your schedules."
            selected={role === 'Customer'}
            onPress={() => setRole('Customer')}
          />

          <RoleItem
            type="business"
            title="Business"
            description="Manage services, bookings, and operations."
            selected={role === 'Owner'}
            onPress={() => setRole('Owner')}
          />
        </View>

        {/* Footer */}
        <AnimatedSection delay={450} direction="up">
          <View>
            <PremiumButton
              title="Continue with Google"
              onPress={handleContinue}
              disabled={!role || loading}
              loading={loading}
              className="w-full"
            />

            <View className="items-center mt-5">
              <Text
                className="text-xs tracking-wide text-textSecondary"
                style={{
                  textTransform: 'uppercase',
                }}
              >
                Secure Authentication
              </Text>
            </View>
          </View>
        </AnimatedSection>
      </View>
    </PremiumBackground>
  );
}
