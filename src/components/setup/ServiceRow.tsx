import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ServiceRowProps {
  name: string;
  duration: number;
  price: number;
  onNameChange: (val: string) => void;
  onDurationChange: (val: string) => void;
  onPriceChange: (val: string) => void;
  onRemove: () => void;
  showRemove: boolean;
  index: number;
}

export const ServiceRow: React.FC<ServiceRowProps> = ({
  name,
  duration,
  price,
  onNameChange,
  onDurationChange,
  onPriceChange,
  onRemove,
  showRemove,
  index,
}) => {
  return (
    <View className="mb-4 pb-4 border-b border-slate-100">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">
          Service #{index + 1}
        </Text>
        {showRemove && (
          <TouchableOpacity onPress={onRemove}>
            <Ionicons name="trash-outline" size={18} color="#000000" />
          </TouchableOpacity>
        )}
      </View>

      <View className="mb-3">
        <TextInput
          className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-slate-900 font-semibold"
          placeholder="Service Name (e.g. Haircut)"
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={onNameChange}
        />
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextInput
            className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-slate-900 font-semibold"
            placeholder="Min"
            placeholderTextColor="#94A3B8"
            value={duration.toString()}
            onChangeText={onDurationChange}
            keyboardType="number-pad"
          />
        </View>
        <View className="flex-1">
          <TextInput
            className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-slate-900 font-semibold"
            placeholder="Price (₹)"
            placeholderTextColor="#94A3B8"
            value={price.toString()}
            onChangeText={onPriceChange}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
    </View>
  );
};
