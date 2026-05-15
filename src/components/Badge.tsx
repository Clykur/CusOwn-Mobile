import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { BookingStatus } from '@/types/booking.types';

interface BadgeProps extends ViewProps {
  status: BookingStatus;
  customLabel?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, customLabel, style, ...props }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'confirmed':
        return { bg: '#D1FAE5', text: '#065F46', label: 'Confirmed' };
      case 'completed':
        return { bg: '#DBEAFE', text: '#1E40AF', label: 'Completed' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' };
      case 'no_show':
        return { bg: '#F1F5F9', text: '#475569', label: 'No-Show' };
      case 'pending':
      default:
        return { bg: '#FEF3C7', text: '#92400E', label: 'Pending' };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]} {...props}>
      <Text style={[styles.text, { color: config.text }]} numberOfLines={1}>
        {customLabel || config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
