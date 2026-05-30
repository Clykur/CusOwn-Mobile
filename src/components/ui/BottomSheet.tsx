import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { THEME } from '@/constants/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, children }) => {
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.colors : THEME.colors;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheetContainer, { backgroundColor: theme.card }]}>
          <View style={styles.handleBar} />
          <SafeAreaView style={styles.contentSafeArea}>
            <View style={styles.content}>{children}</View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 200,
    maxHeight: '85%',
    paddingTop: 12,
    shadowColor: THEME.colors.background,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  contentSafeArea: {
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
