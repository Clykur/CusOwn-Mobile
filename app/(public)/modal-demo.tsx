import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';

import { Button } from '@/components/ui/Button';
import { THEME } from '@/constants/theme';
import { useModal } from '@/hooks/useModal';
import { horizontalScale, verticalScale, responsiveFontSize } from '@/utils/responsive';

export default function ModalDemoScreen() {
  const { showModal } = useModal();

  const handleConfirmation = () => {
    showModal({
      variant: 'confirmation',
      title: 'Enable Notifications?',
      description: 'Get notified when a new booking is created or when a customer messages you.',
      dismissible: true,
      actions: [
        {
          label: 'Enable',
          variant: 'primary',
          onPress: () => {
            console.log('Enabled');
          },
        },
      ],
    });
  };

  const handleDelete = () => {
    showModal({
      variant: 'delete',
      title: 'Delete Service?',
      description: 'Are you sure you want to delete this service? This action cannot be undone.',
      bullets: ['Removes service from booking page', 'Deletes all associated images'],
      dismissible: false,
      cancelText: 'Keep Service',
      actions: [
        {
          label: 'Delete Permanently',
          variant: 'danger',
          onPress: async () => {
            // simulate API call
            await new Promise((res) => setTimeout(res, 1000));
            console.log('Deleted');
          },
        },
      ],
    });
  };

  const handleBusinessDelete = () => {
    showModal({
      variant: 'business_delete',
      title: 'Delete Business Account?',
      description: 'This is a destructive action and cannot be reversed. All data will be wiped.',
      bullets: [
        'Permanently deletes your account',
        'Cancels all active subscriptions',
        'Wipes customer data completely',
      ],
      dismissible: false,
      actions: [
        {
          label: 'I understand, delete everything',
          variant: 'danger',
          onPress: async () => {
            await new Promise((res) => setTimeout(res, 1500));
          },
        },
      ],
    });
  };

  const handleWarning = () => {
    showModal({
      variant: 'warning',
      title: 'Connection Lost',
      description:
        'We are having trouble connecting to our servers. Please check your internet connection.',
      dismissible: true,
      hideCancel: true,
      actions: [
        {
          label: 'Retry',
          variant: 'primary',
          onPress: () => {
            console.log('Retrying...');
          },
        },
      ],
    });
  };

  const handleSuccess = () => {
    showModal({
      variant: 'success',
      title: 'Booking Confirmed!',
      description: 'Your appointment has been successfully scheduled.',
      dismissible: true,
      hideCancel: true,
      actions: [
        {
          label: 'View Booking',
          variant: 'secondary',
          onPress: () => {},
        },
      ],
    });
  };

  const handleError = () => {
    showModal({
      variant: 'error',
      title: 'Payment Failed',
      description: 'We could not process your card. Please try a different payment method.',
      dismissible: true,
    });
  };

  const handleSignOut = () => {
    showModal({
      variant: 'signout',
      title: 'Sign Out?',
      description: 'Are you sure you want to sign out of your account?',
      dismissible: true,
      actions: [
        {
          label: 'Sign Out',
          variant: 'ghost',
          onPress: () => {
            console.log('Signing out');
          },
        },
      ],
    });
  };

  const handleCustom = () => {
    showModal({
      variant: 'confirmation',
      icon: <Ionicons name="rocket" size={48} color="#A855F7" />,
      title: 'Custom Modal',
      description: 'You can pass any custom icon and change the colors.',
      dismissible: true,
      actions: [
        {
          label: 'Launch',
          variant: 'primary',
          onPress: () => {},
        },
      ],
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Modal Design System', headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.header}>Global Modals</Text>
        <Text style={styles.subtext}>
          Tap any button to trigger the global modal component. Modals are rendered at the root
          level above everything else.
        </Text>

        <View style={styles.buttonGroup}>
          <Button onPress={handleConfirmation} variant="primary">
            Confirmation
          </Button>
          <Button onPress={handleSuccess} variant="secondary">
            Success State
          </Button>
          <Button onPress={handleWarning} variant="ghost">
            Warning State
          </Button>
          <Button onPress={handleError} variant="ghost">
            Error State
          </Button>
          <Button onPress={handleSignOut} variant="secondary">
            Sign Out
          </Button>
          <Button onPress={handleDelete} variant="danger">
            Delete Action
          </Button>
          <Button onPress={handleBusinessDelete} variant="danger">
            Business Delete
          </Button>
          <Button onPress={handleCustom} variant="primary">
            Custom Icon
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    padding: horizontalScale(24),
    paddingBottom: verticalScale(40),
  },
  header: {
    color: THEME.colors.text,
    fontSize: responsiveFontSize(28),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
  },
  subtext: {
    color: THEME.colors.textSecondary,
    fontSize: responsiveFontSize(16),
    lineHeight: responsiveFontSize(24),
    marginBottom: verticalScale(32),
  },
  buttonGroup: {
    gap: verticalScale(16),
  },
});
