import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/animations/AnimatedSection';

import { useOnboardingStore, UserRole } from '@/store/onboarding.store';

import { useAuth } from '@/hooks/useAuth';
import { useActiveRoleStore } from '@/store/active-role.store';

import {
  responsiveFontSize,
  horizontalScale,
  verticalScale,
  moderateScale,
} from '@/utils/responsive';

import { THEME } from '@/theme/theme';

const RoleOption = ({
  title,
  icon,
  selected,
  onPress,
  description,
  points,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  description: string;
  points: string[];
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
      style={{
        marginBottom: verticalScale(14),
      }}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            backgroundColor: selected ? '#F8FAFC' : THEME.colors.text,
            borderWidth: 1.5,
            borderColor: selected ? THEME.colors.background : '#E2E8F0',
            borderRadius: moderateScale(28),
            padding: moderateScale(18),
          },
        ]}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: verticalScale(10),
          }}
        >
          <View
            style={{
              width: moderateScale(42),
              height: moderateScale(42),
              borderRadius: moderateScale(16),
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: horizontalScale(12),
            }}
          >
            <Ionicons
              name={icon}
              size={moderateScale(22)}
              color={selected ? THEME.colors.background : THEME.colors.textSecondary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: responsiveFontSize(21),
                fontWeight: '900',
                color: THEME.colors.background,
              }}
            >
              {title}
            </Text>

            <Text
              style={{
                fontSize: responsiveFontSize(13),
                color: THEME.colors.textSecondary,
                marginTop: verticalScale(3),
                lineHeight: responsiveFontSize(20),
              }}
            >
              {description}
            </Text>
          </View>

          {selected && (
            <View
              style={{
                width: moderateScale(26),
                height: moderateScale(26),
                borderRadius: 999,
                backgroundColor: THEME.colors.background,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="checkmark" size={moderateScale(16)} color={THEME.colors.text} />
            </View>
          )}
        </View>

        {/* Points */}
        <View style={{ marginTop: verticalScale(4) }}>
          {points.map((point, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: verticalScale(6),
              }}
            >
              <View
                style={{
                  width: moderateScale(6),
                  height: moderateScale(6),
                  borderRadius: 999,
                  backgroundColor: THEME.colors.background,
                  marginTop: verticalScale(7),
                  marginRight: horizontalScale(10),
                }}
              />

              <Text
                style={{
                  flex: 1,
                  fontSize: responsiveFontSize(14),
                  color: THEME.colors.border,
                  lineHeight: responsiveFontSize(20),
                }}
              >
                {point}
              </Text>
            </View>
          ))}
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
      <View
        style={{
          flex: 1,
          paddingHorizontal: horizontalScale(24),
          paddingTop: verticalScale(60),
          paddingBottom: verticalScale(120),
        }}
      >
        {/* Main Content */}
        <View style={{ flex: 1 }}>
          {/* Header */}
          <AnimatedSection direction="down">
            <Text
              style={{
                fontSize: responsiveFontSize(10),
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: '#D97706',
                fontWeight: '700',
                marginBottom: verticalScale(8),
              }}
            >
              Choose Your Experience
            </Text>

            <Text
              style={{
                fontSize: responsiveFontSize(30),
                fontWeight: '900',
                color: THEME.colors.background,
                lineHeight: responsiveFontSize(38),
                marginBottom: verticalScale(10),
              }}
            >
              Select Your{'\n'}Premium Access
            </Text>

            <Text
              style={{
                fontSize: responsiveFontSize(14),
                lineHeight: responsiveFontSize(22),
                color: THEME.colors.textSecondary,
                marginBottom: verticalScale(20),
              }}
            >
              Select the experience that best matches your journey on the platform.
            </Text>
          </AnimatedSection>

          {/* Roles */}
          <AnimatedSection direction="up" delay={100}>
            <RoleOption
              title="Customer"
              icon="person-outline"
              selected={role === 'Customer'}
              onPress={() => setRole('Customer')}
              description="For users booking and managing appointments."
              points={[
                'Book appointments seamlessly',
                'Manage schedules and experiences',
                'Discover premium services',
              ]}
            />

            <RoleOption
              title="Business"
              icon="briefcase-outline"
              selected={role === 'Owner'}
              onPress={() => setRole('Owner')}
              description="For businesses managing operations and growth."
              points={[
                'Manage bookings and customers',
                'Track schedules and operations',
                'Scale your business efficiently',
              ]}
            />
          </AnimatedSection>
        </View>

        {/* Footer */}
        <AnimatedSection delay={200} direction="up">
          <View
            style={{
              paddingTop: verticalScale(12),
            }}
          >
            <PremiumButton
              title="Continue with Google"
              onPress={handleContinue}
              disabled={!role || loading}
              loading={loading}
              className="w-full"
            />

            <Text
              style={{
                textAlign: 'center',
                fontSize: responsiveFontSize(9),
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: THEME.colors.textSecondary,
                marginTop: verticalScale(10),
              }}
            >
              Secure Authentication Powered By Google
            </Text>
          </View>
        </AnimatedSection>
      </View>
    </PremiumBackground>
  );
}
