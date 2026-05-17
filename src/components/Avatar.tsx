import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  url?: string | null;
  name?: string;
  size?: number;
  style?: any;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ url, name = '', size = 48, style, className }) => {
  const [hasError, setHasError] = useState(false);

  const getInitials = (str: string) => {
    const parts = str.trim().split(/\s+/);
    if (!parts.length || !parts[0]) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const radius = size / 2;

  const getHashColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#000000', '#1A1A1A', '#333333', '#4D4D4D', '#666666', '#808080'];
    return colors[Math.abs(hash) % colors.length];
  };

  const showFallback = !url || hasError;

  return (
    <View
      className={className}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: getHashColor(name || 'User'),
        },
        style,
      ]}
    >
      {showFallback ? (
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{getInitials(name)}</Text>
      ) : (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size, borderRadius: radius }}
          contentFit="cover"
          // On Android, cross-fade transition uses a hardware bitmap which crashes
          // when rendered inside a software-layer parent (e.g. BlurView). Disable it.
          transition={Platform.OS === 'android' ? 0 : 200}
          onError={() => setHasError(true)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
