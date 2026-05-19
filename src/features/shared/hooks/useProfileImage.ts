/**
 * Profile avatar upload via Supabase Storage + media table.
 */

import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { apiService } from '@/services/api.service';
import { resolveMediaPublicUrl } from '@/services/supabase/storage';

import { useAuthStore } from '@/store/auth.store';
import { logger, LogTag } from '@/utils/logger';

export const useProfileImage = () => {
  const [uploading, setUploading] = useState(false);
  const { refreshProfile } = useAuthStore();

  const pickAndUpload = async (): Promise<string | null> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to update your profile picture.',
        );
        return null;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    setUploading(true);

    try {
      const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
      const mimeType = asset.mimeType || `image/${ext}`;
      const filename = `profile.${ext}`;

      logger.info(LogTag.API, '[ProfileImage] Uploading via Supabase storage…');

      const uploadResult = await apiService.uploadProfileImage({
        uri: asset.uri,
        name: filename,
        type: mimeType,
      });

      const mediaId: string | null = uploadResult?.media?.id ?? null;
      if (!mediaId) {
        throw new Error('Upload succeeded but no media ID returned');
      }

      const { url: resolvedUrl } = await resolveMediaPublicUrl(mediaId);
      const avatarUrl: string | null = resolvedUrl ?? uploadResult?.url ?? null;

      await refreshProfile();
      return avatarUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      logger.error(LogTag.API, '[ProfileImage] Upload failed:', message);
      Alert.alert(
        'Upload Failed',
        message || 'Could not upload your profile picture. Please try again.',
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { pickAndUpload, uploading };
};
