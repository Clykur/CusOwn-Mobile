import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import { THEME } from '@/constants/theme';
import { horizontalScale, verticalScale, responsiveFontSize } from '@/utils/responsive';
import * as Haptics from 'expo-haptics';
import { ModalActionVariant } from '@/types/modal';

interface ModalButtonProps extends TouchableOpacityProps {
  variant?: ModalActionVariant;
  loading?: boolean;
  label: string;
}

export const ModalButton: React.FC<ModalButtonProps> = ({
  variant = 'primary',
  loading = false,
  disabled = false,
  onPress,
  label,
  ...props
}) => {
  const theme = THEME.colors;

  const handlePress = (e: import('react-native').GestureResponderEvent) => {
    if (variant === 'danger') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress(e);
    }
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.containerSecondary, { backgroundColor: theme.input }]; // Using input or card for secondary
      case 'danger':
        return [styles.containerDanger, { backgroundColor: theme.error }];
      case 'ghost':
        return [styles.containerGhost]; // No border for ghost in modal, just text
      case 'primary':
      default:
        return [styles.containerPrimary, { backgroundColor: theme.primary }];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'ghost':
        return [styles.textGhost, { color: theme.textSecondary }];
      case 'secondary':
        return [styles.textSecondary, { color: theme.text }];
      case 'danger':
        return [styles.textDanger, { color: '#FFFFFF' }];
      case 'primary':
      default:
        return [styles.textPrimary, { color: theme.background }];
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.baseContainer,
        getContainerStyle(),
        isDisabled && styles.disabledContainer,
        variant === 'ghost' && { minHeight: undefined, paddingVertical: verticalScale(12) },
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' || variant === 'secondary' ? theme.text : theme.background}
          size="small"
        />
      ) : (
        <Text style={[styles.baseText, getTextStyle()]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    paddingVertical: verticalScale(14),
    paddingHorizontal: horizontalScale(24),
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(52),
    width: '100%',
  },
  containerPrimary: {},
  containerSecondary: {},
  containerDanger: {},
  containerGhost: {
    backgroundColor: 'transparent',
  },
  disabledContainer: {
    opacity: 0.5,
  },
  baseText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    textAlign: 'center',
  },
  textPrimary: {},
  textSecondary: {},
  textDanger: {},
  textGhost: {},
});
