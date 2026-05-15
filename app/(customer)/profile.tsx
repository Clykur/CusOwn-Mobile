import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  useColorScheme,
  Alert,
  Platform,
} from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { THEME } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerProfileScreen() {
  const { user } = useAuthStore();
  const { signOut, loading } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.dark : THEME.light;

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerSection}>
        <Avatar
          name={user?.user_metadata?.full_name || 'User'}
          size={88}
          style={styles.avatar}
        />
        <Text style={[styles.userName, { color: theme.text }]}>
          {user?.user_metadata?.full_name || 'Valued Client'}
        </Text>
        <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
          {user?.email || 'client@cusown.com'}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <Card style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statNum, { color: theme.primary }]}>12</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Visits</Text>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statNum, { color: theme.secondary }]}>3</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Saved Salons</Text>
        </Card>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Account Settings</Text>

        <Card style={[styles.settingsCard, { backgroundColor: theme.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={20} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : notificationsEnabled ? theme.primary : '#F8FAFC'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>Data Privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gray} />
          </View>
        </Card>
      </View>

      <View style={styles.footerSection}>
        <Button
          variant="danger"
          loading={loading}
          onPress={handleSignOut}
          style={styles.signOutBtn}
        >
          {STRINGS.LOGOUT}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 0,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginLeft: 48,
  },
  footerSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  signOutBtn: {},
});
