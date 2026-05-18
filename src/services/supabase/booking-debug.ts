import { logger, LogTag } from '@/utils/logger';

/** Temporary Phase 2 diagnostics — remove or gate behind __DEV__ when stable. */
export function logBookingDebug(message: string, context?: Record<string, unknown>): void {
  logger.info(LogTag.API, `[BOOKING-SB] ${message}`, context ?? {});
}

export function logBookingError(
  message: string,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  logger.error(LogTag.API, `[BOOKING-SB] ${message}`, {
    ...(context ?? {}),
    error: error instanceof Error ? error.message : error,
  });
}

export function isRlsDenial(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === '42501' ||
    error.message?.toLowerCase().includes('row-level security') === true ||
    error.message?.toLowerCase().includes('permission denied') === true
  );
}

export function isRpcNotFound(
  error: { code?: string; message?: string; details?: string } | null,
): boolean {
  if (!error) return false;
  const msg = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  return (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    (msg.includes('function') && msg.includes('does not exist')) ||
    msg.includes('could not find the function')
  );
}
