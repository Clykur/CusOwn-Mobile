import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useSalons } from '@/hooks/useSalons';
import { useBookingStore } from '@/store/booking.store';
import { Salon } from '@/types/salon.types';
import { Card } from '@/components/Card';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Avatar } from '@/components/Avatar';
import { THEME } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerHomeScreen() {
  const { user } = useAuthStore();
  const { data: salons, isLoading, isError, refetch } = useSalons();
  const { setSalon } = useBookingStore();
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.dark : THEME.light;

  const handleSalonPress = (salon: Salon) => {
    setSalon(salon);
    router.push('/booking/select-service');
  };

  const renderSalonCard = ({ item }: { item: Salon }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={() => handleSalonPress(item)}>
      <Card style={[styles.salonCard, { backgroundColor: theme.card }]}>
        <Avatar url={item.images?.[0]} name={item.name} size={120} style={styles.salonImg} />
        <View style={styles.salonInfo}>
          <Text style={[styles.salonName, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.salonAddress, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.address}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
              {item.rating?.toFixed(1) || '4.8'}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerBanner}>
        <View>
          <Text style={[styles.greetingText, { color: theme.textSecondary }]}>
            {STRINGS.WELCOME_TITLE}
          </Text>
          <Text style={[styles.userName, { color: theme.text }]}>
            {user?.user_metadata?.full_name || 'Valued Client'}
          </Text>
        </View>
        <Avatar name={user?.user_metadata?.full_name || 'User'} size={44} />
      </View>

      <TouchableOpacity
        style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}
        activeOpacity={0.9}
        onPress={() => router.push('/(customer)/browse')}
      >
        <Ionicons name="search" size={20} color={theme.gray} />
        <Text style={[styles.searchText, { color: theme.gray }]}>Search salons or services...</Text>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured Salons</Text>
        <TouchableOpacity onPress={() => router.push('/(customer)/browse')}>
          <Text style={[styles.seeAllText, { color: theme.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.skeletonList}>
          <LoadingSkeleton height={140} borderRadius={12} style={{ marginBottom: 12 }} />
          <LoadingSkeleton height={140} borderRadius={12} />
        </View>
      ) : isError ? (
        <View style={[styles.errorBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.errorMsg, { color: theme.error }]}>Failed to load featured salons</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={salons?.slice(0, 5)}
          renderItem={renderSalonCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greetingText: {
    fontSize: 14,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  searchText: {
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skeletonList: {
    paddingHorizontal: 20,
  },
  errorBox: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorMsg: {
    fontSize: 14,
    marginBottom: 10,
  },
  retryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  salonCard: {
    width: 260,
    marginBottom: 8,
    padding: 12,
  },
  salonImg: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  salonInfo: {
    gap: 4,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '700',
  },
  salonAddress: {
    fontSize: 12,
    lineHeight: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
