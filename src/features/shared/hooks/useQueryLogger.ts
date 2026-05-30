import { useEffect } from 'react';

import { formatSupabaseError } from '@/services/supabase/errors';
import { logger, LogTag } from '@/utils/logger';

/**
 * Logs React Query failures with a stable label (Metro / device debugging).
 */
export function useQueryLogger(
  label: string,
  state: { isError: boolean; error: unknown; isSuccess?: boolean; data?: unknown },
  context?: Record<string, unknown>,
): void {
  useEffect(() => {
    if (state.isError && state.error) {
      logger.error(LogTag.QUERY, `[${label}] ${formatSupabaseError(state.error)}`, {
        ...(context ?? {}),
        error: state.error,
      });
    }
    if (state.isSuccess && __DEV__ && Array.isArray(state.data)) {
      logger.info(LogTag.QUERY, `[${label}] ok count=${state.data.length}`);
    }
  }, [label, state.isError, state.error, state.isSuccess, state.data, context]);
}
