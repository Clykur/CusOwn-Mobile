import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { getPublicStorageUrl } from '@/services/supabase/storage';
import { logger, LogTag } from '@/utils/logger';

export const useProfileMedia = (userId?: string | null) => {
  return useQuery({
    queryKey: ['profileMedia', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('media')
        .select('bucket_name, storage_path')
        .eq('entity_type', 'profile')
        .eq('entity_id', userId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        logger.warn(
          LogTag.API,
          `[useProfileMedia] Failed to fetch media for user ${userId}`,
          error,
        );
        return null;
      }

      if (!data?.bucket_name || !data?.storage_path) {
        return null;
      }

      return getPublicStorageUrl(data.bucket_name, data.storage_path);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};
