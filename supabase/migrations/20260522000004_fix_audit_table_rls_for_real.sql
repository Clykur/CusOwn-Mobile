-- Enable RLS and add an explicit INSERT policy for the audit tables.
-- The previous attempt to disable RLS might have been overridden by 
-- Supabase's automatic RLS enforcement, or the table might have FORCE ROW LEVEL SECURITY.
-- The most robust way is to just allow the inserts via a policy.

DO $$
BEGIN
  -- 1. booking_lifecycle_audit
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'booking_lifecycle_audit'
  ) THEN
    -- Make sure RLS is enabled
    ALTER TABLE public.booking_lifecycle_audit ENABLE ROW LEVEL SECURITY;
    
    -- Grant INSERT permissions
    GRANT INSERT ON public.booking_lifecycle_audit TO authenticated, anon;
    
    -- Create policy if not exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'booking_lifecycle_audit' AND policyname = 'allow_insert_booking_lifecycle_audit'
    ) THEN
      CREATE POLICY "allow_insert_booking_lifecycle_audit" 
      ON public.booking_lifecycle_audit 
      FOR INSERT 
      TO public 
      WITH CHECK (true);
    END IF;
  END IF;

  -- 2. booking_transition_audit
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'booking_transition_audit'
  ) THEN
    ALTER TABLE public.booking_transition_audit ENABLE ROW LEVEL SECURITY;
    
    GRANT INSERT ON public.booking_transition_audit TO authenticated, anon;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'booking_transition_audit' AND policyname = 'allow_insert_booking_transition_audit'
    ) THEN
      CREATE POLICY "allow_insert_booking_transition_audit" 
      ON public.booking_transition_audit 
      FOR INSERT 
      TO public 
      WITH CHECK (true);
    END IF;
  END IF;
END;
$$;
