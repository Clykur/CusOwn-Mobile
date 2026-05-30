import React from 'react';
import { View, TextInput, Pressable, ActivityIndicator, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/theme/theme';

interface HomeSearchBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  useCurrentLocation: boolean;
  setUseCurrentLocation: (val: boolean) => void;
  userLocation: {
    latitude: number;
    longitude: number;
    city?: string;
    [key: string]: unknown;
  } | null;
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
  const displayValue = useCurrentLocation ? userLocation?.city || '' : searchQuery;

  return (
    <View className="px-5 mb-5 mt-2">
      <View
        className="
          flex-row
          items-center
          rounded-3xl
          border
          px-4
        "
        style={[
          {
            minHeight: 58,
            backgroundColor: 'rgba(18,18,18,0.92)',
            borderColor: 'rgba(0,230,118,0.14)',
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: {
              width: 0,
              height: 6,
            },
            elevation: 10,
          },
        ]}
      >
        {/* Search Icon */}
        <View className="w-6 items-center justify-center">
          <Ionicons name="search-outline" size={20} color={THEME.colors.textSecondary} />
        </View>

        {/* Input */}
        <TextInput
          className="flex-1 text-text text-base font-medium px-3.5"
          value={displayValue}
          placeholder="Search salons, services..."
          placeholderTextColor={THEME.colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
          onChangeText={(val) => {
            if (useCurrentLocation) {
              setUseCurrentLocation(false);
            }

            setSearchQuery(val);
          }}
          style={[
            {
              paddingVertical: Platform.OS === 'ios' ? 16 : 12,

              includeFontPadding: false,
              textAlignVertical: 'center',
            },
          ]}
        />

        {/* Clear Button */}
        {searchQuery?.length > 0 && !useCurrentLocation && (
          <Pressable
            className="mr-2 items-center justify-center"
            hitSlop={12}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={18} color={THEME.colors.textSecondary} />
          </Pressable>
        )}

        {/* Location Button */}
        <Pressable
          className="w-8 h-8 rounded-3xl items-center justify-center"
          hitSlop={12}
          onPress={() => {
            if (useCurrentLocation) {
              setUseCurrentLocation(false);
              setSearchQuery('');
            } else {
              setUseCurrentLocation(true);
              onLocate();
            }
          }}
          style={[
            {
              backgroundColor: useCurrentLocation ? 'rgba(0,230,118,0.12)' : 'transparent',
            },
          ]}
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
