import { THEME } from '@/theme/theme';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useProfileMedia } from '@/hooks/useProfileMedia';

interface AvatarProps {
  url?: string | null;
  userId?: string | null;
  name?: string;
  size?: number;
  style?: any;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  url,
  userId,
  name = '',
  size = 48,
  style,
  className,
}) => {
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
    const colors = [
      THEME.colors.background,
      THEME.colors.border,
      THEME.colors.card,
      THEME.colors.border,
      THEME.colors.textSecondary,
      THEME.colors.textSecondary,
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const { data: mediaUrl } = useProfileMedia(userId);
  const resolvedUrl = mediaUrl || url;

  const showFallback =
    !resolvedUrl || resolvedUrl === 'undefined' || resolvedUrl === 'null' || hasError;

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
          source={{ uri: resolvedUrl! }}
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
    color: THEME.colors.text,
    fontWeight: '700',
  },
});
