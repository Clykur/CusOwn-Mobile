import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { apiService } from '@/services/api.service';
import { useAuthStore } from '@/store/auth.store';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { ServiceRow } from './ServiceRow';
import { BusinessCategory } from '@/types/business.types';

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
      setCategories(cats);
      if (cats.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: cats[0].value }));
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      // Fallback categories if API fails
      setCategories([
        { value: 'salon', label: 'Salon' },
        { value: 'spa', label: 'Spa' },
        { value: 'barbershop', label: 'Barber' },
        { value: 'clinic', label: 'Clinic' },
      ]);
    } finally {
      setFetchingCategories(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleAddService = () => {
    setServiceRows(prev => [...prev, { name: '', duration_minutes: 30, price_inr: 0 }]);
  };

  const handleRemoveService = (index: number) => {
    setServiceRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, key: keyof ServiceDraftRow, value: string | number) => {
    setServiceRows(prev => prev.map((row, i) => 
      i === index ? { ...row, [key]: value } : row
    ));
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

      // Reverse geocoding
      let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        setFormData(prev => ({
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
        setFormData(prev => ({ ...prev, latitude, longitude }));
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
    if (formData.opening_time >= formData.closing_time) return 'Closing time must be after opening time.';
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
        .filter(s => s.name.trim().length > 0)
        .map(s => ({
          name: s.name.trim(),
          duration_minutes: s.duration_minutes,
          price_cents: Math.round(s.price_inr * 100),
        }));

      const payload = {
        ...formData,
        concurrent_booking_capacity: parseInt(formData.concurrent_booking_capacity, 10) || 1,
        opening_time: formData.opening_time.length === 5 ? `${formData.opening_time}:00` : formData.opening_time,
        closing_time: formData.closing_time.length === 5 ? `${formData.closing_time}:00` : formData.closing_time,
        services: servicesPayload.length > 0 ? servicesPayload : undefined,
      };

      const result = await apiService.createBusiness(payload);
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

  return (
    <View className="space-y-6">
      {error && (
        <View className="bg-neutral-800/80 border border-neutral-700 rounded-lg p-4 mb-4">
          <Text className="text-neutral-100 text-sm font-medium">{error}</Text>
        </View>
      )}

      {/* Core Details */}
      <View>
        <Text className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-3">Business Name *</Text>
        <TextInput 
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-medium"
          placeholder="The Signature Salon"
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={formData.salon_name}
          onChangeText={(val) => handleChange('salon_name', val)}
        />
      </View>

      <View>
        <Text className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-3">Owner Name *</Text>
        <TextInput 
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-medium"
          placeholder="John Doe"
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={formData.owner_name}
          onChangeText={(val) => handleChange('owner_name', val)}
        />
      </View>

      <View>
        <Text className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-3">WhatsApp Number *</Text>
        <TextInput 
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-medium"
          placeholder="10-digit number"
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={formData.whatsapp_number}
          onChangeText={(val) => handleChange('whatsapp_number', val.replace(/\D/g, '').slice(0, 10))}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>

      {/* Category Selection */}
      <View>
        <Text className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">Business Type *</Text>
        {fetchingCategories ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {categories.map(cat => (
              <TouchableOpacity 
                key={cat.value}
                onPress={() => handleChange('category', cat.value)}
                className={`px-6 py-3 rounded-full mr-3 border ${formData.category === cat.value ? 'bg-white border-white' : 'bg-transparent border-white/20'}`}
              >
                <Text className={`font-semibold ${formData.category === cat.value ? 'text-black' : 'text-white'}`}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Operational Details */}
      <View>
        <Text className="text-white text-sm font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-2">Operational Details</Text>
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Open Time</Text>
            <TextInput 
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-medium"
              value={formData.opening_time}
              onChangeText={(val) => handleChange('opening_time', val)}
              placeholder="10:00"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
          </View>
          <View className="flex-1">
            <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Close Time</Text>
            <TextInput 
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-medium"
              value={formData.closing_time}
              onChangeText={(val) => handleChange('closing_time', val)}
              placeholder="21:00"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">Slot Duration *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {SLOT_DURATIONS.map(dur => (
              <TouchableOpacity 
                key={dur}
                onPress={() => handleChange('slot_duration', dur)}
                className={`px-5 py-2 rounded-full mr-3 border ${formData.slot_duration === dur ? 'bg-white border-white' : 'bg-transparent border-white/20'}`}
              >
                <Text className={`font-semibold ${formData.slot_duration === dur ? 'text-black' : 'text-white'}`}>
                  {dur} min
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="mb-6">
          <Text className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-3">Concurrent Bookings</Text>
          <TextInput 
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-medium"
            placeholder="1"
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={formData.concurrent_booking_capacity}
            onChangeText={(val) => handleChange('concurrent_booking_capacity', val)}
            keyboardType="number-pad"
          />
        </View>
      </View>

      {/* Services Section */}
      <View>
        <View className="flex-row justify-between items-center mb-6 border-b border-white/10 pb-2">
          <Text className="text-white text-sm font-bold uppercase tracking-widest">Services</Text>
          <TouchableOpacity onPress={handleAddService}>
            <Text className="text-white text-xs font-bold uppercase">+ Add Service</Text>
          </TouchableOpacity>
        </View>
        
        {serviceRows.map((row, index) => (
          <ServiceRow
            key={index}
            index={index}
            name={row.name}
            duration={row.duration_minutes}
            price={row.price_inr}
            onNameChange={(val) => handleServiceChange(index, 'name', val)}
            onDurationChange={(val) => handleServiceChange(index, 'duration_minutes', parseInt(val, 10) || 0)}
            onPriceChange={(val) => handleServiceChange(index, 'price_inr', parseFloat(val) || 0)}
            onRemove={() => handleRemoveService(index)}
            showRemove={serviceRows.length > 1}
          />
        ))}
      </View>

      {/* Location Section */}
      <View>
        <View className="flex-row justify-between items-center mb-6 border-b border-white/10 pb-2">
          <Text className="text-white text-sm font-bold uppercase tracking-widest">Location Details</Text>
          <TouchableOpacity onPress={handleUseLocation} disabled={loading}>
            <Text className="text-white text-xs font-bold uppercase">Use My Location</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-4">
          <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Address *</Text>
          <TextInput 
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-medium"
            placeholder="Street address, building"
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={formData.address}
            onChangeText={(val) => handleChange('address', val)}
            multiline
          />
        </View>

        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className="text-slate-400 text-xs font-bold uppercase mb-2">City *</Text>
            <TextInput 
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-medium"
              placeholder="City"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={formData.city}
              onChangeText={(val) => handleChange('city', val)}
            />
          </View>
          <View className="flex-1">
            <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Locality *</Text>
            <TextInput 
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-medium"
              placeholder="Locality"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={formData.location}
              onChangeText={(val) => handleChange('location', val)}
            />
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Sub-Area</Text>
            <TextInput 
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-medium"
              placeholder="Optional"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={formData.area}
              onChangeText={(val) => handleChange('area', val)}
            />
          </View>
          <View className="flex-1">
            <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Pincode</Text>
            <TextInput 
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-medium"
              placeholder="Optional"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={formData.pincode}
              onChangeText={(val) => handleChange('pincode', val)}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>

      <PremiumButton 
        title="Establish Business" 
        onPress={handleSubmit} 
        loading={combinedLoading}
        disabled={combinedLoading}
        className="mt-8"
      />
    </View>
  );
};
