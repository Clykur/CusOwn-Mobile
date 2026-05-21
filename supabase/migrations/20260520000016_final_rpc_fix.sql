-- 1. Drop ALL possible versions of the conflicting functions to completely clear the slate

-- Drop the versions with service_data FIRST
DROP FUNCTION IF EXISTS public.create_booking_atomically(uuid, uuid, text, text, text, uuid, jsonb, integer, integer, integer, text);
DROP FUNCTION IF EXISTS public.create_booking_idempotent_reserve(uuid, uuid, text, text, text, uuid, jsonb, integer, integer, integer, text, integer);
DROP FUNCTION IF EXISTS public.create_booking_idempotent_reserve(text, integer, uuid, uuid, text, text, text, uuid, jsonb, integer, integer, integer);

-- Drop the versions with total_duration_minutes FIRST (the original schema)
DROP FUNCTION IF EXISTS public.create_booking_atomically(uuid, uuid, text, text, text, uuid, integer, integer, integer, jsonb, text);
DROP FUNCTION IF EXISTS public.create_booking_idempotent_reserve(uuid, uuid, text, text, text, uuid, integer, integer, integer, jsonb, text, integer);
DROP FUNCTION IF EXISTS public.create_booking_idempotent_reserve(text, integer, uuid, uuid, text, text, text, uuid, integer, integer, integer, jsonb);

-- 2. Restore EXACTLY ONE version of create_booking_atomically using the original parameter order
CREATE OR REPLACE FUNCTION public.create_booking_atomically(
    p_business_id uuid,
    p_slot_id uuid,
    p_customer_name text,
    p_customer_phone text,
    p_booking_id text,
    p_customer_user_id uuid,
    p_total_duration_minutes integer,
    p_total_price_cents integer,
    p_services_count integer,
    p_service_data jsonb,
    p_idempotency_key text DEFAULT NULL::text
) RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
DECLARE
v_slot_status TEXT;
v_slot_business_id UUID;
v_slot_date DATE;
v_slot_start TIME;
v_slot_end TIME;
v_business_suspended BOOLEAN;
v_reserved_until TIMESTAMP WITH TIME ZONE;
v_booking_uuid UUID;
v_slot_id_ret UUID;
v_reservation_expiry TIMESTAMP WITH TIME ZONE;
v_slot_expiry_minutes CONSTANT INTEGER := 10;
BEGIN
-- Distributed idempotency: if key provided and booking already exists, return it
IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
SELECT id, slot_id INTO v_booking_uuid, v_slot_id_ret
FROM bookings
WHERE idempotency_key = p_idempotency_key
FOR UPDATE;
IF FOUND THEN
RETURN jsonb_build_object('success', true, 'booking_id', v_booking_uuid, 'slot_id', v_slot_id_ret, 'idempotent', true);
END IF;
END IF;

SELECT s.status, s.business_id, s.date, s.start_time, s.end_time, b.suspended, s.reserved_until
INTO v_slot_status, v_slot_business_id, v_slot_date, v_slot_start, v_slot_end, v_business_suspended, v_reserved_until
FROM slots s
JOIN businesses b ON s.business_id = b.id
WHERE s.id = p_slot_id
AND s.business_id = p_business_id
FOR UPDATE OF s;

IF v_slot_status IS NULL THEN
RETURN jsonb_build_object('success', false, 'error', 'Slot not found');
END IF;

IF v_slot_business_id != p_business_id THEN
RETURN jsonb_build_object('success', false, 'error', 'Slot does not belong to business');
END IF;

IF v_business_suspended = true THEN
RETURN jsonb_build_object('success', false, 'error', 'Business is suspended');
END IF;

IF v_slot_status = 'booked' THEN
RETURN jsonb_build_object('success', false, 'error', 'Slot already booked');
END IF;

IF v_slot_status = 'reserved' AND v_reserved_until IS NOT NULL THEN
IF v_reserved_until > NOW() THEN
RETURN jsonb_build_object('success', false, 'error', 'Slot is reserved');
END IF;
END IF;

-- Overlap: only non-expired holds (confirmed, or pending with slot.reserved_until > NOW())
IF EXISTS (
SELECT 1
FROM bookings b2
JOIN slots s2 ON b2.slot_id = s2.id
WHERE b2.business_id = p_business_id
AND b2.slot_id != p_slot_id
AND s2.date = v_slot_date
AND s2.start_time < v_slot_end
AND s2.end_time > v_slot_start
AND (
b2.status = 'confirmed'
OR (b2.status = 'pending' AND s2.reserved_until IS NOT NULL AND s2.reserved_until > NOW())
)
) THEN
RETURN jsonb_build_object('success', false, 'error', 'Slot overlaps with an existing booking');
END IF;

v_reservation_expiry := NOW() + (v_slot_expiry_minutes || ' minutes')::INTERVAL;

UPDATE slots
SET status = 'reserved',
reserved_until = v_reservation_expiry
WHERE id = p_slot_id
AND business_id = p_business_id
AND status IN ('available', 'reserved')
AND (reserved_until IS NULL OR reserved_until < NOW());

IF NOT FOUND THEN
RETURN jsonb_build_object('success', false, 'error', 'Slot reservation failed');
END IF;

INSERT INTO bookings (
business_id,
slot_id,
slot_start,
slot_end,
customer_name,
customer_phone,
booking_id,
status,
customer_user_id,
total_duration_minutes,
total_price_cents,
services_count,
idempotency_key
)
VALUES (
p_business_id,
p_slot_id,
v_slot_start,
v_slot_end,
p_customer_name,
p_customer_phone,
p_booking_id,
'pending',
p_customer_user_id,
p_total_duration_minutes,
p_total_price_cents,
p_services_count,
p_idempotency_key
)
RETURNING id INTO v_booking_uuid;

IF p_service_data IS NOT NULL THEN
INSERT INTO booking_services (booking_id, service_id, price_cents)
SELECT
v_booking_uuid,
(elem->>'service_id')::UUID,
(elem->>'price_cents')::INTEGER
FROM jsonb_array_elements(p_service_data::jsonb) AS elem;
END IF;

RETURN jsonb_build_object(
'success', true,
'booking_id', v_booking_uuid,
'slot_id', p_slot_id
);
END;
$$;


-- 3. Restore EXACTLY ONE version of create_booking_idempotent_reserve using the original parameter order
CREATE OR REPLACE FUNCTION public.create_booking_idempotent_reserve(
    p_key text,
    p_ttl_hours integer,
    p_business_id uuid,
    p_slot_id uuid,
    p_customer_name text,
    p_customer_phone text,
    p_booking_id text,
    p_customer_user_id uuid,
    p_total_duration_minutes integer,
    p_total_price_cents integer,
    p_services_count integer,
    p_service_data jsonb
) RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
DECLARE
v_result_id UUID;
v_snapshot JSONB;
v_create_result JSONB;
v_booking_uuid UUID;
v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
IF p_key IS NULL OR trim(p_key) = '' OR length(p_key) > 512 THEN
RAISE EXCEPTION 'idempotency key must be non-empty and at most 512 chars';
END IF;

v_expires_at := NOW() + (p_ttl_hours || ' hours')::INTERVAL;

INSERT INTO public.idempotency_keys (key, resource_type, result_id, expires_at)
VALUES (p_key, 'booking', NULL, v_expires_at)
ON CONFLICT (key, resource_type) DO NOTHING;

SELECT ik.result_id, ik.response_snapshot
INTO v_result_id, v_snapshot
FROM public.idempotency_keys ik
WHERE ik.key = p_key AND ik.resource_type = 'booking'
FOR UPDATE;

IF NOT FOUND THEN
RETURN jsonb_build_object('success', false, 'error', 'Key not found');
END IF;

IF v_snapshot IS NOT NULL AND (v_snapshot->>'_in_progress') IS NULL THEN
RETURN jsonb_build_object('success', true, 'status', 'duplicate', 'response_snapshot', v_snapshot, 'booking_id', v_result_id);
END IF;

IF v_snapshot IS NOT NULL AND (v_snapshot->>'_in_progress') = 'true' THEN
RETURN jsonb_build_object('success', true, 'status', 'in_progress', 'response_snapshot', NULL, 'booking_id', NULL);
END IF;

UPDATE public.idempotency_keys
SET response_snapshot = '{"_in_progress":true}'::jsonb
WHERE key = p_key AND resource_type = 'booking';

v_create_result := public.create_booking_atomically(
p_business_id,
p_slot_id,
p_customer_name,
p_customer_phone,
p_booking_id,
p_customer_user_id,
p_total_duration_minutes,
p_total_price_cents,
p_services_count,
p_service_data,
p_key
);

IF NOT (v_create_result->>'success')::boolean THEN
RAISE EXCEPTION 'Booking creation failed: %', COALESCE(v_create_result->>'error', 'Unknown error');
END IF;

v_booking_uuid := (v_create_result->>'booking_id')::uuid;

UPDATE public.idempotency_keys
SET result_id = v_booking_uuid
WHERE key = p_key AND resource_type = 'booking';

RETURN jsonb_build_object('success', true, 'status', 'created', 'response_snapshot', NULL, 'booking_id', v_booking_uuid);
END;
$$;
