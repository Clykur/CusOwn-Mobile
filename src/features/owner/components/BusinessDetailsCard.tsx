import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, Pressable } from 'react-native';

import { GlassCard } from '@/components/ui/GlassCard';
import { THEME } from '@/theme/theme';

import type { Business } from '@/types/business.types';

interface BusinessDetailsCardProps {
  business: Business;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteLoading?: boolean;
}

const DetailField = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
}) => (
  <View className="mb-4">
    <View className="flex-row items-center mb-1">
      <Ionicons name={icon} size={14} color={THEME.colors.textSecondary} className="mr-2" />
      <Text className="text-slate-400 text-xs font-black uppercase tracking-0.5">{label}</Text>
    </View>
    <Text className="text-slate-900 text-base font-semibold ml-6">{value}</Text>
  </View>
);

export const BusinessDetailsCard: React.FC<BusinessDetailsCardProps> = ({
  business,
  onEdit,
  onDelete,
  deleteLoading,
}) => {
  return (
    <GlassCard className="p-6 mb-8 border-slate-200/80 shadow-sm rounded-luxury">
      <View className="flex-row justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <Text className="text-slate-900 text-xl font-black">Business Details</Text>
        <View className="flex-row gap-3">
          {onEdit && (
            <Pressable
              onPress={onEdit}
              className="bg-black px-4 py-2.5 rounded-full active:bg-slate-950 shadow-sm"
            >
              <Text className="text-white font-black text-xs uppercase tracking-wider">Edit</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={onDelete}
              disabled={deleteLoading}
              className="bg-white px-4 py-2.5 rounded-full border border-slate-200/80 active:bg-slate-50 shadow-sm"
            >
              <Text className="text-slate-700 font-black text-xs uppercase tracking-wider">
                {deleteLoading ? '...' : 'Delete'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View className="flex-row flex-wrap">
        <View className="w-1/2">
          <DetailField label="Business Name" value={business.salon_name} icon="business-outline" />
        </View>
        <View className="w-1/2">
          <DetailField label="Owner Name" value={business.owner_name} icon="person-outline" />
        </View>
        <View className="w-1/2">
          <DetailField label="WhatsApp" value={business.whatsapp_number} icon="logo-whatsapp" />
        </View>
        <View className="w-1/2">
          <DetailField
            label="Hours"
            value={`${business.opening_time.substring(0, 5)} - ${business.closing_time.substring(0, 5)}`}
            icon="time-outline"
          />
        </View>
        <View className="w-1/2">
          <DetailField
            label="Slot Duration"
            value={`${business.slot_duration} min`}
            icon="timer-outline"
          />
        </View>
        <View className="w-1/2">
          <DetailField
            label="Capacity"
            value={business.concurrent_booking_capacity || 1}
            icon="people-outline"
          />
        </View>
        {business.location && (
          <View className="w-full">
            <DetailField label="Location" value={business.location} icon="map-outline" />
          </View>
        )}
        {business.address && (
          <View className="w-full">
            <DetailField label="Address" value={business.address} icon="location-outline" />
          </View>
        )}
      </View>
    </GlassCard>
  );
};
