import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  FlatList,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { useOwnerServices, useCreateService } from '@/hooks/useOwner';
import { createServiceSchema, CreateServiceFormValues } from '@/schemas/booking.schema';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { BottomSheet } from '@/components/BottomSheet';
import { THEME } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { Ionicons } from '@expo/vector-icons';

export default function OwnerSettingsScreen() {
  const { user } = useAuthStore();
  const { signOut, loading: signoutLoading } = useAuth();
  const { data: services, isLoading: servicesLoading } = useOwnerServices();
  const { mutateAsync: createService, isPending: createPending } = useCreateService();

  const [modalVisible, setModalVisible] = useState(false);

  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.dark : THEME.light;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateServiceFormValues>({
    resolver: zodResolver(createServiceSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      duration: 30,
      price: 50,
    },
  });

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to exit your hub management session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const onSubmitService = async (values: CreateServiceFormValues) => {
    try {
      await createService(values);
      setModalVisible(false);
      reset();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add new service catalog listing.');
    }
  };

  const renderServiceItem = ({ item }: { item: any }) => (
    <View style={[styles.serviceRow, { borderBottomColor: theme.border }]}>
      <View style={styles.serviceItemInfo}>
        <Text style={[styles.serviceItemTitle, { color: theme.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.serviceItemDuration, { color: theme.textSecondary }]}>
          {item.duration} min duration
        </Text>
      </View>
      <Text style={[styles.serviceItemPrice, { color: theme.accent }]}>
        ${item.price?.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.profileBox}>
        <Avatar name={user?.user_metadata?.full_name || 'Hub Owner'} size={80} style={styles.avatar} />
        <Text style={[styles.hubName, { color: theme.text }]}>
          {user?.user_metadata?.full_name || 'Business Hub'}
        </Text>
        <Text style={[styles.ownerBadge, { color: theme.accent }]}>Certified Owner Account</Text>
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>Service Catalog</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
            <Ionicons name="add-circle" size={18} color={theme.accent} />
            <Text style={[styles.addBtnText, { color: theme.accent }]}>Add Service</Text>
          </TouchableOpacity>
        </View>

        <Card style={[styles.servicesCard, { backgroundColor: theme.card }]}>
          {servicesLoading ? (
            <Text style={[styles.placeholderText, { color: theme.gray }]}>Loading available services...</Text>
          ) : !services || services.length === 0 ? (
            <Text style={[styles.placeholderText, { color: theme.gray }]}>No active service catalog items.</Text>
          ) : (
            <FlatList
              data={services}
              renderItem={renderServiceItem}
              keyExtractor={(item, index) => item.id || String(index)}
              scrollEnabled={false}
            />
          )}
        </Card>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>Business Information</Text>
        <Card style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <View style={styles.infoLine}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Contact Email</Text>
            <Text style={[styles.infoVal, { color: theme.text }]}>{user?.email}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoLine}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Payout Config</Text>
            <Text style={[styles.infoValLink, { color: theme.accent }]}>Connected via Stripe</Text>
          </View>
        </Card>
      </View>

      <View style={styles.footerWrap}>
        <Button
          variant="danger"
          loading={signoutLoading}
          onPress={handleSignOut}
          style={styles.logoutBtn}
        >
          {STRINGS.LOGOUT}
        </Button>
      </View>

      <BottomSheet visible={modalVisible} onClose={() => setModalVisible(false)}>
        <Text style={[styles.sheetTitle, { color: theme.text }]}>Add Service Listing</Text>
        <Text style={[styles.sheetDesc, { color: theme.textSecondary }]}>
          Provide base pricing and default durations for your customers to book.
        </Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Service Name"
              placeholder="e.g. Signature Fade & Trim"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Description (Optional)"
              placeholder="Brief summary of treatments applied"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.description?.message}
            />
          )}
        />

        <View style={styles.rowGrid}>
          <View style={styles.col}>
            <Controller
              control={control}
              name="duration"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Duration (min)"
                  placeholder="30"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={String(value)}
                  error={errors.duration?.message}
                />
              )}
            />
          </View>

          <View style={styles.col}>
            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Price ($)"
                  placeholder="45"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={String(value)}
                  error={errors.price?.message}
                />
              )}
            />
          </View>
        </View>

        <Button
          variant="primary"
          loading={createPending}
          onPress={handleSubmit(onSubmitService as any)}
          style={[styles.sheetSubmitBtn, { backgroundColor: theme.accent }]}
        >
          Publish Listing
        </Button>
      </BottomSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    marginBottom: 12,
  },
  hubName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  ownerBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionBlock: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  servicesCard: {
    padding: 0,
    overflow: 'hidden',
  },
  placeholderText: {
    padding: 20,
    textAlign: 'center',
    fontSize: 13,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  serviceItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  serviceItemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  serviceItemDuration: {
    fontSize: 12,
    marginTop: 2,
  },
  serviceItemPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoCard: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  infoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
  footerWrap: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: 12,
  },
  logoutBtn: {},
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  sheetDesc: {
    fontSize: 14,
    marginBottom: 20,
  },
  rowGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  sheetSubmitBtn: {
    marginTop: 12,
  },
});
