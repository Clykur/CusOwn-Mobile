import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { logger, LogTag } from '@/utils/logger';
import type { NotificationType } from '@/types/notification.types';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CustomerNotificationType, OwnerNotificationType } from '@/types/notification.types';

export interface NotificationLog {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  payload: Record<string, unknown>;
  status: string;
  provider_response: Record<string, unknown> | null;
  created_at: string;
  opened_at: string | null;
  category?: string;
  deep_link?: string;
  title?: string;
  body?: string;
}

const PAGE_SIZE = 20;

export function useNotifications() {
  const { user, role } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['notifications', user?.id, role],
      initialPageParam: 0,
      queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
        if (!user?.id || !role) return [];

        let query = supabase.from('notification_logs').select('*').eq('user_id', user.id);

        // Filter by role
        if (role === 'Owner') {
          query = query.in('notification_type', Object.values(OwnerNotificationType));
        } else {
          query = query.in('notification_type', Object.values(CustomerNotificationType));
        }

        const { data: logs, error } = await query
          .order('created_at', { ascending: false })
          .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

        if (error) {
          logger.error(LogTag.DB, 'Error fetching notifications', error);
          throw error;
        }

        return logs as NotificationLog[];
      },
      getNextPageParam: (lastPage: NotificationLog[], allPages: NotificationLog[][]) => {
        if (lastPage.length < PAGE_SIZE) return undefined;
        return allPages.length;
      },
      enabled: !!user?.id,
    });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notification_logs')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', notificationId)
        .is('opened_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('notification_logs')
        .update({ opened_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('opened_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const notifications: NotificationLog[] = data?.pages.flat() || [];

  return {
    notifications,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
}
