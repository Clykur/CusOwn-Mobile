import { Image } from 'expo-image';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

import type { StyleProp, ViewStyle } from 'react-native';
import BusinessIcon from '../../../assets/Business.svg';
import CustomerIcon from '../../../assets/Customer.svg';
import { useProfileMedia } from '@/hooks/useProfileMedia';
import { THEME } from '@/theme/theme';

interface AvatarProps {
  url?: string | null;
  userId?: string | null;
  name?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  type?: 'customer' | 'business' | 'default';
}

const AvatarBase: React.FC<AvatarProps> = ({
  url,
  userId,
  name = '',
  size = 48,
  style,
  className,
  type = 'default',
}) => {
  const [hasError, setHasError] = useState(false);

  const radius = size / 2;

  const getInitials = (str: string) => {
    const parts = str.trim().split(/\s+/);

    if (!parts.length || !parts[0]) return 'U';

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        },
        style,
      ]}
    >
      {showFallback ? (
        type === 'customer' ? (
          <CustomerIcon width={size * 0.6} height={size * 0.6} color={THEME.colors.primary} />
        ) : type === 'business' ? (
          <BusinessIcon width={size * 0.6} height={size * 0.6} color={THEME.colors.primary} />
        ) : (
          <Text
            style={[
              styles.initials,
              {
                fontSize: size * 0.4,
              },
            ]}
          >
            {getInitials(name)}
          </Text>
        )
      ) : (
        <Image
          source={{ uri: resolvedUrl }}
          style={[
            {
              width: size,
              height: size,
              borderRadius: radius,
            },
          ]}
          contentFit="cover"
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

export const Avatar = React.memo(AvatarBase);
