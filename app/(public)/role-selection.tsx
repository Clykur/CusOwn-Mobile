import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

import {
  useOnboardingStore,
  UserRole,
} from '@/store/onboarding.store';

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
      style={{ marginBottom: 20 }}
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
            marginBottom: 18,
          }}
        >
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 20,
              backgroundColor: selected ? '#000000' : '#F1F5F9',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <Ionicons
              name={icon}
              size={28}
              color={selected ? '#FFFFFF' : '#64748B'}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: '#0F172A',
              }}
            >
              {title}
            </Text>

            <Text
              style={{
                fontSize: 15,
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
              <Ionicons
                name="checkmark"
                size={18}
                color="#FFF"
              />
            </View>
          )}
        </View>

        {/* Points */}
        <View style={{ marginTop: 8 }}>
          {points.map((point, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: '#000',
                  marginTop: 8,
                  marginRight: 12,
                }}
              />

              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: '#475569',
                  lineHeight: 26,
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

  const setSelectedRole = useOnboardingStore(
    (state) => state.setSelectedRole
  );

  const setActiveRole = useActiveRoleStore(
    (state) => state.setActiveRole
  );

  const { signInWithGoogle, loading } = useAuth();

  const handleContinue = async () => {
    if (!role) return;

    setSelectedRole(role);
    setActiveRole(role);

    await signInWithGoogle(role);
  };

  return (
    <PremiumBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 28,
          paddingTop: 90,
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
              marginBottom: 18,
            }}
          >
            Choose Your Experience
          </Text>

          <Text
            style={{
              fontSize: 48,
              fontWeight: '900',
              color: '#0F172A',
              lineHeight: 54,
              marginBottom: 14,
            }}
          >
            Select Your{"\n"}Premium Access
          </Text>

          <Text
            style={{
              fontSize: 17,
              lineHeight: 30,
              color: '#64748B',
              marginBottom: 42,
            }}
          >
            Select the experience that best matches
            your journey on the platform.
          </Text>
        </AnimatedSection>

        {/* Roles */}
        <View style={{ marginBottom: 30 }}>
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
      </ScrollView>
    </PremiumBackground>
  );
}