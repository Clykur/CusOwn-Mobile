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
          <View
            style={{
              width: 88,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 18,
            }}
          >
            {type === 'customer' ? (
              <CustomerIcon width={72} height={72} color={THEME.colors.primary} />
            ) : (
              <BusinessIcon width={72} height={72} color={THEME.colors.primary} />
            )}
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '900',
                color: THEME.colors.primary,
                marginBottom: 8,
                letterSpacing: -1,
              }}
            >
              {title}
            </Text>

            <Text
              style={{
                fontSize: 15,
                lineHeight: 26,
                color: THEME.colors.textSecondary,
              }}
            >
              {description}
            </Text>
          </View>

          {/* Active */}
          {selected && (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: THEME.colors.primary,
                marginLeft: 10,
              }}
            />
          )}
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
          <Text
            style={{
              fontSize: 42,
              fontWeight: '900',
              color: THEME.colors.primary,
              lineHeight: 48,
              letterSpacing: -2,
              marginBottom: 14,
            }}
          >
            Choose Your{'\n'}Experience
          </Text>

          <Text
            style={{
              fontSize: 16,
              lineHeight: 30,
              color: THEME.colors.textSecondary,
              maxWidth: '90%',
            }}
          >
            Pick your role to get started
          </Text>
        </View>

        {/* Options */}
        <View style={{ flex: 1 }}>
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
                style={{
                  fontSize: 10,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  color: THEME.colors.textSecondary,
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
