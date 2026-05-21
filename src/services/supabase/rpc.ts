import { supabase } from '@/lib/supabase';
import { BookingSupabaseError } from './booking-errors';
import { isRlsDenial, isRpcNotFound, logBookingDebug, logBookingError } from './booking-debug';
import { RpcResponse } from './types';

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
  markNoShow: 'mark_booking_no_show_atomically',
} as const;

export async function getActorUserId(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.user?.id) {
    throw new BookingSupabaseError('Not authenticated', error);
  }
  return session.user.id;
}

export async function invokeRpc<T = unknown>(
  functionName: string,
  params: Record<string, unknown>,
): Promise<RpcResponse<T>> {
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

  const response = data as RpcResponse<T>;
  if (response && typeof response === 'object' && response.success === false) {
    throw new BookingSupabaseError(response.error || `${functionName} failed on backend`);
  }

  return response;
}
