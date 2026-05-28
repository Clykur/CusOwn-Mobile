import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { horizontalScale, verticalScale, responsiveFontSize } from '@/utils/responsive';
import { ModalContext } from '@/hooks/useModal';
import { ModalButton } from './ModalButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const GlobalModal = () => {
  const context = React.useContext(ModalContext);

  if (!context) return null;

  const { config, isVisible, hideModal } = context;

  const [renderConfig, setRenderConfig] = useState(config);

  const insets = useSafeAreaInsets();

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  // Keep rendering last config while animating out
  useEffect(() => {
    if (config) {
      setRenderConfig(config);
    }
  }, [config]);

  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });

      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
    } else {
      opacity.value = withTiming(
        0,
        {
          duration: 200,
          easing: Easing.in(Easing.ease),
        },
        () => {
          runOnJS(setRenderConfig)(null);
        },
      );

      scale.value = withTiming(0.95, {
        duration: 200,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [isVisible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!renderConfig && !isVisible) return null;

  const handleBackdropPress = () => {
    if (renderConfig?.dismissible) {
      hideModal();
    }
  };

  const getIcon = () => {
    if (renderConfig?.icon) return renderConfig.icon;

    switch (renderConfig?.variant) {
      case 'success':
        return <Ionicons name="checkmark-circle-outline" size={48} color={THEME.colors.success} />;

      case 'error':
        return <Ionicons name="close-circle-outline" size={48} color={THEME.colors.error} />;

      case 'warning':
        return <Ionicons name="warning-outline" size={48} color="#F59E0B" />;

      case 'delete':
      case 'business_delete':
        return <Ionicons name="trash-outline" size={48} color={THEME.colors.error} />;

      case 'signout':
        return <Ionicons name="log-out-outline" size={48} color={THEME.colors.textSecondary} />;

      case 'confirmation':
      default:
        return <Ionicons name="help-circle-outline" size={48} color={THEME.colors.primary} />;
    }
  };

  // Default actions
  const actions = renderConfig?.actions || [];

  if (actions.length === 0 && renderConfig?.variant !== 'success') {
    actions.push({
      label: 'OK',
      variant: 'primary',
      onPress: hideModal,
    });
  }

  return (
    <Modal
      transparent
      visible={isVisible || !!renderConfig}
      animationType="none"
      onRequestClose={handleBackdropPress}
    >
      <View style={[StyleSheet.absoluteFill, styles.overlayContainer]} pointerEvents="box-none">
        <Animated.View style={[StyleSheet.absoluteFill, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 40 : 100}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />

            <View style={[StyleSheet.absoluteFill, styles.backdropDarken]} />
          </Pressable>
        </Animated.View>

        <View
          style={[
            styles.modalWrapper,
            {
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
          pointerEvents="box-none"
        >
          <Animated.View style={[styles.modalContainer, animatedModalStyle]}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.iconContainer}>{getIcon()}</View>

              <Text style={styles.titleText}>{renderConfig?.title}</Text>
            </View>

            {/* Description */}
            {renderConfig?.description && (
              <Text style={styles.descriptionText}>{renderConfig.description}</Text>
            )}

            {/* Bullets */}
            {renderConfig?.bullets && renderConfig.bullets.length > 0 && (
              <View style={styles.bulletsContainer}>
                {renderConfig.bullets.map((bullet, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>

                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsContainer}>
              {actions.map((action, index) => (
                <View key={index} style={styles.actionButtonWrapper}>
                  <ModalButton
                    label={action.label}
                    variant={action.variant}
                    onPress={async () => {
                      hideModal();

                      if (action.onPress) {
                        await action.onPress();
                      }
                    }}
                    loading={action.loading}
                    disabled={action.disabled}
                  />
                </View>
              ))}

              {!renderConfig?.hideCancel && (
                <View style={styles.actionButtonWrapper}>
                  <ModalButton
                    label={renderConfig?.cancelText || 'Cancel'}
                    variant="ghost"
                    onPress={() => {
                      if (renderConfig?.onCancel) {
                        renderConfig.onCancel();
                      }

                      hideModal();
                    }}
                  />
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },

  backdropDarken: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },

  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: horizontalScale(24),
  },

  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: THEME.colors.card,
    borderRadius: 24,
    padding: horizontalScale(24),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },

  headerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
  },

  titleText: {
    color: THEME.colors.text,
    fontSize: responsiveFontSize(22),
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  descriptionText: {
    color: THEME.colors.textSecondary,
    fontSize: responsiveFontSize(15),
    lineHeight: responsiveFontSize(22),
    textAlign: 'left',
    width: '100%',
    marginBottom: verticalScale(20),
  },

  bulletsContainer: {
    width: '100%',
    marginBottom: verticalScale(24),
    backgroundColor: THEME.colors.input,
    padding: horizontalScale(16),
    borderRadius: 12,
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(10),
  },

  bulletDot: {
    color: THEME.colors.primary,
    fontSize: responsiveFontSize(16),
    marginRight: horizontalScale(8),
    lineHeight: responsiveFontSize(22),
  },

  bulletText: {
    color: THEME.colors.textSecondary,
    fontSize: responsiveFontSize(14),
    lineHeight: responsiveFontSize(20),
    flex: 1,
  },

  actionsContainer: {
    width: '100%',
    gap: verticalScale(12),
  },

  actionButtonWrapper: {
    width: '100%',
  },
});
