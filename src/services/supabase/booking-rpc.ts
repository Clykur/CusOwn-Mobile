import { supabase } from '@/lib/supabase';
import { isRlsDenial, isRpcNotFound, logBookingDebug, logBookingError } from './booking-debug';
import { BookingSupabaseError } from './booking-errors';

/** Verified production RPC function names (PostgREST schema). */
export const BOOKING_RPC = {
  create: 'create_booking_atomically',
  createIdempotent: 'create_booking_idempotent_reserve',
  confirm: 'confirm_booking_atomically',
  reject: 'reject_booking_atomically',
  cancel: 'cancel_booking_atomically',
  reschedule: 'reschedule_booking',
  undoConfirm: 'undo_confirm_booking_atomically',
  undoReject: 'undo_reject_booking_atomically',
} as const;

export async function getActorUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.id) {
    throw new BookingSupabaseError('Not authenticated', error);
  }
  return user.id;
}

export async function invokeBookingRpc<T = unknown>(
  functionName: string,
  params: Record<string, unknown>,
): Promise<T> {
  logBookingDebug('RPC invoke', { functionName, keys: Object.keys(params) });

  const { data, error } = await supabase.rpc(functionName, params);

  if (error) {
    if (isRlsDenial(error)) {
      logBookingError('RLS denial', error, { functionName });
      throw new BookingSupabaseError('Permission denied', error, { functionName });
    }
    if (isRpcNotFound(error)) {
      throw new BookingSupabaseError(`RPC not found: ${functionName}`, error, { functionName });
    }
    logBookingError('RPC error', error, { functionName, params });
    throw new BookingSupabaseError(error.message || 'Booking RPC failed', error, { functionName });
  }

  return data as T;
}
