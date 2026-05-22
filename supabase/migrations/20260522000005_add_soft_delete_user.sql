-- Add deleted_at to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- 1. Soft Delete RPC
CREATE OR REPLACE FUNCTION public.soft_delete_user_account(p_user_id uuid, p_actor_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We allow the user themselves to soft delete, or an admin
  IF p_user_id != auth.uid() THEN
    -- Basic check; extend with actual admin check if needed
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin') THEN
      RAISE EXCEPTION 'Not authorized to delete this account';
    END IF;
  END IF;

  UPDATE public.user_profiles
  SET deleted_at = now()
  WHERE id = p_user_id;
END;
$$;

-- 2. Recover User RPC
CREATE OR REPLACE FUNCTION public.recover_user_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to recover this account';
  END IF;

  UPDATE public.user_profiles
  SET deleted_at = NULL
  WHERE id = p_user_id;
END;
$$;

-- Explicit grants
GRANT EXECUTE ON FUNCTION public.soft_delete_user_account(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recover_user_account(uuid) TO authenticated;

-- 3. Hard delete expired users (older than 30 days)
CREATE OR REPLACE FUNCTION public.hard_delete_expired_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from auth.users (cascades to public.user_profiles and other tables)
  DELETE FROM auth.users
  WHERE id IN (
    SELECT id FROM public.user_profiles 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < now() - interval '30 days'
  );
END;
$$;

-- Schedule the hard delete function to run daily via pg_cron if available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule to run daily at 3:00 AM
    EXECUTE 'SELECT cron.schedule(''hard_delete_expired_accounts_job'', ''0 3 * * *'', ''SELECT public.hard_delete_expired_accounts();'')';
  ELSE
    RAISE NOTICE 'pg_cron extension not found. Please enable it in Supabase dashboard to schedule hard_delete_expired_accounts() daily.';
  END IF;
END
$$;
