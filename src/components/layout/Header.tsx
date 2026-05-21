import { THEME } from '@/theme/theme';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// Note: We need icons, assuming @expo/vector-icons
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  onBackPress?: () => void;
}

export const Header = ({ title, showBack = false, rightElement, onBackPress }: HeaderProps) => {
  const navigation = useNavigation();

  return (
    <View className="flex-row items-center justify-between py-4 bg-background">
      <View className="flex-1 flex-row items-center">
        {showBack && (
          <TouchableOpacity
            onPress={onBackPress || (() => navigation.goBack())}
            className="p-2 mr-2"
          >
            <Ionicons name="chevron-back" size={24} color={THEME.colors.background} />
          </TouchableOpacity>
        )}
        {title && (
          <Text className="text-xl font-bold text-text" numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>
      {rightElement && <View className="ml-4">{rightElement}</View>}
    </View>
  );
};
