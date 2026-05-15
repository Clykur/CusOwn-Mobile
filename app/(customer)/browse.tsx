import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSalons } from '@/hooks/useSalons';
import { useBookingStore } from '@/store/booking.store';
import { Salon } from '@/types/salon.types';
import { Card } from '@/components/Card';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Avatar } from '@/components/Avatar';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = ['All', 'Haircut', 'Coloring', 'Spa', 'Nails', 'Facial'];

export default function CustomerBrowseScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { data: salons, isLoading, isError, refetch } = useSalons();
  const { setSalon } = useBookingStore();
  
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.dark : THEME.light;

  const filteredSalons = useMemo(() => {
    if (!salons) return [];
    return salons.filter((salon: Salon) => {
      const matchesSearch =
        salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Since categories aren't fully exposed on basic model, map via search or simple pass
      const matchesCategory =
        selectedCategory === 'All' ||
        salon.name.toLowerCase().includes(selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [salons, searchQuery, selectedCategory]);

  const handleSalonPress = (salon: Salon) => {
    setSalon(salon);
    router.push('/booking/select-service');
  };

  const renderCategoryChip = ({ item }: { item: string }) => {
    const isActive = selectedCategory === item;
    return (
      <TouchableOpacity
        style={[
          styles.chip,
          { backgroundColor: theme.card, borderColor: theme.border },
          isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
        ]}
        onPress={() => setSelectedCategory(item)}
      >
        <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : theme.textSecondary }]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSalonCard = ({ item }: { item: Salon }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={() => handleSalonPress(item)}>
      <Card style={[styles.salonCard, { backgroundColor: theme.card }]}>
        <Avatar url={item.images?.[0]} name={item.name} size={80} style={styles.salonImg} />
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
            <Text style={[styles.openBadge, { color: theme.primary }]}>• Open Now</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.gray} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search salons, locations..."
            placeholderTextColor={theme.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.gray} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.categoriesWrapper}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryChip}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        />
      </View>

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <LoadingSkeleton height={110} borderRadius={12} style={{ marginBottom: 12 }} />
          <LoadingSkeleton height={110} borderRadius={12} style={{ marginBottom: 12 }} />
          <LoadingSkeleton height={110} borderRadius={12} />
        </View>
      ) : isError ? (
        <View style={[styles.errorBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.errorMsg, { color: theme.error }]}>Failed to query live salons</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredSalons}
          renderItem={renderSalonCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={theme.gray} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Salons Found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Try adjusting your search filters or queries
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoriesWrapper: {
    marginBottom: 12,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
    height: 44,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  errorBox: {
    marginHorizontal: 20,
    marginTop: 20,
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
    paddingTop: 8,
    paddingBottom: 24,
  },
  salonCard: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    gap: 14,
  },
  salonImg: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  salonInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '700',
  },
  salonAddress: {
    fontSize: 13,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  openBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
