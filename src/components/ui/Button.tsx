import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  useColorScheme,
} from 'react-native';
import { THEME } from '@/constants/theme';
import { horizontalScale, verticalScale, responsiveFontSize } from '@/utils/responsive';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  disabled = false,
  onPress,
  children,
  ...props
}) => {
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const activeTheme = isDark ? THEME.colors : THEME.colors;

  const theme = {
    primary: activeTheme.primary,
    secondary: activeTheme.secondary,
    error: activeTheme.error,
    border: activeTheme.border,
    text: activeTheme.text,
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.containerSecondary, { backgroundColor: theme.secondary }];
      case 'danger':
        return [styles.containerDanger, { backgroundColor: theme.error }];
      case 'ghost':
        return [styles.containerGhost, { borderColor: theme.border }];
      case 'primary':
      default:
        return [styles.containerPrimary, { backgroundColor: theme.primary }];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'ghost':
        return [styles.textGhost, { color: theme.text }];
      case 'secondary':
      case 'danger':
      case 'primary':
      default:
        return styles.textLight;
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.baseContainer, getContainerStyle(), isDisabled && styles.disabledContainer]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? theme.primary : THEME.colors.text}
          size="small"
        />
      ) : typeof children === 'string' ? (
        <Text style={[styles.baseText, getTextStyle()]} numberOfLines={1}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    paddingVertical: verticalScale(14),
    paddingHorizontal: horizontalScale(24),
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(52),
  },
  containerPrimary: {},
  containerSecondary: {},
  containerDanger: {},
  containerGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  baseText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    textAlign: 'center',
  },
  textLight: {
    color: THEME.colors.background,
  },
  textGhost: {},
});
