import { useState } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export function useLocation() {
  const [userLocation, setUserLocation] = useState<any>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const getUserLocation = async (silent: boolean = false) => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (!silent) Alert.alert('Location Permission', 'Location permission denied');
        return false;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = reverseGeocode?.[0];

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: address?.city || '',
        district: address?.district || '',
        region: address?.region || '',
        country: address?.country || '',
        postalCode: address?.postalCode || '',
        street: address?.street || '',
      });
      return true;
    } catch (error: unknown) {
      const { logger, LogTag } = require('@/utils/logger');
      logger.error(LogTag.API, 'Location Error:', error);

      if (!silent) Alert.alert('Location Error', 'Failed to fetch your current location');
      return false;
    } finally {
      setLocationLoading(false);
    }
  };

  return {
    userLocation,
    setUserLocation,
    locationLoading,
    useCurrentLocation,
    setUseCurrentLocation,
    getUserLocation,
  };
}
