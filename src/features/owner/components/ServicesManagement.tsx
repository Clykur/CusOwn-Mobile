import { THEME } from '@/theme/theme';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';

import { apiService } from '@/services/api.service';
import { Service } from '@/types/business.types';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';

interface ServicesManagementProps {
  businessId: string;
}

export const ServicesManagement: React.FC<ServicesManagementProps> = ({ businessId }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    duration: '',
    price: '',
  });

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);

      const data = await apiService.getOwnerServices(businessId);

      setServices(data || []);
    } catch (e) {
      console.error('Failed to fetch services:', e);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openAdd = () => {
    setEditing(null);

    setForm({
      name: '',
      duration: '30',
      price: '',
    });

    setShowForm(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);

    setForm({
      name: s.name,
      duration: String(s.duration),
      price: String(s.price),
    });

    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.duration || !form.price) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setSaving(true);

    const payload = {
      businessId,
      business_id: businessId,
      name: form.name,
      duration_minutes: Number(form.duration),
      price_cents: Math.round(Number(form.price) * 100),
    };

    try {
      if (editing) {
        await apiService.updateService(editing.id, payload);
      } else {
        await apiService.createService(payload);
      }

      setShowForm(false);

      fetchServices();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Service', 'Are you sure you want to delete this service?', [
      { text: 'Cancel', style: 'cancel' },

      {
        text: 'Delete',
        style: 'destructive',

        onPress: async () => {
          try {
            await apiService.deleteService(id);

            setServices((prev) => prev.filter((s) => s.id !== id));
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete service');
          }
        },
      },
    ]);
  };

  return (
    <>
      {/* Main Card */}
      <GlassCard className="p-2 border-border rounded-luxury">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6 border-b border-border pb-4">
          <Text className="text-text text-xl font-black tracking-tight">Services</Text>

          <Pressable
            onPress={openAdd}
            className="bg-primary px-5 py-3 rounded-full active:opacity-80"
          >
            <Text className="text-background font-black text-xs uppercase tracking-wider">
              + Add Service
            </Text>
          </Pressable>
        </View>

        {/* Loading */}
        {loading ? (
          <ActivityIndicator color={THEME.colors.textSecondary} className="my-8" />
        ) : services.length === 0 ? (
          /* Empty State */
          <View className="py-10 items-center justify-center">
            <Ionicons name="cut-outline" size={52} color={THEME.colors.border} />

            <Text className="text-textSecondary text-center mt-4 font-semibold">
              No services listed yet.
            </Text>
          </View>
        ) : (
          /* Services List */
          <View className="space-y-1">
            {services.map((s, index) => (
              <View key={s.id}>
                <View className="p-4 flex-row justify-between items-center">
                  {/* Left */}
                  <View className="flex-1 mr-4">
                    <Text className="text-text text-base font-extrabold">{s.name}</Text>

                    <Text className="text-textSecondary text-xs mt-1 font-semibold">
                      {s.duration} mins • ₹{s.price}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View className="flex-row gap-x-1">
                    {/* Edit */}
                    <Pressable
                      onPress={() => openEdit(s)}
                      className="p-3 active:bg-card rounded-xl"
                    >
                      <Ionicons name="create-outline" size={16} color={THEME.colors.primary} />
                    </Pressable>

                    {/* Delete */}
                    <Pressable
                      onPress={() => handleDelete(s.id)}
                      className="p-3 active:bg-card rounded-xl"
                    >
                      <Ionicons name="trash-outline" size={16} color={THEME.colors.error} />
                    </Pressable>
                  </View>
                </View>

                {/* Divider */}
                {index !== services.length - 1 && (
                  <View className="h-px bg-border mx-4 opacity-60" />
                )}
              </View>
            ))}
          </View>
        )}
      </GlassCard>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={showForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowForm(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onPress={() => setShowForm(false)}
        >
          {/* Bottom Sheet */}
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-card rounded-t-[36px] p-6 pb-10 border-t border-border"
          >
            {/* Handle */}
            <View className="w-14 h-1.5 bg-border rounded-full self-center mb-6" />

            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-text text-lg font-black uppercase tracking-wide">
                {editing ? 'Edit Service' : 'Add Service'}
              </Text>

              <Pressable onPress={() => setShowForm(false)}>
                <Ionicons name="close-outline" size={28} color={THEME.colors.textSecondary} />
              </Pressable>
            </View>

            {/* Service Name */}
            <View className="mb-4">
              <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-2">
                Service Name
              </Text>

              <TextInput
                className="bg-input border border-border rounded-2xl px-4 py-4 text-text font-semibold"
                placeholder="e.g. Haircut"
                placeholderTextColor={THEME.colors.textSecondary}
                value={form.name}
                onChangeText={(val) => setForm({ ...form, name: val })}
              />
            </View>

            {/* Duration + Price */}
            <View className="flex-row gap-x-3 mb-6">
              {/* Duration */}
              <View className="flex-1">
                <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-2">
                  Duration
                </Text>

                <TextInput
                  className="bg-input border border-border rounded-2xl px-4 py-4 text-text font-semibold"
                  placeholder="30"
                  placeholderTextColor={THEME.colors.textSecondary}
                  value={form.duration}
                  onChangeText={(val) => setForm({ ...form, duration: val })}
                  keyboardType="number-pad"
                />
              </View>

              {/* Price */}
              <View className="flex-1">
                <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px] mb-2">
                  Price (₹)
                </Text>

                <TextInput
                  className="bg-input border border-border rounded-2xl px-4 py-4 text-text font-semibold"
                  placeholder="500"
                  placeholderTextColor={THEME.colors.textSecondary}
                  value={form.price}
                  onChangeText={(val) => setForm({ ...form, price: val })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="bg-primary py-4 rounded-full items-center active:opacity-80"
            >
              {saving ? (
                <ActivityIndicator color={THEME.colors.background} />
              ) : (
                <Text className="text-background font-black text-xs uppercase tracking-widest">
                  Save Service
                </Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};
