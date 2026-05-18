import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { apiService } from '@/services/api.service';
import { Service } from '@/types/business.types';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';

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
    setForm({ name: '', duration: '30', price: '' });
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
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteService(id);
              setServices(prev => prev.filter(s => s.id !== id));
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete service');
            }
          }
        }
      ]
    );
  };

  return (
    <GlassCard className="p-6 border-slate-200/80 shadow-sm rounded-luxury">
      <View className="flex-row justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <Text className="text-slate-900 text-xl font-black tracking-tight">Services</Text>
        {!showForm && (
          <Pressable onPress={openAdd} className="bg-black px-5 py-3 rounded-full active:bg-slate-950">
            <Text className="text-white font-black text-xs uppercase tracking-wider">+ Add Service</Text>
          </Pressable>
        )}
      </View>

      {showForm ? (
        <View className="space-y-4 mb-2">
          <Text className="text-slate-900 text-sm font-black uppercase tracking-wider mb-4">
            {editing ? 'Edit Service' : 'Add New Service'}
          </Text>
          
          <View className="mb-3">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Service Name</Text>
            <TextInput
              className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 text-slate-800 font-semibold"
              placeholder="e.g. Haircut"
              placeholderTextColor="#94A3B8"
              value={form.name}
              onChangeText={(val) => setForm({ ...form, name: val })}
            />
          </View>

          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Duration (min)</Text>
              <TextInput
                className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 text-slate-800 font-semibold"
                placeholder="30"
                placeholderTextColor="#94A3B8"
                value={form.duration}
                onChangeText={(val) => setForm({ ...form, duration: val })}
                keyboardType="number-pad"
              />
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Price (₹)</Text>
              <TextInput
                className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 text-slate-800 font-semibold"
                placeholder="500"
                placeholderTextColor="#94A3B8"
                value={form.price}
                onChangeText={(val) => setForm({ ...form, price: val })}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View className="flex-row gap-3 pt-4">
            <Pressable 
              onPress={handleSave} 
              disabled={saving}
              className="flex-1 bg-black py-3.5 rounded-full items-center active:bg-slate-950"
            >
              {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-xs uppercase tracking-widest">Save Service</Text>}
            </Pressable>
            <Pressable 
              onPress={() => setShowForm(false)} 
              disabled={saving}
              className="flex-1 bg-white py-3.5 rounded-full items-center border border-slate-200/80 active:bg-slate-50"
            >
              <Text className="text-slate-700 font-black text-xs uppercase tracking-widest">Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : loading ? (
        <ActivityIndicator color="#64748B" className="my-8" />
      ) : services.length === 0 ? (
        <View className="py-8 items-center">
          <Ionicons name="cut-outline" size={48} color="#CBD5E1" />
          <Text className="text-slate-500 text-center mt-4 font-medium">No services listed yet.</Text>
        </View>
      ) : (
        <View className="space-y-3">
          {services.map((s) => (
            <View key={s.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex-row justify-between items-center mb-3">
              <View className="flex-1 mr-4">
                <Text className="text-slate-900 text-base font-extrabold">{s.name}</Text>
                <Text className="text-slate-500 text-xs mt-1 font-semibold">{s.duration} mins • ₹{s.price}</Text>
              </View>
              <View className="flex-row gap-x-3">
                <Pressable 
                  onPress={() => openEdit(s)}
                  className="bg-white border border-slate-200/80 p-2.5 rounded-full active:bg-slate-100"
                >
                  <Ionicons name="pencil-outline" size={16} color="#64748B" />
                </Pressable>
                <Pressable 
                  onPress={() => handleDelete(s.id)}
                  className="bg-white border border-slate-200/80 p-2.5 rounded-full active:bg-neutral-200"
                >
                  <Ionicons name="trash-outline" size={16} color="#000000" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
};
