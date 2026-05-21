-- Grant EXECUTE on all booking lifecycle RPCs to authenticated users.
-- SECURITY DEFINER functions run with postgres-level access internally,
-- but the authenticated role still needs explicit EXECUTE permission.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'cancel_booking_atomically',
        'reschedule_booking_atomically',
        'reschedule_booking',
        'confirm_booking_atomically',
        'reject_booking_atomically',
        'undo_confirm_booking_atomically',
        'undo_reject_booking_atomically',
        'mark_booking_no_show_atomically',
        'create_booking_atomically',
        'create_booking_idempotent_reserve',
        'expire_pending_bookings_atomically',
        'get_or_generate_slots',
        'get_pending_rating_bookings'
      )
  LOOP
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated',
      r.proname,
      r.args
    );
    RAISE NOTICE 'Granted EXECUTE on public.%(%) to authenticated', r.proname, r.args;
  END LOOP;
END;
$$;
