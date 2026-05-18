-- Fix: infinite recursion on user_profiles SELECT/UPDATE policies
-- Cause: policies query user_profiles inside user_profiles RLS (admin check).
-- Run in Supabase SQL Editor (production project).

-- 1) Helper: read admin flag without triggering RLS on the outer policy check
CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND user_type = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.auth_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_is_admin() TO service_role;

-- 2) Replace recursive policies
DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
CREATE POLICY user_profiles_select
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = id
    OR public.auth_is_admin()
  );

DROP POLICY IF EXISTS user_profiles_update ON public.user_profiles;
CREATE POLICY user_profiles_update
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = id
    OR public.auth_is_admin()
  )
  WITH CHECK (
    (SELECT auth.uid()) = id
    OR public.auth_is_admin()
  );

-- INSERT / DELETE unchanged (your existing policies are fine)
-- user_profiles_insert: WITH CHECK (auth.uid() = id)
-- user_profiles_deny_delete: service_role only
