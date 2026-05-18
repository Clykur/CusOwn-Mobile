import { logger, LogTag } from '@/utils/logger';

export function logStorageDebug(message: string, context?: Record<string, unknown>): void {
  logger.info(LogTag.API, `[STORAGE-SB] ${message}`, context ?? {});
}

export function logStorageError(
  message: string,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  logger.error(LogTag.API, `[STORAGE-SB] ${message}`, {
    ...(context ?? {}),
    error: error instanceof Error ? error.message : error,
  });
}

export function isStorageRlsError(
  error: { message?: string; statusCode?: string } | null,
): boolean {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  return (
    msg.includes('row-level security') || msg.includes('permission') || error.statusCode === '403'
  );
}
