/**
 * useProfileImage
 *
 * Integrates with the existing CusOwn backend media pipeline:
 *   POST /api/media/profile  ← same endpoint the web app uses
 *   GET  /api/media/signed-url?mediaId=...  ← get the display URL
 *
 * The backend handles: EXIF stripping, content-hash dedup, Supabase storage,
 * profile_media_id linking, and audit logging — exactly like the web app.
 */

import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { logger, LogTag } from '@/utils/logger';

export const useProfileImage = () => {
  const [uploading, setUploading] = useState(false);
  const { refreshProfile } = useAuthStore();

  /**
   * Open image picker, upload via backend media pipeline, refresh auth store.
   * Returns the signed URL to display, or null on cancel/error.
   */
  const pickAndUpload = async (): Promise<string | null> => {
    // 1. Request permissions (Android / iOS)
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to update your profile picture.'
        );
        return null;
      }
    }

    // 2. Launch image picker — square crop
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
      // 3. Build a FormData blob – React Native supports this natively
      const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
      const mimeType = asset.mimeType || `image/${ext}`;
      const filename = `profile.${ext}`;

      const formData = new FormData();
      // React Native's FormData accepts { uri, name, type } as the file value
      formData.append('file', {
        uri: asset.uri,
        name: filename,
        type: mimeType,
      } as any);

      // 4. POST to the same backend endpoint the web app uses
      //    The backend does: magic-byte check, EXIF strip, dedup, Supabase upload,
      //    profile_media_id update, audit log.
      logger.info(LogTag.API, '[ProfileImage] Uploading via /api/media/profile…');

      const uploadResult = await apiClient.post<any>('/media/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const mediaId: string | null = uploadResult?.media?.id ?? null;

      if (!mediaId) {
        throw new Error('Upload succeeded but no media ID returned');
      }

      logger.info(LogTag.API, `[ProfileImage] Got mediaId: ${mediaId}`);

      // 5. Fetch the signed URL (same as web uses for display)
      const signedResult = await apiClient.get<any>(`/media/signed-url`, {
        params: { mediaId },
      });

      const signedUrl: string | null = signedResult?.url ?? null;

      logger.info(LogTag.API, `[ProfileImage] Signed URL obtained: ${!!signedUrl}`);

      // 6. Refresh the auth store profile so profile_media_id + avatar propagates
      //    to the header avatar, dashboard, and all other screens.
      await refreshProfile();

      return signedUrl;
    } catch (err: any) {
      logger.error(LogTag.API, '[ProfileImage] Upload failed:', err.message);
      Alert.alert(
        'Upload Failed',
        err.message || 'Could not upload your profile picture. Please try again.'
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { pickAndUpload, uploading };
};
