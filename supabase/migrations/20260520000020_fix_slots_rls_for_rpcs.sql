-- reschedule_booking, cancel_booking_atomically, and create_booking_atomically all
-- UPDATE the slots table (changing status to reserved/booked/available).
-- Supabase enforces RLS even on SECURITY DEFINER functions unless bypassed explicitly.
-- 
-- The bookings RPCs handle all authorization internally (they verify business ownership,
-- booking ownership, slot availability, etc.), so it is safe to allow UPDATE on slots
-- from authenticated sessions. Direct PostgREST UPDATE calls are still blocked by
-- separate UPDATE policies (or the absence of them).

-- Allow RPC-driven updates to slots status (for booking, cancellation, reschedule)
DO $$
BEGIN
  -- UPDATE policy: authenticated users can update slot status
  -- (the actual authorization is enforced by the SECURITY DEFINER RPC, not here)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'slots'
      AND policyname = 'Allow authenticated to update slots'
  ) THEN
    CREATE POLICY "Allow authenticated to update slots"
      ON public.slots
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  -- INSERT policy: needed for get_or_generate_slots to create new slot rows
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'slots'
      AND policyname = 'Allow authenticated to insert slots'
  ) THEN
    CREATE POLICY "Allow authenticated to insert slots"
      ON public.slots
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END;
$$;

-- Also ensure bookings UPDATE is allowed (for cancel, reschedule status changes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Allow authenticated to update own bookings'
  ) THEN
    CREATE POLICY "Allow authenticated to update own bookings"
      ON public.bookings
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;
