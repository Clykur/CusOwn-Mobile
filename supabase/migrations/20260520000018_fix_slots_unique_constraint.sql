-- The get_or_generate_slots RPC uses:
--   ON CONFLICT (business_id, date, start_time) DO NOTHING
-- but no unique constraint existed for this combination.
-- This is why the RPC always returned a "no unique constraint" error and
-- slots only ever showed up for dates that already had rows in the table.

-- 1. Add the unique constraint (IF NOT EXISTS is not valid syntax for ADD CONSTRAINT,
--    so we use a DO block to skip it gracefully if it already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'slots_business_date_start_time_key'
      AND conrelid = 'public.slots'::regclass
  ) THEN
    ALTER TABLE public.slots
      ADD CONSTRAINT slots_business_date_start_time_key
      UNIQUE (business_id, date, start_time);
  END IF;
END;
$$;

-- 2. Grant EXECUTE on get_or_generate_slots to authenticated users
GRANT EXECUTE ON FUNCTION public.get_or_generate_slots(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_generate_slots(uuid, date) TO anon;

-- 3. Grant EXECUTE on create_custom_slot (used by the booking screen)
GRANT EXECUTE ON FUNCTION public.create_custom_slot(uuid, date, time without time zone, time without time zone) TO authenticated;
