import React from 'react';
import { View, TextInput, Pressable, ActivityIndicator, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/theme/theme';

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
  const displayValue = useCurrentLocation ? userLocation?.city || '' : searchQuery;

  return (
    <View className="px-5 mb-5 mt-2">
      <View
        className="
          flex-row
          items-center
          rounded-[24px]
          border
          px-4
        "
        style={{
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
        }}
      >
        {/* Search Icon */}
        <View
          style={{
            width: 22,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="search-outline" size={20} color={THEME.colors.textSecondary} />
        </View>

        {/* Input */}
        <TextInput
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
          style={{
            flex: 1,
            color: THEME.colors.text,
            fontSize: 16,
            fontWeight: '500',

            paddingVertical: Platform.OS === 'ios' ? 16 : 12,
            paddingHorizontal: 14,

            includeFontPadding: false,
            textAlignVertical: 'center',
          }}
        />

        {/* Clear Button */}
        {searchQuery?.length > 0 && !useCurrentLocation && (
          <Pressable
            hitSlop={12}
            onPress={() => setSearchQuery('')}
            style={{
              marginRight: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close-circle" size={18} color={THEME.colors.textSecondary} />
          </Pressable>
        )}

        {/* Location Button */}
        <Pressable
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
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: useCurrentLocation ? 'rgba(0,230,118,0.12)' : 'transparent',
          }}
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
