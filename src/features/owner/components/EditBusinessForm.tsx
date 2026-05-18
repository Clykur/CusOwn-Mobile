import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { apiService } from '@/services/api.service';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Business, BusinessCategory } from '@/types/business.types';

interface EditBusinessFormProps {
  business: Business;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SLOT_DURATIONS = ['15', '30', '45', '60'];

export const EditBusinessForm: React.FC<EditBusinessFormProps> = ({
  business,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(false);

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
    setFetchingCategories(true);
    try {
      const cats = await apiService.getCategories();
      setCategories(cats);
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
    <ScrollView className="px-1" showsVerticalScrollIndicator={false}>
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
          <Text className="text-red-700 text-sm font-medium">{error}</Text>
        </View>
      )}

      <View className="mb-5">
        <Text className="text-[10px] text-slate-500 font-black uppercase tracking-[2px] mb-2">
          Business Name
        </Text>

        <TextInput
          className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-4 text-slate-900 text-sm font-semibold"
          placeholder="Enter business name"
          placeholderTextColor="#94A3B8"
          value={formData.salon_name}
          onChangeText={(val) => handleChange('salon_name', val)}
        />
      </View>

      <View className="mb-5">
        <Text className="text-[10px] text-slate-500 font-black uppercase tracking-[2px] mb-2">
          WhatsApp Number
        </Text>

        <TextInput
          className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-4 text-slate-900 text-sm font-semibold"
          placeholder="Enter WhatsApp number"
          placeholderTextColor="#94A3B8"
          value={formData.whatsapp_number}
          onChangeText={(val) => handleChange('whatsapp_number', val.replace(/\D/g, ''))}
          keyboardType="phone-pad"
        />
      </View>

      <View className="flex-row gap-4 mb-5">
        <View className="flex-1">
          <Text className="text-[10px] text-slate-500 font-black uppercase tracking-[2px] mb-2">
            Open Time
          </Text>

          <TextInput
            className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-4 text-slate-900 text-sm font-semibold"
            placeholder="09:00"
            placeholderTextColor="#94A3B8"
            value={formData.opening_time}
            onChangeText={(val) => handleChange('opening_time', val)}
          />
        </View>

        <View className="flex-1">
          <Text className="text-[10px] text-slate-500 font-black uppercase tracking-[2px] mb-2">
            Close Time
          </Text>

          <TextInput
            className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-4 text-slate-900 text-sm font-semibold"
            placeholder="21:00"
            placeholderTextColor="#94A3B8"
            value={formData.closing_time}
            onChangeText={(val) => handleChange('closing_time', val)}
          />
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-[10px] text-slate-500 font-black uppercase tracking-[2px] mb-4">
          Slot Duration
        </Text>

        <View className="flex-row flex-wrap gap-2">
          {SLOT_DURATIONS.map((dur) => (
            <TouchableOpacity
              key={dur}
              onPress={() => handleChange('slot_duration', dur)}
              className={`px-5 py-3 rounded-full border ${
                formData.slot_duration === dur
                  ? 'bg-black border-black'
                  : 'bg-white border-slate-200/80'
              }`}
            >
              <Text
                className={`font-black text-xs uppercase tracking-wider ${
                  formData.slot_duration === dur ? 'text-white' : 'text-slate-700'
                }`}
              >
                {dur} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-[10px] text-slate-500 font-black uppercase tracking-[2px]">
            Location
          </Text>

          <TouchableOpacity onPress={handleUseLocation}>
            <Text className="text-black text-[9px] font-black uppercase tracking-[2px]">
              Update From GPS
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-4 text-slate-900 text-sm font-semibold mb-3"
          placeholder="Address"
          placeholderTextColor="#94A3B8"
          value={formData.address}
          onChangeText={(val) => handleChange('address', val)}
          multiline
        />

        <View className="flex-row gap-3">
          <TextInput
            className="flex-1 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-4 text-slate-900 text-sm font-semibold"
            placeholder="City"
            placeholderTextColor="#94A3B8"
            value={formData.city}
            onChangeText={(val) => handleChange('city', val)}
          />

          <TextInput
            className="flex-1 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-4 text-slate-900 text-sm font-semibold"
            placeholder="Locality"
            placeholderTextColor="#94A3B8"
            value={formData.location}
            onChangeText={(val) => handleChange('location', val)}
          />
        </View>
      </View>

      <View className="gap-y-3 pt-4 pb-10">
        <PremiumButton title="Save Changes" onPress={handleSubmit} loading={loading} />

        {onCancel && (
          <TouchableOpacity onPress={onCancel} className="py-3 items-center">
            <Text className="text-slate-500 font-black uppercase tracking-widest text-[10px]">
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};
