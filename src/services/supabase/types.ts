export type RpcResponse<T = unknown> = {
  success: boolean;
  error?: string;
  is_replay?: boolean;
} & T;

export interface RpcErrorOptions {
  functionName?: string;
  params?: Record<string, unknown>;
}

export interface BookingRpcParams {
  p_booking_id: string;
  p_actor_id?: string;
}

export interface CreateBookingIdempotentParams {
  p_business_id: string;
  p_slot_id: string;
  p_customer_name: string;
  p_customer_phone: string;
  p_booking_id: string;
  p_customer_user_id: string;
  p_service_data: Array<{
    service_id: string;
    price_cents: number;
    name: string;
  }>;
  p_services_count: number;
  p_total_duration_minutes: number;
  p_total_price_cents: number;
  p_key: string;
  p_ttl_hours: number;
}

export interface CreateBookingAtomicParams extends Omit<
  CreateBookingIdempotentParams,
  'p_key' | 'p_ttl_hours'
> {
  p_idempotency_key: string;
}

export interface RescheduleBookingParams {
  p_booking_id: string;
  p_new_slot_id: string;
  p_rescheduled_by: 'customer' | 'owner';
  p_reschedule_reason: string;
}

export interface CancelBookingParams {
  p_booking_id: string;
  p_cancelled_by: 'customer' | 'owner' | 'system';
  p_cancellation_reason: string;
}
