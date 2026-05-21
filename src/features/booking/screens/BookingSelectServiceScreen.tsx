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
import { useBookingStore } from '@/store/booking.store';
import { useBusinessDetail } from '@/hooks/useBusinesses';
import { Service } from '@/types/business.types';
import { Card } from '@/components/ui/Card';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SelectServiceScreen() {
  const { selectedBusiness, setService } = useBookingStore();
  const {
    data: businessDetail,
    isLoading,
    isError,
  } = useBusinessDetail(selectedBusiness?.id || '');

  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.colors : THEME.colors;

  if (!selectedBusiness) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorMsg, { color: theme.text }]}>No business selected.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const services = businessDetail?.services || selectedBusiness.services || [];

  const handleServicePress = (service: Service) => {
    setService(service);
    router.push('/booking/select-slot');
  };

  const renderServiceCard = ({ item }: { item: Service }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={() => handleServicePress(item)}>
      <Card style={[styles.serviceCard, { backgroundColor: theme.card }]}>
        <View style={styles.cardInfo}>
          <Text style={[styles.serviceName, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={[styles.serviceDesc, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.durationText, { color: theme.textSecondary }]}>
              {item.duration} minutes
            </Text>
          </View>
        </View>
        <View style={styles.priceCol}>
          <Text style={[styles.priceText, { color: theme.primary }]}>${item.price.toFixed(2)}</Text>
          <View
            style={[
              styles.selectBtn,
              { backgroundColor: isDark ? THEME.colors.border : '#EFF6FF' },
            ]}
          >
            <Text style={[styles.selectBtnText, { color: theme.primary }]}>Select</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {selectedBusiness.salon_name}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.stepIndicator}>
          <Text style={[styles.stepText, { color: theme.primary }]}>
            Step 1 of 3: Choose Service
          </Text>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
            Select the treatment or grooming session you wish to book today.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.skeletonList}>
            <LoadingSkeleton height={100} borderRadius={12} style={{ marginBottom: 12 }} />
            <LoadingSkeleton height={100} borderRadius={12} style={{ marginBottom: 12 }} />
            <LoadingSkeleton height={100} borderRadius={12} />
          </View>
        ) : isError ? (
          <View style={[styles.errorBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.errorText, { color: theme.error }]}>
              Failed to load salon catalog
            </Text>
          </View>
        ) : (
          <FlatList
            data={services}
            renderItem={renderServiceCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No services available for this location.
                </Text>
              </View>
            }
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMsg: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  content: {
    flex: 1,
  },
  stepIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
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
  errorText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
  },
  selectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
