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
    <View className="mb-4 pb-4 border-b border-white/10">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-accent-premium text-xs font-bold uppercase tracking-widest">
          Service #{index + 1}
        </Text>
        {showRemove && (
          <TouchableOpacity onPress={onRemove}>
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <View className="mb-3">
        <TextInput
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-medium"
          placeholder="Service Name (e.g. Haircut)"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={name}
          onChangeText={onNameChange}
        />
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextInput
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-medium"
            placeholder="Min"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={duration.toString()}
            onChangeText={onDurationChange}
            keyboardType="number-pad"
          />
        </View>
        <View className="flex-1">
          <TextInput
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-medium"
            placeholder="Price (₹)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={price.toString()}
            onChangeText={onPriceChange}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
    </View>
  );
};
