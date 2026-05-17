import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Ionicons } from '@expo/vector-icons';

export default function SuccessScreen() {
  return (
    <PremiumBackground>
      <View className="flex-1 items-center justify-center px-luxury">
        <AnimatedSection direction="down" className="items-center">
          <View className="w-24 h-24 rounded-full bg-accent-premium/20 items-center justify-center mb-8 border border-accent-premium/30">
            <Ionicons name="checkmark-done" size={48} color="#FFFFFF" />
          </View>
          <Text className="text-white text-5xl font-bold tracking-tighter text-center mb-6">
            Identity{"\n"}
            <Text className="text-accent-premium">Established.</Text>
          </Text>
          <Text className="text-textLight text-lg text-center leading-relaxed mb-16">
            Your premium business profile has been successfully integrated into the CusOwn network.
          </Text>
        </AnimatedSection>

        <AnimatedSection delay={400} direction="up" className="w-full">
          <PremiumButton 
            title="Enter Dashboard" 
            onPress={() => router.replace('/(owner)/')} 
            className="w-full"
          />
        </AnimatedSection>
      </View>
    </PremiumBackground>
  );
}
