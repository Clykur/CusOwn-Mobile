import { PostgrestError } from '@supabase/supabase-js';
import { logger, LogTag } from '@/utils/logger';

export function formatSupabaseError(error: unknown, fallback = 'Something went wrong'): string {
  if (!error) return fallback;
  if (error instanceof Error && error.message) return error.message;
  const pg = error as PostgrestError;
  if (pg.message) {
    if (pg.code === '42501' || pg.message.toLowerCase().includes('row-level security')) {
      return 'You do not have permission to access this data. Please sign in again or contact support.';
    }
    return pg.message;
  }
  return fallback;
}

export function logSupabaseFailure(
  label: string,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  logger.error(LogTag.API, `[${label}] ${formatSupabaseError(error)}`, {
    ...(context ?? {}),
    error,
  });
}
