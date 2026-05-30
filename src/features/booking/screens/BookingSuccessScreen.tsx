import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { THEME } from '@/constants/theme';

export default function BookingSuccessScreen() {
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.colors : THEME.colors;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.centerBox}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={88} color={THEME.colors.text} />
        </View>

        <Text style={[styles.titleText, { color: theme.text }]}>Booking Confirmed!</Text>
        <Text style={[styles.descText, { color: theme.textSecondary }]}>
          Your slot reservation has been successfully registered. The businesss owner has been
          notified.
        </Text>
      </View>

      <View style={styles.footerBox}>
        <Button
          variant="primary"
          onPress={() => router.replace('/(customer)/bookings')}
          style={styles.btn}
        >
          View My Bookings
        </Button>
        <Button variant="ghost" onPress={() => router.replace('/(customer)')} style={styles.btn}>
          Back to Home
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    marginBottom: 24,
    shadowColor: THEME.colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  descText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  footerBox: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  btn: {},
});
