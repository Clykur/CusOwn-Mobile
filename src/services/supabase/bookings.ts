import { supabase } from '@/lib/supabase';
import { Booking, BookingStatus, CreateBookingPayload } from '@/types/booking.types';
import { Business } from '@/types/business.types';
import { enrichBusinessesWithImages, mapBooking } from './mappers';
import { isRlsDenial, logBookingDebug, logBookingError } from './booking-debug';
import { BookingSupabaseError } from './booking-errors';

export { BookingSupabaseError } from './booking-errors';
import { BOOKING_RPC, getActorUserId, invokeBookingRpc } from './booking-rpc';
import { resolveSlotIdForBooking } from './slots';
import { listOwnedBusinessIds } from './owner-access';
import { logSupabaseFailure } from './errors';

/** List views — avoid booking_services embed (often blocked or heavy). */
const BOOKING_LIST_SELECT = `
  *,
  business:businesses(*),
  service:services(*),
  slot:slots(*)
`;

const BOOKING_DETAIL_SELECT = `
  *,
  business:businesses(*),
  service:services(*),
  slot:slots(*),
  booking_services(
    price_cents,
    service:services(*)
  )
`;

function generatePublicBookingId(): string {
  return `BK-${Math.floor(10000 + Math.random() * 90000)}`;
}

async function fetchBookingRow(bookingId: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_DETAIL_SELECT)
    .eq('id', bookingId)
    .single();

  if (!error && data) {
    return data as Record<string, unknown>;
  }

  logBookingDebug('BOOKING_SELECT failed, retrying minimal select', {
    bookingId,
    code: error?.code,
  });

  const fallback = await supabase
    .from('bookings')
    .select('*, business:businesses(*), service:services(*), slot:slots(*)')
    .eq('id', bookingId)
    .single();

  if (fallback.error) {
    if (isRlsDenial(fallback.error)) {
      logBookingError('RLS denial loading booking', fallback.error, { bookingId });
    }
    throw new BookingSupabaseError('Failed to load booking', fallback.error, { bookingId });
  }
  return fallback.data as Record<string, unknown>;
}

function resolveUuidFromRpcResult(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null;
  const r = result as Record<string, unknown>;
  const id = r.id ?? r.booking_uuid ?? (r.booking as Record<string, unknown> | undefined)?.id;
  return typeof id === 'string' ? id : null;
}

async function mapAndEnrichBooking(row: Record<string, unknown>): Promise<Booking> {
  const mapped = mapBooking(row);
  if (mapped.business) {
    await enrichBusinessesWithImages([mapped.business]);
  }
  return mapped;
}

async function mapAndEnrichMany(rows: Record<string, unknown>[]): Promise<Booking[]> {
  const mapped = rows.map((r) => mapBooking(r));
  const businesses = mapped.map((b) => b.business).filter(Boolean) as Business[];
  if (businesses.length > 0) {
    await enrichBusinessesWithImages(businesses);
  }
  return mapped;
}

const BOOKING_LIST_SELECT_ATTEMPTS = [
  BOOKING_LIST_SELECT,
  '*, business:businesses(*), service:services(*), slot:slots(*)',
  '*',
];

async function fetchBookingsForCustomer(
  userId: string,
  customerColumn: 'customer_user_id' | 'customer_id',
) {
  let lastError: unknown;
  for (const sel of BOOKING_LIST_SELECT_ATTEMPTS) {
    const { data, error } = await supabase
      .from('bookings')
      .select(sel)
      .eq(customerColumn, userId)
      .order('created_at', { ascending: false });
    if (!error) {
      return (data || []) as unknown as Record<string, unknown>[];
    }
    lastError = error;
    logBookingDebug('listCustomerBookings select fallback', {
      customerColumn,
      code: error.code,
      message: error.message,
    });
  }
  throw lastError;
}

export async function listCustomerBookings(userId: string): Promise<Booking[]> {
  try {
    const rows = await fetchBookingsForCustomer(userId, 'customer_user_id');
    return mapAndEnrichMany(rows);
  } catch (firstErr) {
    logBookingDebug('listCustomerBookings retry customer_id column', {
      message: firstErr instanceof Error ? firstErr.message : String(firstErr),
    });
    try {
      const rows = await fetchBookingsForCustomer(userId, 'customer_id');
      return mapAndEnrichMany(rows);
    } catch (err) {
      logBookingError('listCustomerBookings failed', err, { userId });
      throw err;
    }
  }
}

export async function listOwnerBookings(
  ownerUserId: string,
  businessId?: string,
): Promise<Booking[]> {
  let ids = await listOwnedBusinessIds(ownerUserId);
  if (businessId && businessId !== 'all') {
    ids = ids.filter((id) => id === businessId);
  }
  if (ids.length === 0) return [];

  let lastError: unknown;
  for (const sel of BOOKING_LIST_SELECT_ATTEMPTS) {
    const { data, error } = await supabase
      .from('bookings')
      .select(sel)
      .in('business_id', ids)
      .order('created_at', { ascending: false });
    if (!error) {
      return mapAndEnrichMany((data || []) as unknown as Record<string, unknown>[]);
    }
    lastError = error;
    logBookingDebug('listOwnerBookings select fallback', {
      code: error.code,
      message: error.message,
    });
  }
  logSupabaseFailure('listOwnerBookings', lastError, { ownerUserId, businessId });
  throw lastError;
}

export async function listBookings(
  role: 'Customer' | 'Owner',
  userId?: string,
  businessId?: string,
): Promise<Booking[]> {
  const uid = userId ?? (await getActorUserId());
  return role === 'Customer' ? listCustomerBookings(uid) : listOwnerBookings(uid, businessId);
}

export async function getBookingById(id: string): Promise<Booking> {
  const row = await fetchBookingRow(id);
  return mapAndEnrichBooking(row);
}

export type MobileCreateBookingInput = Omit<CreateBookingPayload, 'service_id'> & {
  service_id: string | string[];
  customer_user_id?: string;
  customer_name?: string;
  customer_phone?: string;
  salon_id?: string;
  idempotency_key?: string;
  /** Required when slot_id is a gen-slot placeholder */
  time?: string;
};

async function buildCreateRpcParams(input: MobileCreateBookingInput, userId: string) {
  const businessId = input.business_id || input.salon_id;
  if (!businessId) {
    throw new BookingSupabaseError('business_id is required');
  }

  const slotId = await resolveSlotIdForBooking({
    businessId,
    date: input.date,
    time: input.time || '',
    hintSlotId: input.slot_id,
  });

  const serviceIds = Array.isArray(input.service_id)
    ? input.service_id
    : [input.service_id].filter(Boolean);
  if (serviceIds.length === 0) {
    throw new BookingSupabaseError('At least one service is required');
  }

  const { data: serviceRows, error: svcErr } = await supabase
    .from('services')
    .select('id, price_cents, duration_minutes, name')
    .in('id', serviceIds)
    .eq('business_id', businessId);

  if (svcErr) throw svcErr;

  const rows = serviceRows || [];
  if (rows.length === 0) {
    throw new BookingSupabaseError(
      'Could not load selected services. Check that services are active and try again.',
    );
  }
  const total_price_cents = rows.reduce((sum, s) => sum + Number(s.price_cents || 0), 0);
  const total_duration_minutes = rows.reduce((sum, s) => sum + Number(s.duration_minutes || 30), 0);
  const p_service_data = rows.map((s) => ({
    service_id: s.id,
    price_cents: s.price_cents,
    name: s.name,
  }));

  const p_booking_id = generatePublicBookingId();
  const base = {
    p_business_id: businessId,
    p_slot_id: slotId,
    p_customer_name: input.customer_name || 'Guest',
    p_customer_phone: input.customer_phone || '',
    p_booking_id,
    p_customer_user_id: userId,
    p_service_data,
    p_services_count: serviceIds.length,
    p_total_duration_minutes: total_duration_minutes,
    p_total_price_cents: total_price_cents || Math.round((input.price || 0) * 100),
  };

  const idempotencyKey =
    input.idempotency_key || `mob-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  return {
    idempotent: {
      ...base,
      p_key: idempotencyKey,
      p_ttl_hours: 24,
    },
    atomic: {
      ...base,
      p_idempotency_key: idempotencyKey,
    },
    displayBookingId: p_booking_id,
  };
}

export async function createBooking(input: MobileCreateBookingInput): Promise<Booking> {
  const userId = input.customer_user_id ?? (await getActorUserId());
  const { idempotent, atomic } = await buildCreateRpcParams(input, userId);

  let rpcResult: unknown;
  try {
    rpcResult = await invokeBookingRpc(BOOKING_RPC.createIdempotent, idempotent);
  } catch (firstErr) {
    logBookingDebug('create_booking_idempotent_reserve failed, trying create_booking_atomically', {
      message: firstErr instanceof Error ? firstErr.message : String(firstErr),
    });
    rpcResult = await invokeBookingRpc(BOOKING_RPC.create, atomic);
  }

  const uuid = resolveUuidFromRpcResult(rpcResult);
  if (uuid) {
    return getBookingById(uuid);
  }
  if (rpcResult && typeof rpcResult === 'object') {
    return mapAndEnrichBooking(rpcResult as Record<string, unknown>);
  }
  throw new BookingSupabaseError('create booking RPC returned no booking row');
}

export async function acceptBooking(bookingId: string): Promise<Booking> {
  const actorId = await getActorUserId();
  await invokeBookingRpc(BOOKING_RPC.confirm, {
    p_booking_id: bookingId,
    p_actor_id: actorId,
  });
  return getBookingById(bookingId);
}

export async function rejectBooking(bookingId: string): Promise<Booking> {
  const actorId = await getActorUserId();
  await invokeBookingRpc(BOOKING_RPC.reject, {
    p_booking_id: bookingId,
    p_actor_id: actorId,
  });
  return getBookingById(bookingId);
}

export async function undoAcceptBooking(bookingId: string): Promise<Booking> {
  const actorId = await getActorUserId();
  await invokeBookingRpc(BOOKING_RPC.undoConfirm, {
    p_booking_id: bookingId,
    p_actor_id: actorId,
  });
  return getBookingById(bookingId);
}

export async function undoRejectBooking(bookingId: string): Promise<Booking> {
  const actorId = await getActorUserId();
  await invokeBookingRpc(BOOKING_RPC.undoReject, {
    p_booking_id: bookingId,
    p_actor_id: actorId,
  });
  return getBookingById(bookingId);
}

export async function markBookingNoShow(bookingId: string): Promise<Booking> {
  const actorId = await getActorUserId();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('bookings')
    .update({
      no_show: true,
      no_show_marked_at: now,
      no_show_marked_by: actorId,
      status: 'no_show',
      updated_at: now,
    })
    .eq('id', bookingId)
    .select(BOOKING_DETAIL_SELECT)
    .single();

  if (error) {
    logBookingError('markBookingNoShow update failed', error, { bookingId });
    throw new BookingSupabaseError('Failed to mark no-show', error, { bookingId });
  }
  return mapAndEnrichBooking(data as Record<string, unknown>);
}

export async function cancelBooking(
  bookingId: string,
  reason?: string,
  cancelledBy: 'customer' | 'owner' = 'customer',
): Promise<Booking> {
  await invokeBookingRpc(BOOKING_RPC.cancel, {
    p_booking_id: bookingId,
    p_cancelled_by: cancelledBy,
    p_cancellation_reason: reason || '',
  });
  return getBookingById(bookingId);
}

export async function rescheduleBooking(
  bookingId: string,
  payload: {
    business_id?: string;
    salon_id?: string;
    slot_id?: string | null;
    new_slot_id?: string;
    service_id?: string | string[];
    service_ids?: string[];
    date?: string;
    customer_name?: string;
    customer_phone?: string;
    reason?: string;
    rescheduled_by?: 'customer' | 'owner';
  },
): Promise<Booking> {
  const slotId = payload.new_slot_id ?? payload.slot_id;
  if (!slotId) {
    throw new BookingSupabaseError('p_new_slot_id is required for reschedule');
  }

  await invokeBookingRpc(BOOKING_RPC.reschedule, {
    p_booking_id: bookingId,
    p_new_slot_id: slotId,
    p_rescheduled_by: payload.rescheduled_by ?? 'customer',
    p_reschedule_reason: payload.reason || '',
  });
  return getBookingById(bookingId);
}

export async function patchBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select(BOOKING_DETAIL_SELECT)
    .single();

  if (error) {
    logBookingError('patchBookingStatus failed', error, { bookingId, status });
    if (isRlsDenial(error)) {
      throw new BookingSupabaseError('Permission denied updating booking status', error);
    }
    throw error;
  }
  return mapAndEnrichBooking(data as Record<string, unknown>);
}
