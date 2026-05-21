import { THEME } from '@/theme/theme';
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
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

const inputClass = 'bg-input border border-border rounded-2xl px-4 py-3 text-text font-semibold';

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
    <View className="mb-4 pb-4 border-b border-border">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-textSecondary text-xs font-black uppercase tracking-[2px]">
          Service #{index + 1}
        </Text>
        {showRemove && (
          <Pressable onPress={onRemove} className="p-1 active:opacity-70">
            <Ionicons name="trash-outline" size={18} color={THEME.colors.error} />
          </Pressable>
        )}
      </View>

      <View className="mb-3">
        <TextInput
          className={inputClass}
          placeholder="Service Name (e.g. Haircut)"
          placeholderTextColor={THEME.colors.textSecondary}
          value={name}
          onChangeText={onNameChange}
          style={{ color: THEME.colors.text }}
        />
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextInput
            className={inputClass}
            placeholder="Min"
            placeholderTextColor={THEME.colors.textSecondary}
            value={duration.toString()}
            onChangeText={onDurationChange}
            keyboardType="number-pad"
            style={{ color: THEME.colors.text }}
          />
        </View>
        <View className="flex-1">
          <TextInput
            className={inputClass}
            placeholder="Price (₹)"
            placeholderTextColor={THEME.colors.textSecondary}
            value={price.toString()}
            onChangeText={onPriceChange}
            keyboardType="decimal-pad"
            style={{ color: THEME.colors.text }}
          />
        </View>
      </View>
    </View>
  );
};
