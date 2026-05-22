-- Add missing soft delete columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS permanent_deletion_at timestamp with time zone null,
ADD COLUMN IF NOT EXISTS deletion_reason text null;

-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_soft_deleted_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Permanent delete businesses where deadline passed
  DELETE FROM public.businesses
  WHERE
    deleted_at IS NOT NULL
    AND permanent_deletion_at IS NOT NULL
    AND permanent_deletion_at <= now()
    AND legal_hold = false;
END;
$$;

-- Schedule daily cleanup at 2 AM
SELECT cron.schedule(
  'cleanup-soft-deleted-data',
  '0 2 * * *',
  $$SELECT public.cleanup_soft_deleted_data();$$
);
