import { THEME } from '@/theme/theme';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import * as Location from 'expo-location';
import { apiService } from '@/services/api.service';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Business, BusinessCategory } from '@/types/business.types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface EditBusinessFormProps {
  business: Business;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SLOT_DURATIONS = ['15', '30', '45', '60'];

const inputClass =
  'bg-input border border-border rounded-2xl px-4 py-4 text-text text-sm font-semibold';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View className="mb-5">
    <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-2">
      {label}
    </Text>
    {children}
  </View>
);

export const EditBusinessForm: React.FC<EditBusinessFormProps> = ({
  business,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);

  const [formData, setFormData] = useState({
    salon_name: business.salon_name,
    owner_name: business.owner_name,
    whatsapp_number: business.whatsapp_number,
    category: business.category || 'salon',
    opening_time: business.opening_time.substring(0, 5),
    closing_time: business.closing_time.substring(0, 5),
    slot_duration: String(business.slot_duration),
    concurrent_booking_capacity: String(business.concurrent_booking_capacity || 1),
    address: business.address || '',
    city: business.city || '',
    location: business.location || '',
    area: business.area || '',
    pincode: business.pincode || '',
    latitude: business.latitude || 0,
    longitude: business.longitude || 0,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await apiService.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([{ value: 'salon', label: 'Salon' }]);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError(null);
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
          location: addr.city || prev.location,
          address: `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}`.trim(),
        }));
      }
    } catch (err) {
      Alert.alert('Error', 'Could not get location.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        concurrent_booking_capacity: parseInt(formData.concurrent_booking_capacity, 10) || 1,
        opening_time:
          formData.opening_time.length === 5
            ? `${formData.opening_time}:00`
            : formData.opening_time,
        closing_time:
          formData.closing_time.length === 5
            ? `${formData.closing_time}:00`
            : formData.closing_time,
      };
      await apiService.updateBusiness(business.id, payload);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update business.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="space-y-2 px-1">
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
      <Field label="Business Name">
        <TextInput
          className={inputClass}
          placeholder="Enter business name"
          placeholderTextColor={THEME.colors.textSecondary}
          value={formData.salon_name}
          onChangeText={(val) => handleChange('salon_name', val)}
          style={{ color: THEME.colors.text }}
        />
      </Field>

      {/* WhatsApp */}
      <Field label="WhatsApp Number">
        <TextInput
          className={inputClass}
          placeholder="Enter WhatsApp number"
          placeholderTextColor={THEME.colors.textSecondary}
          value={formData.whatsapp_number}
          onChangeText={(val) => handleChange('whatsapp_number', val.replace(/\D/g, ''))}
          keyboardType="phone-pad"
          style={{ color: THEME.colors.text }}
        />
      </Field>

      {/* Hours */}
      <View className="flex-row gap-4 mb-5">
        <View className="flex-1">
          <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-2">
            Open Time
          </Text>
          <TextInput
            className={inputClass}
            placeholder="09:00"
            placeholderTextColor={THEME.colors.textSecondary}
            value={formData.opening_time}
            onChangeText={(val) => handleChange('opening_time', val)}
            style={{ color: THEME.colors.text }}
          />
        </View>
        <View className="flex-1">
          <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-2">
            Close Time
          </Text>
          <TextInput
            className={inputClass}
            placeholder="21:00"
            placeholderTextColor={THEME.colors.textSecondary}
            value={formData.closing_time}
            onChangeText={(val) => handleChange('closing_time', val)}
            style={{ color: THEME.colors.text }}
          />
        </View>
      </View>

      {/* Slot Duration Chips */}
      <View className="mb-5">
        <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-3">
          Slot Duration
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

      {/* Location */}
      <View className="mb-5">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px]">
            Location
          </Text>
          <Pressable onPress={handleUseLocation} className="flex-row items-center gap-x-1">
            <Ionicons name="locate-outline" size={14} color={THEME.colors.primary} />
            <Text className="text-primary text-sm font-semibold">Use Current Location</Text>
          </Pressable>
        </View>

        <TextInput
          className={`${inputClass} mb-3`}
          placeholder="Address"
          placeholderTextColor={THEME.colors.textSecondary}
          value={formData.address}
          onChangeText={(val) => handleChange('address', val)}
          multiline
          style={{ color: THEME.colors.text }}
        />

        <View className="flex-row gap-3">
          <TextInput
            className={`flex-1 ${inputClass}`}
            placeholder="City"
            placeholderTextColor={THEME.colors.textSecondary}
            value={formData.city}
            onChangeText={(val) => handleChange('city', val)}
            style={{ color: THEME.colors.text }}
          />
          <TextInput
            className={`flex-1 ${inputClass}`}
            placeholder="Locality"
            placeholderTextColor={THEME.colors.textSecondary}
            value={formData.location}
            onChangeText={(val) => handleChange('location', val)}
            style={{ color: THEME.colors.text }}
          />
        </View>
      </View>

      {/* Actions */}
      <View className="gap-y-3 pt-4 pb-2">
        <PremiumButton title="Save Changes" onPress={handleSubmit} loading={loading} />

        <Pressable
          onPress={onCancel || (() => router.back())}
          className="mt-6 flex-col items-center"
        >
          <Text className="text-white text-lg">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
};
