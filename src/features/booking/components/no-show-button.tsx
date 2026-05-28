import { THEME } from '@/theme/theme';
import React, { useCallback, useState } from 'react';

import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useModal } from '@/hooks/useModal';

import { apiService } from '@/services/api.service';

interface NoShowButtonProps {
  bookingId: string;

  onMarked?: () => void;
}

export default function NoShowButton({ bookingId, onMarked }: NoShowButtonProps) {
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();

  const [marked, setMarked] = useState(false);

  const handleMarkNoShow = useCallback(async () => {
    if (loading || marked) return;

    showModal({
      variant: 'delete',
      title: 'Mark No-Show',
      description: 'Mark this booking as no-show?',
      dismissible: true,
      actions: [
        {
          label: 'Confirm',
          variant: 'danger',
          onPress: async () => {
            try {
              setLoading(true);
              await apiService.markNoShow(bookingId);
              setMarked(true);
              showModal({
                variant: 'success',
                title: 'Success',
                description: 'Booking marked as no-show',
              });
              if (onMarked) {
                onMarked();
              }
            } catch (error: any) {
              showModal({
                variant: 'error',
                title: 'Error',
                description: error?.message || 'Failed to mark no-show',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    });
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
        <ActivityIndicator color={THEME.colors.background} />
      ) : (
        <>
          <Ionicons name="close-circle-outline" size={20} color={THEME.colors.background} />

          <Text className="ml-2 text-slate-900 font-bold">Mark No-Show</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
