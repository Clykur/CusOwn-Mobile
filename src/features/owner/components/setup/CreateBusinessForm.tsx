import { THEME } from '@/theme/theme';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { apiService } from '@/services/api.service';
import { useAuthStore } from '@/store/auth.store';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { ServiceRow } from './ServiceRow';
import { BusinessCategory } from '@/types/business.types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface ServiceDraftRow {
  name: string;
  duration_minutes: number;
  price_inr: number;
}

interface CreateBusinessFormProps {
  onSuccess?: (data: any) => void;
  loading?: boolean;
}

const SLOT_DURATIONS = ['15', '30', '45', '60'];

/* ─── Reusable styled input ─────────────────────────────────────────────── */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View className="mb-5">
    <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-2">
      {label}
    </Text>
    {children}
  </View>
);

const inputClass =
  'bg-input border border-border rounded-2xl px-4 py-4 text-text text-sm font-semibold';

/* ─── Section heading divider ────────────────────────────────────────────── */
const SectionHeading = ({ title }: { title: string }) => (
  <View className="mb-4 border-b border-border pb-2">
    <Text className="text-text text-sm font-black uppercase tracking-wider">{title}</Text>
  </View>
);

export const CreateBusinessForm: React.FC<CreateBusinessFormProps> = ({
  onSuccess,
  loading: externalLoading,
}) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(false);

  const [formData, setFormData] = useState({
    salon_name: '',
    owner_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
    whatsapp_number: '',
    category: 'salon',
    opening_time: '10:00',
    closing_time: '21:00',
    slot_duration: '30',
    concurrent_booking_capacity: '1',
    address: '',
    city: '',
    location: '',
    area: '',
    pincode: '',
    latitude: 0,
    longitude: 0,
  });

  const [serviceRows, setServiceRows] = useState<ServiceDraftRow[]>([
    { name: '', duration_minutes: 30, price_inr: 0 },
  ]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setFetchingCategories(true);
    try {
      const cats = await apiService.getCategories();
      setCategories(cats.filter((cat) => cat.value === 'salon'));
      if (cats.length > 0 && !formData.category) {
        setFormData((prev) => ({ ...prev, category: cats[0].value }));
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([{ value: 'salon', label: 'Salon' }]);
    } finally {
      setFetchingCategories(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleAddService = () => {
    setServiceRows((prev) => [...prev, { name: '', duration_minutes: 30, price_inr: 0 }]);
  };

  const handleRemoveService = (index: number) => {
    setServiceRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleServiceChange = (
    index: number,
    key: keyof ServiceDraftRow,
    value: string | number,
  ) => {
    setServiceRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const handleUseLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to use this feature.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
          city: addr.city || prev.city,
          area: addr.district || addr.subregion || prev.area,
          address: `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}`.trim(),
          location: addr.city || '',
          pincode: addr.postalCode || prev.pincode,
        }));
      } else {
        setFormData((prev) => ({ ...prev, latitude, longitude }));
      }
    } catch (err) {
      console.error('Location error:', err);
      Alert.alert('Error', 'Could not get your location.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (formData.salon_name.length < 2) return 'Business name must be at least 2 characters.';
    if (formData.owner_name.length < 2) return 'Owner name is required.';
    if (formData.whatsapp_number.length < 10) return 'Valid 10-digit WhatsApp number is required.';
    if (formData.address.length < 5) return 'Address is required.';
    if (!formData.city) return 'City is required.';
    if (!formData.location) return 'Location/Area is required.';
    if (formData.opening_time >= formData.closing_time)
      return 'Closing time must be after opening time.';
    return null;
  };

  const handleSubmit = async () => {
    const valError = validateForm();
    if (valError) {
      setError(valError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const servicesPayload = serviceRows
        .filter((s) => s.name.trim().length > 0)
        .map((s) => ({
          name: s.name.trim(),
          duration_minutes: s.duration_minutes,
          price_cents: Math.round(s.price_inr * 100),
        }));

      const payload = {
        ...formData,
        booking_link:
          formData.salon_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
          '-' +
          Math.random().toString(36).substring(2, 8),
        concurrent_booking_capacity: parseInt(formData.concurrent_booking_capacity, 10) || 1,
        opening_time:
          formData.opening_time.length === 5
            ? `${formData.opening_time}:00`
            : formData.opening_time,
        closing_time:
          formData.closing_time.length === 5
            ? `${formData.closing_time}:00`
            : formData.closing_time,
        services: servicesPayload.length > 0 ? servicesPayload : undefined,
      };

      const result = await apiService.createBusiness(payload);

      router.replace('/(owner)');

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      console.error('Business creation failed:', err);
      setError(err.message || 'Failed to create business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const combinedLoading = loading || externalLoading;

  const setSelectedCategory = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  return (
    <View className="space-y-2">
      {/* Error Banner */}
      {error && (
        <View className="bg-error/10 border border-error/30 rounded-2xl p-4 mb-2 flex-row items-start gap-x-2">
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={THEME.colors.error}
            style={{ marginTop: 1 }}
          />
          <Text className="text-error text-sm font-medium flex-1">{error}</Text>
        </View>
      )}

      {/* Business Name */}
      <Field label="Business Name *">
        <TextInput
          className={inputClass}
          placeholder="The Signature Salon"
          placeholderTextColor={THEME.colors.textSecondary}
          value={formData.salon_name}
          onChangeText={(val) => handleChange('salon_name', val)}
          style={{ color: THEME.colors.text }}
        />
      </Field>

      {/* Owner Name */}
      <Field label="Owner Name *">
        <TextInput
          className={inputClass}
          placeholder="John Doe"
          placeholderTextColor={THEME.colors.textSecondary}
          value={formData.owner_name}
          onChangeText={(val) => handleChange('owner_name', val)}
          style={{ color: THEME.colors.text }}
        />
      </Field>

      {/* WhatsApp */}
      <Field label="WhatsApp Number *">
        <TextInput
          className={inputClass}
          placeholder="10-digit number"
          placeholderTextColor={THEME.colors.textSecondary}
          value={formData.whatsapp_number}
          onChangeText={(val) =>
            handleChange('whatsapp_number', val.replace(/\D/g, '').slice(0, 10))
          }
          keyboardType="phone-pad"
          maxLength={10}
          style={{ color: THEME.colors.text }}
        />
      </Field>

      {/* Category */}
      <Field label="Business Type *">
        {fetchingCategories ? (
          <ActivityIndicator color={THEME.colors.primary} />
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = formData.category === cat.value;
              return (
                <Pressable
                  key={cat.value}
                  onPress={() => setSelectedCategory(cat.value)}
                  className={`px-5 py-3 rounded-full border ${
                    isSelected ? 'bg-primary border-primary' : 'bg-input border-border'
                  }`}
                >
                  <Text
                    className={`font-black text-xs uppercase tracking-wider ${
                      isSelected ? 'text-background' : 'text-textSecondary'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Field>

      {/* ── Operational Details ── */}
      <View className="mb-2">
        <SectionHeading title="Operational Details" />

        {/* Hours */}
        <View className="flex-row gap-4 mb-5">
          <View className="flex-1">
            <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-2">
              Open Time
            </Text>
            <TextInput
              className={inputClass}
              value={formData.opening_time}
              onChangeText={(val) => handleChange('opening_time', val)}
              placeholder="10:00"
              placeholderTextColor={THEME.colors.textSecondary}
              style={{ color: THEME.colors.text }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-2">
              Close Time
            </Text>
            <TextInput
              className={inputClass}
              value={formData.closing_time}
              onChangeText={(val) => handleChange('closing_time', val)}
              placeholder="21:00"
              placeholderTextColor={THEME.colors.textSecondary}
              style={{ color: THEME.colors.text }}
            />
          </View>
        </View>

        {/* Slot Duration Chips */}
        <View className="mb-5">
          <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-3">
            Slot Duration *
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SLOT_DURATIONS.map((dur) => (
              <Pressable
                key={dur}
                onPress={() => handleChange('slot_duration', dur)}
                className={`px-5 py-3 rounded-full border ${
                  formData.slot_duration === dur
                    ? 'bg-primary border-primary'
                    : 'bg-input border-border'
                }`}
              >
                <Text
                  className={`font-black text-xs uppercase tracking-wider ${
                    formData.slot_duration === dur ? 'text-background' : 'text-textSecondary'
                  }`}
                >
                  {dur} min
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Concurrent Bookings */}
        <Field label="Concurrent Bookings">
          <TextInput
            className={inputClass}
            placeholder="1"
            placeholderTextColor={THEME.colors.textSecondary}
            value={formData.concurrent_booking_capacity}
            onChangeText={(val) => handleChange('concurrent_booking_capacity', val)}
            keyboardType="number-pad"
            style={{ color: THEME.colors.text }}
          />
        </Field>
      </View>

      {/* ── Services ── */}
      <View className="mb-2">
        <View className="flex-row justify-between items-center border-b border-border pb-2 mb-4">
          <Text className="text-text text-sm font-black uppercase tracking-wider">Services</Text>
          <Pressable
            onPress={handleAddService}
            className="bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 active:bg-primary/20"
          >
            <Text className="text-primary text-xs font-black uppercase tracking-[2px]">
              + Add Service
            </Text>
          </Pressable>
        </View>

        {serviceRows.map((row, index) => (
          <ServiceRow
            key={index}
            index={index}
            name={row.name}
            duration={row.duration_minutes}
            price={row.price_inr}
            onNameChange={(val) => handleServiceChange(index, 'name', val)}
            onDurationChange={(val) =>
              handleServiceChange(index, 'duration_minutes', parseInt(val, 10) || 0)
            }
            onPriceChange={(val) => handleServiceChange(index, 'price_inr', parseFloat(val) || 0)}
            onRemove={() => handleRemoveService(index)}
            showRemove={serviceRows.length > 1}
          />
        ))}
      </View>

      {/* ── Location Details ── */}
      <View className="mb-2">
        <View className="flex-row justify-between items-center border-b border-border pb-2 mb-4">
          <Text className="text-text text-sm font-black uppercase tracking-wider">
            Location Details
          </Text>
          <Pressable
            onPress={handleUseLocation}
            disabled={loading}
            className="flex-row items-center gap-x-1"
          >
            <Ionicons name="locate-outline" size={14} color={THEME.colors.primary} />
            <Text className="text-primary text-sm font-semibold">Use My Location</Text>
          </Pressable>
        </View>

        <Field label="Address *">
          <TextInput
            className={inputClass}
            placeholder="Street address, building"
            placeholderTextColor={THEME.colors.textSecondary}
            value={formData.address}
            onChangeText={(val) => handleChange('address', val)}
            multiline
            style={{ color: THEME.colors.text }}
          />
        </Field>

        <View className="flex-row gap-4 mb-5">
          <View className="flex-1">
            <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-2">
              City *
            </Text>
            <TextInput
              className={inputClass}
              placeholder="City"
              placeholderTextColor={THEME.colors.textSecondary}
              value={formData.city}
              onChangeText={(val) => handleChange('city', val)}
              style={{ color: THEME.colors.text }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-2">
              Locality *
            </Text>
            <TextInput
              className={inputClass}
              placeholder="Locality"
              placeholderTextColor={THEME.colors.textSecondary}
              value={formData.location}
              onChangeText={(val) => handleChange('location', val)}
              style={{ color: THEME.colors.text }}
            />
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-2">
              Sub-Area
            </Text>
            <TextInput
              className={inputClass}
              placeholder="Optional"
              placeholderTextColor={THEME.colors.textSecondary}
              value={formData.area}
              onChangeText={(val) => handleChange('area', val)}
              style={{ color: THEME.colors.text }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-2">
              Pincode
            </Text>
            <TextInput
              className={inputClass}
              placeholder="Optional"
              placeholderTextColor={THEME.colors.textSecondary}
              value={formData.pincode}
              onChangeText={(val) => handleChange('pincode', val)}
              keyboardType="number-pad"
              style={{ color: THEME.colors.text }}
            />
          </View>
        </View>
      </View>

      <PremiumButton
        title="Create Business"
        onPress={handleSubmit}
        loading={combinedLoading}
        disabled={combinedLoading}
        className="mt-6"
      />
      <Pressable onPress={() => router.back()} className="mt-6 flex-col items-center">
        <Text className="text-white text-lg">Cancel</Text>
      </Pressable>
    </View>
  );
};
