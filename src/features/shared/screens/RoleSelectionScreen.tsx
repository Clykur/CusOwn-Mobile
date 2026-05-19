import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/animations/AnimatedSection';

import { useOnboardingStore, UserRole } from '@/store/onboarding.store';

import { useAuth } from '@/hooks/useAuth';
import { useActiveRoleStore } from '@/store/active-role.store';

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
      style={{ marginBottom: 15 }}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            backgroundColor: selected ? '#F8FAFC' : '#FFFFFF',
            borderWidth: 2,
            borderColor: selected ? '#000000' : '#E2E8F0',
            borderRadius: 32,
            padding: 24,
          },
        ]}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 20,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name={icon} size={25} color={selected ? '#000000' : '#64748B'} />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 25,
                fontWeight: '800',
                color: '#0F172A',
              }}
            >
              {title}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: '#64748B',
                marginTop: 4,
                lineHeight: 24,
              }}
            >
              {description}
            </Text>
          </View>

          {selected && (
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                backgroundColor: '#000',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="checkmark" size={20} color="#FFF" />
            </View>
          )}
        </View>

        {/* Points */}
        <View style={{ marginTop: 5 }}>
          {points.map((point, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: 5,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: '#000',
                  marginTop: 6,
                  marginRight: 12,
                }}
              />

              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: '#475569',
                  lineHeight: 20,
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
          paddingHorizontal: 28,
          paddingTop: 80,
          paddingBottom: 40,
          flexGrow: 1,
        }}
      >
        {/* Header */}
        <AnimatedSection direction="down">
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 5,
              textTransform: 'uppercase',
              color: '#D97706',
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            Choose Your Experience
          </Text>

          <Text
            style={{
              fontSize: 38,
              fontWeight: '900',
              color: '#0F172A',
              lineHeight: 50,
              marginBottom: 10,
            }}
          >
            Select Your{'\n'}Premium Access
          </Text>

          <Text
            style={{
              fontSize: 15,
              lineHeight: 24,
              color: '#64748B',
              marginBottom: 22,
            }}
          >
            Select the experience that best matches your journey on the platform.
          </Text>
        </AnimatedSection>

        {/* Roles */}
        <View style={{ marginBottom: 10 }}>
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
        </View>

        {/* Footer */}
        <AnimatedSection delay={200} direction="up">
          <PremiumButton
            title="Continue with Google"
            onPress={handleContinue}
            disabled={!role || loading}
            loading={loading}
            className="w-full h-16"
          />

          <Text
            style={{
              textAlign: 'center',
              fontSize: 10,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: '#94A3B8',
              marginTop: 22,
            }}
          >
            Secure Authentication Powered By Google
          </Text>
        </AnimatedSection>
      </View>
    </PremiumBackground>
  );
}
