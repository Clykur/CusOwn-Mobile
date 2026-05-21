import React from 'react';
import { View, Text } from 'react-native';
import { responsiveFontSize } from '@/utils/responsive';
import { BookingStatus } from '@/types/booking.types';

interface BadgeProps {
  status: BookingStatus;
  customLabel?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, customLabel, className = '' }) => {
  const getBadgeStyles = () => {
    switch (status) {
      case 'confirmed':
        return {
          text: 'text-emerald-600',
        };

      case 'completed':
        return {
          text: 'text-blue-600',
        };

      case 'pending':
        return {
          text: 'text-amber-600',
        };

      case 'rejected':
      case 'cancelled':
        return {
          text: 'text-red-600',
        };

      case 'expired':
      case 'no_show':
        return {
          text: 'text-slate-500',
        };

      default:
        return {
          text: 'text-neutral-500',
        };
    }
  };

  const badge = getBadgeStyles();

  const label = customLabel || status.replace('_', ' ');

  return (
    <View className={className}>
      <Text
        style={{
          fontSize: responsiveFontSize(11),
        }}
        className={`
          font-black uppercase tracking-wider
          ${badge.text}
        `}
      >
        {label}
      </Text>
    </View>
  );
};
