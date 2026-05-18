import { PostgrestError } from '@supabase/supabase-js';
import { logger, LogTag } from '@/utils/logger';

export function isMissingColumnError(error: PostgrestError | null): boolean {
  if (!error) return false;
  return error.code === '42703' || /column .* does not exist/i.test(error.message || '');
}

export function logQueryFallback(
  label: string,
  reason: string,
  error?: PostgrestError | null,
): void {
  logger.warn(LogTag.API, `[${label}] ${reason}`, error?.message || error);
}
