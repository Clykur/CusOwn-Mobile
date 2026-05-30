import { useQuery } from '@tanstack/react-query';
import { getUserProfileMedia } from '@/services/supabase/storage';
import { logger, LogTag } from '@/utils/logger';

export const useProfileMedia = (userId?: string | null) => {
  return useQuery({
    queryKey: ['profileMedia', userId],
    queryFn: async () => {
      if (!userId) return null;

      try {
        return await getUserProfileMedia(userId);
      } catch (error) {
        logger.warn(
          LogTag.API,
          `[useProfileMedia] Failed to fetch media for user ${userId}`,
          error,
        );
        return null;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};
