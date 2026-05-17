import React from 'react';
import { View, Text } from 'react-native';
import { BookingStatus } from '@/types/booking.types';

interface BadgeProps {
  status: BookingStatus;
  customLabel?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, customLabel, className = '' }) => {
  const getBadgeClass = () => {
    switch (status) {
      case 'confirmed':
        return 'bg-white border-black text-black dark:bg-white dark:border-white dark:text-black';
      case 'completed':
        return 'bg-neutral-800 border-neutral-800 text-white dark:bg-neutral-200 dark:border-neutral-200 dark:text-neutral-900';
      case 'rejected':
      case 'cancelled':
        return 'bg-neutral-100 border-neutral-200 text-neutral-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400';
      case 'expired':
      case 'no_show':
        return 'bg-neutral-50 border-neutral-200 text-neutral-400 dark:bg-neutral-950 dark:border-neutral-900 dark:text-neutral-500';
      case 'pending':
      default:
        return 'bg-neutral-200 border-neutral-300 text-neutral-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200';
    }
  };

  const label = customLabel || status.replace('_', '-');

  return (
    <View className={`px-3 py-1 rounded-full border ${getBadgeClass()} ${className}`}>
      <Text className={`text-[11px] font-bold uppercase tracking-wider ${getBadgeClass().split(' ').pop()}`}>
        {label}
      </Text>
    </View>
  );
};
