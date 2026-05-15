import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { STRINGS } from '@/constants/strings';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const { signInWithGoogle, loading } = useAuth();
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';

  const gradientColors = isDark
    ? (['#0B0F19', '#1E293B'] as const)
    : (['#E0F2FE', '#F8FAFC'] as const);

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="cut" size={48} color="#FFFFFF" />
          </View>
          <Text style={[styles.appName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {STRINGS.APP_NAME}
          </Text>
          <Text style={[styles.tagline, { color: isDark ? '#94A3B8' : '#475569' }]}>
            {STRINGS.TAGLINE}
          </Text>
        </View>

        <View style={styles.bodyContainer}>
          <Text style={[styles.welcomeTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {STRINGS.WELCOME_TITLE}
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {STRINGS.WELCOME_SUBTITLE}
          </Text>
        </View>

        <View style={styles.footerContainer}>
          <Button
            variant="secondary"
            loading={loading}
            onPress={signInWithGoogle}
            style={styles.googleBtn}
          >
            <View style={styles.row}>
              <Ionicons name="logo-google" size={20} color="#FFFFFF" style={styles.btnIcon} />
              <Text style={styles.btnTextLight}>{STRINGS.CONTINUE_GOOGLE}</Text>
            </View>
          </Button>

          <Button
            variant="primary"
            disabled={loading}
            onPress={() => router.push(ROUTES.LOGIN as any)}
            style={styles.emailBtn}
          >
            {STRINGS.LOGIN_EMAIL}
          </Button>

          <Button
            variant="ghost"
            disabled={loading}
            onPress={() => router.push(ROUTES.REGISTER as any)}
            style={styles.registerBtn}
          >
            {STRINGS.CREATE_ACCOUNT}
          </Button>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bodyContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  footerContainer: {
    marginBottom: 32,
    gap: 12,
  },
  googleBtn: {
    marginBottom: 4,
  },
  emailBtn: {
    marginBottom: 4,
  },
  registerBtn: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 8,
  },
  btnTextLight: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
