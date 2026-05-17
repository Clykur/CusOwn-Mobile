import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { Business } from '@/types/business.types';
import { Ionicons } from '@expo/vector-icons';

interface BusinessDetailsCardProps {
  business: Business;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteLoading?: boolean;
}

const DetailField = ({ label, value, icon }: { label: string; value: string | number; icon: any }) => (
  <View className="mb-4">
    <View className="flex-row items-center mb-1">
      <Ionicons name={icon} size={14} color="#FFFFFF" className="mr-2" />
      <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">{label}</Text>
    </View>
    <Text className="text-white text-base font-medium ml-6">{value}</Text>
  </View>
);

export const BusinessDetailsCard: React.FC<BusinessDetailsCardProps> = ({
  business,
  onEdit,
  onDelete,
  deleteLoading,
}) => {
  return (
    <GlassCard className="p-6 mb-8">
      <View className="flex-row justify-between items-center mb-6 border-b border-white/10 pb-4">
        <Text className="text-white text-xl font-bold">Business Details</Text>
        <View className="flex-row gap-3">
          {onEdit && (
            <TouchableOpacity onPress={onEdit} className="bg-white/10 px-4 py-2 rounded-full border border-white/20">
              <Text className="text-white font-semibold text-xs">Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity 
              onPress={onDelete} 
              disabled={deleteLoading}
              className="bg-white/5 px-4 py-2 rounded-full border border-white/10"
            >
              <Text className="text-white/60 font-semibold text-xs">{deleteLoading ? '...' : 'Delete'}</Text>
            </TouchableOpacity>
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
          <DetailField label="Hours" value={`${business.opening_time.substring(0, 5)} - ${business.closing_time.substring(0, 5)}`} icon="time-outline" />
        </View>
        <View className="w-1/2">
          <DetailField label="Slot Duration" value={`${business.slot_duration} min`} icon="timer-outline" />
        </View>
        <View className="w-1/2">
          <DetailField label="Capacity" value={business.concurrent_booking_capacity || 1} icon="people-outline" />
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
