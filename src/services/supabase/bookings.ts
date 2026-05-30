import { supabase } from '@/lib/supabase';
import { Booking, BookingStatus, CreateBookingPayload } from '@/types/booking.types';
import { Business } from '@/types/business.types';
import { enrichBusinessesWithImages, mapBooking } from './mappers';
import { isRlsDenial, logBookingDebug, logBookingError } from './booking-debug';
import { BookingSupabaseError } from './booking-errors';
import { parseTimeToMinutes } from '@/utils/time';
import { logger, LogTag } from '@/utils/logger';

export { BookingSupabaseError } from './booking-errors';
import { BOOKING_RPC, getActorUserId, invokeRpc } from './rpc';
import { resolveSlotIdForBooking } from './slots';
import { listOwnedBusinessIds } from './owner-access';
import { logSupabaseFailure } from './errors';
import { businessHoursService } from './business-hours';

/** List views — fetch business, slot, and booking_services to map service names. */
const BOOKING_LIST_SELECT = `
  *,
  business:businesses(*),
  slot:slots(*),
  booking_services(
    price_cents,
    service:services(*)
  )
`;

const BOOKING_DETAIL_SELECT = `
  *,
  business:businesses(*),
  slot:slots(*),
  booking_services(
    price_cents,
    service:services(*)
  )
`;

function generatePublicBookingId(): string {
  return `CUSOWN-${Math.floor(10000 + Math.random() * 90000)}`;
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
    .select('*, business:businesses(*), slot:slots(*)')
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
  if (!result) return null;
  const target = Array.isArray(result) ? result[0] : result;
  if (!target || typeof target !== 'object') return null;
  const r = target as Record<string, unknown>;
  const id =
    r.booking_id ??
    r.id ??
    r.booking_uuid ??
    (r.booking as Record<string, unknown> | undefined)?.id;
  return typeof id === 'string' ? id : null;
}

async function enrichBookingsWithServices(bookings: Booking[]): Promise<void> {
  const emptyServiceBookings = bookings.filter((b) => !b.services || b.services.length === 0);
  if (emptyServiceBookings.length === 0) return;

  const businessIds = [...new Set(emptyServiceBookings.map((b) => b.business_id).filter(Boolean))];
  if (businessIds.length === 0) return;

  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .in('business_id', businessIds);

    if (error) {
      logBookingError('enrichBookingsWithServices failed to fetch services', error);
      return;
    }

    const servicesByBusiness: Record<string, Record<string, unknown>[]> = {};
    services?.forEach((s) => {
      if (!servicesByBusiness[s.business_id]) {
        servicesByBusiness[s.business_id] = [];
      }
      servicesByBusiness[s.business_id].push(s);
    });

    for (const b of emptyServiceBookings) {
      const bizServices = servicesByBusiness[b.business_id] || [];
      const totalPriceCents = b.total_price_cents ?? (b.price ? Math.round(b.price * 100) : null);
      const totalDuration = b.total_duration_minutes;

      let matchedService = null;
      if (bizServices.length > 0) {
        // 1. Match by price and duration
        if (totalPriceCents !== null && totalDuration !== null) {
          matchedService = bizServices.find(
            (s) => s.price_cents === totalPriceCents && s.duration_minutes === totalDuration,
          );
        }
        // 2. Match by price only
        if (!matchedService && totalPriceCents !== null) {
          matchedService = bizServices.find((s) => s.price_cents === totalPriceCents);
        }
        // 3. Fallback to first active service
        if (!matchedService) {
          const active = bizServices.filter((s) => s.is_active);
          matchedService = active[0] || bizServices[0];
        }
      }

      if (matchedService) {
        b.services = [
          {
            id: String(matchedService.id ?? ''),
            name: String(matchedService.name ?? ''),
            price: Number(matchedService.price_cents ?? 0) / 100,
            duration: Number(totalDuration ?? matchedService.duration_minutes ?? 30),
            business_id: String(b.business_id),
          },
        ];
        b.service = {
          id: String(matchedService.id ?? ''),
          name: String(matchedService.name ?? ''),
          price: b.price || Number(matchedService.price_cents ?? 0) / 100,
          duration: Number(totalDuration ?? matchedService.duration_minutes ?? 30),
          business_id: String(b.business_id),
        };
      } else {
        const fallbackName = b.business?.salon_name
          ? `${b.business.salon_name} Session`
          : 'Curated Session';
        b.services = [
          {
            id: '',
            name: fallbackName,
            price: b.price || 0,
            duration: Number(totalDuration ?? 30),
            business_id: String(b.business_id),
          },
        ];
        b.service = {
          id: '',
          name: fallbackName,
          price: b.price || 0,
          duration: Number(totalDuration ?? 30),
          business_id: String(b.business_id),
        };
      }
    }
  } catch (err) {
    logBookingError('enrichBookingsWithServices exception', err);
  }
}

function isBookingTimePassed(booking: Booking): boolean {
  if (!booking.date || !booking.time) return false;

  // Clean date YYYY-MM-DD
  const datePart = String(booking.date).split(/[T ]/)[0];
  if (!datePart) return false;

  // Parse time minutes
  const timeMinutes = parseTimeToMinutes(booking.time);
  if (timeMinutes === null) return false;

  const parts = datePart.split('-');
  if (parts.length !== 3) return false;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

  // Create Date at that day with 0 hours, then add minutes
  const appointmentDate = new Date(year, month, day);
  appointmentDate.setMinutes(appointmentDate.getMinutes() + timeMinutes);

  return appointmentDate.getTime() < Date.now();
}

async function checkAndAutoCancelPendingBookings(bookings: Booking[]): Promise<Booking[]> {
  const processedBookings = [...bookings];
  const promises = processedBookings.map(async (booking, index) => {
    if (booking.status === 'pending' && isBookingTimePassed(booking)) {
      try {
        await invokeRpc(BOOKING_RPC.cancel, {
          p_booking_id: booking.id,
          p_cancelled_by: 'system',
          p_cancellation_reason: 'Auto-cancelled: appointment time passed without action.',
        });

        // Update local memory ONLY on success
        processedBookings[index] = {
          ...booking,
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        };

        logger.info(
          LogTag.API,
          `[AutoCancel] Booking ${booking.id} auto-cancelled because booking time passed.`,
        );
      } catch (err) {
        logger.error(LogTag.API, `[AutoCancel] Failed to auto-cancel booking ${booking.id}`, err);
      }
    }
  });

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  return processedBookings;
}

async function mapAndEnrichBooking(row: Record<string, unknown>): Promise<Booking> {
  const mapped = mapBooking(row);
  if (mapped.business) {
    if (mapped.business.deleted_at != null || mapped.business.suspended === true) {
      throw new BookingSupabaseError('This business is no longer available.');
    }
    await enrichBusinessesWithImages([mapped.business]);
  }
  await enrichBookingsWithServices([mapped]);
  const autoCancelled = await checkAndAutoCancelPendingBookings([mapped]);
  return autoCancelled[0];
}

async function mapAndEnrichMany(rows: Record<string, unknown>[]): Promise<Booking[]> {
  const validRows = rows.filter((r) => {
    const biz = r.business as Record<string, unknown> | undefined;
    if (biz && (biz.deleted_at != null || biz.suspended === true)) return false;
    return true;
  });
  const mapped = validRows.map((r) => mapBooking(r));
  const businesses = mapped.map((b) => b.business).filter(Boolean) as Business[];
  if (businesses.length > 0) {
    await enrichBusinessesWithImages(businesses);
  }
  await enrichBookingsWithServices(mapped);
  return checkAndAutoCancelPendingBookings(mapped);
}

const BOOKING_LIST_SELECT_ATTEMPTS = [
  BOOKING_LIST_SELECT,
  '*, business:businesses(*), slot:slots(*), booking_services(price_cents, service:services(*))',
  '*, business:businesses(*), slot:slots(*)',
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

export async function runLazyExpireIfNeeded(): Promise<void> {
  try {
    await supabase.rpc('expire_pending_bookings_atomically', {
      p_expiry_hours: 24,
    });
  } catch (err) {
    logger.error(LogTag.API, 'Failed to run lazy expire:', err);
  }
}

export async function createBooking(input: MobileCreateBookingInput): Promise<Booking> {
  await runLazyExpireIfNeeded();

  const userId = input.customer_user_id ?? (await getActorUserId());
  const { idempotent, atomic } = await buildCreateRpcParams(input, userId);

  // Validate business hours for the slot
  const slotId = atomic.p_slot_id;
  const businessId = atomic.p_business_id;
  if (slotId && businessId) {
    const { data: slotRow } = await supabase
      .from('slots')
      .select('date, start_time, end_time')
      .eq('id', slotId)
      .maybeSingle();

    if (slotRow) {
      const slotValidation = await businessHoursService.validateSlot(
        businessId,
        slotRow.date,
        slotRow.start_time,
        slotRow.end_time,
      );
      if (!slotValidation.valid) {
        throw new BookingSupabaseError(
          slotValidation.reason || 'Selected slot is outside business hours.',
        );
      }
    }
  }

  let rpcResult: unknown;
  try {
    rpcResult = await invokeRpc(BOOKING_RPC.createIdempotent, idempotent);
  } catch (firstErr) {
    logBookingDebug('create_booking_idempotent_reserve failed, trying create_booking_atomically', {
      message: firstErr instanceof Error ? firstErr.message : String(firstErr),
    });
    rpcResult = await invokeRpc(BOOKING_RPC.create, atomic);
  }

  // Check if result returned success: false
  if (rpcResult && typeof rpcResult === 'object') {
    const target = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
    if (target && target.success === false) {
      throw new BookingSupabaseError(target.error || 'Booking creation failed');
    }
  }

  const uuid = resolveUuidFromRpcResult(rpcResult);
  if (uuid) {
    return getBookingById(uuid);
  }
  if (rpcResult && typeof rpcResult === 'object') {
    const target = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
    return mapAndEnrichBooking(target as Record<string, unknown>);
  }
  throw new BookingSupabaseError('create booking RPC returned no booking row');
}

export async function confirmBooking(bookingId: string): Promise<Booking> {
  const actorId = await getActorUserId();
  const result = await invokeRpc<Record<string, unknown>>(BOOKING_RPC.confirm, {
    p_booking_id: bookingId,
    p_actor_id: actorId,
  });
  if (result && typeof result === 'object' && result.success === false) {
    throw new BookingSupabaseError(result.error || 'Failed to confirm booking');
  }
  return getBookingById(bookingId);
}

export async function rejectBooking(bookingId: string): Promise<Booking> {
  const actorId = await getActorUserId();
  const result = await invokeRpc<Record<string, unknown>>(BOOKING_RPC.reject, {
    p_booking_id: bookingId,
    p_actor_id: actorId,
  });
  if (result && typeof result === 'object' && result.success === false) {
    throw new BookingSupabaseError(result.error || 'Failed to reject booking');
  }
  return getBookingById(bookingId);
}

export async function undoConfirm(bookingId: string): Promise<Booking> {
  const actorId = await getActorUserId();
  const result = await invokeRpc<Record<string, unknown>>(BOOKING_RPC.undoConfirm, {
    p_booking_id: bookingId,
    p_actor_id: actorId,
  });
  if (result && typeof result === 'object' && result.success === false) {
    throw new BookingSupabaseError(result.error || 'Failed to undo confirm booking');
  }
  return getBookingById(bookingId);
}

export async function undoReject(bookingId: string): Promise<Booking> {
  const actorId = await getActorUserId();
  const result = await invokeRpc<Record<string, unknown>>(BOOKING_RPC.undoReject, {
    p_booking_id: bookingId,
    p_actor_id: actorId,
  });
  if (result && typeof result === 'object' && result.success === false) {
    throw new BookingSupabaseError(result.error || 'Failed to undo reject booking');
  }
  return getBookingById(bookingId);
}

export async function markBookingNoShow(bookingId: string): Promise<Booking> {
  const actorId = await getActorUserId();
  const result = await invokeRpc<Record<string, unknown>>(BOOKING_RPC.markNoShow, {
    p_booking_id: bookingId,
    p_actor_id: actorId,
  });

  if (result && typeof result === 'object' && result.success === false) {
    throw new BookingSupabaseError(result.error || 'Failed to mark no-show');
  }

  return getBookingById(bookingId);
}

export async function cancelBooking(
  bookingId: string,
  reason?: string,
  cancelledBy: 'customer' | 'owner' = 'customer',
): Promise<Booking> {
  const result = await invokeRpc<Record<string, unknown>>(BOOKING_RPC.cancel, {
    p_booking_id: bookingId,
    p_cancelled_by: cancelledBy,
    p_cancellation_reason: reason || '',
    // 0 = no minimum window; late_cancellation flag is still computed by the RPC
    p_default_cancellation_window_minutes: 0,
  });
  if (result && typeof result === 'object' && result.success === false) {
    throw new BookingSupabaseError(result.error || 'Failed to cancel booking');
  }
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
    time?: string;
    customer_name?: string;
    customer_phone?: string;
    reason?: string;
    rescheduled_by?: 'customer' | 'owner';
  },
): Promise<Booking> {
  await runLazyExpireIfNeeded();

  const rawSlotId = payload.new_slot_id ?? payload.slot_id;

  let slotId: string;
  if (!rawSlotId || String(rawSlotId).startsWith('gen-slot-')) {
    const businessId = payload.business_id || payload.salon_id;
    if (!businessId) {
      throw new BookingSupabaseError('business_id is required to resolve slots for reschedule');
    }
    if (!payload.date) {
      throw new BookingSupabaseError('date is required to resolve slots for reschedule');
    }
    slotId = await resolveSlotIdForBooking({
      businessId,
      date: payload.date,
      time: payload.time || '',
      hintSlotId: rawSlotId,
    });
  } else {
    slotId = String(rawSlotId);
  }

  // Validate business hours for the reschedule target slot
  const businessId = payload.business_id || payload.salon_id;
  if (slotId && businessId) {
    const { data: slotRow } = await supabase
      .from('slots')
      .select('date, start_time, end_time')
      .eq('id', slotId)
      .maybeSingle();

    if (slotRow) {
      const slotValidation = await businessHoursService.validateSlot(
        businessId,
        slotRow.date,
        slotRow.start_time,
        slotRow.end_time,
      );
      if (!slotValidation.valid) {
        throw new BookingSupabaseError(
          slotValidation.reason || 'Selected slot is outside business hours.',
        );
      }
    }
  }

  const result = await invokeRpc<Record<string, unknown>>(BOOKING_RPC.reschedule, {
    p_booking_id: bookingId,
    p_new_slot_id: slotId,
    p_rescheduled_by: payload.rescheduled_by ?? 'customer',
    p_reschedule_reason: payload.reason || '',
  });

  if (result && typeof result === 'object' && result.success === false) {
    throw new BookingSupabaseError(result.error || 'Failed to reschedule booking');
  }

  return getBookingById(bookingId);
}

export function subscribeToBookings(
  userId: string,
  role: 'Customer' | 'Owner',
  onUpdate: (payload: { new?: Record<string, unknown> }) => void,
) {
  const channelId = `bookings-${role}-${userId}-${Math.random().toString(36).substr(2, 6)}`;
  const filterOptions = {
    event: '*' as const,
    schema: 'public',
    table: 'bookings',
    ...(role === 'Customer' && { filter: `customer_user_id=eq.${userId}` }),
  };

  const channel = supabase
    .channel(channelId)
    .on('postgres_changes', filterOptions, (payload) => {
      onUpdate(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
