import React, { useCallback, useState } from 'react';

import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { apiService } from '@/services/api.service';

interface NoShowButtonProps {
  bookingId: string;

  onMarked?: () => void;
}

export default function NoShowButton({ bookingId, onMarked }: NoShowButtonProps) {
  const [loading, setLoading] = useState(false);

  const [marked, setMarked] = useState(false);

  const handleMarkNoShow = useCallback(async () => {
    if (loading || marked) return;

    Alert.alert('Mark No-Show', 'Mark this booking as no-show?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },

      {
        text: 'Confirm',

        style: 'destructive',

        onPress: async () => {
          try {
            setLoading(true);

            await apiService.markNoShow(bookingId);

            setMarked(true);

            Alert.alert('Success', 'Booking marked as no-show');

            if (onMarked) {
              onMarked();
            }
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to mark no-show');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }, [bookingId, loading, marked, onMarked]);

  if (marked) {
    return (
      <View className="w-full bg-amber-100 rounded-2xl py-4 flex-row items-center justify-center">
        <Ionicons name="checkmark-circle" size={20} color="#92400E" />

        <Text className="ml-2 text-amber-800 font-bold">Marked as No-Show</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleMarkNoShow}
      disabled={loading}
      className="w-full bg-slate-200 rounded-2xl py-4 flex-row items-center justify-center"
    >
      {loading ? (
        <ActivityIndicator color="#0F172A" />
      ) : (
        <>
          <Ionicons name="close-circle-outline" size={20} color="#0F172A" />

          <Text className="ml-2 text-slate-900 font-bold">Mark No-Show</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
