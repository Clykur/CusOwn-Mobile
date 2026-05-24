import React from 'react';
import { View, TextInput, Pressable, ActivityIndicator, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/theme/theme';
import { router } from 'expo-router';

interface HomeSearchBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  useCurrentLocation: boolean;
  setUseCurrentLocation: (val: boolean) => void;
  userLocation: any;
  locationLoading: boolean;
  onLocate: () => void;
}

export function HomeSearchBar({
  searchQuery,
  setSearchQuery,
  useCurrentLocation,
  setUseCurrentLocation,
  userLocation,
  locationLoading,
  onLocate,
}: HomeSearchBarProps) {
  return (
    <View className="px-luxury mb-6 mt-2">
      <View className="flex-row items-center bg-card/60 backdrop-blur-xl border border-primary/20 rounded-3xl px-4 py-3 h-14">
        <Ionicons name="search-outline" size={20} color={THEME.colors.textSecondary} />

        <TextInput
          className="flex-1 text-text font-medium text-base ml-3 -mt-2"
          placeholder="Search salons, services..."
          placeholderTextColor={THEME.colors.textSecondary}
          value={useCurrentLocation ? userLocation?.city || '' : searchQuery}
          onChangeText={(val) => {
            if (useCurrentLocation) {
              setUseCurrentLocation(false);
            }
            setSearchQuery(val);
          }}
          onSubmitEditing={() => Keyboard.dismiss()}
          returnKeyType="search"
        />

        {searchQuery && !useCurrentLocation ? (
          <Pressable onPress={() => setSearchQuery('')} className="mr-2">
            <Ionicons name="close-circle" size={18} color={THEME.colors.textSecondary} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => {
            if (useCurrentLocation) {
              setUseCurrentLocation(false);
              setSearchQuery('');
            } else {
              setUseCurrentLocation(true);
              onLocate();
            }
          }}
          className="items-center justify-center pl-2"
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color={THEME.colors.primary} />
          ) : (
            <Ionicons
              name={useCurrentLocation ? 'locate' : 'locate-outline'}
              size={20}
              color={useCurrentLocation ? THEME.colors.primary : THEME.colors.textSecondary}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}
