-- CusOwn: allow CUSTOMERS to browse businesses + services (mobile app)
-- Run after 20260519100001_fix_user_profiles_rls_recursion.sql
--
-- Root cause from your policy audit:
-- 1) businesses_select = OWNER + admin only → customers see ZERO salons
-- 2) service_role_only_services = service_role only → nobody on mobile can read services
-- 3) bookings_select admin clause still subqueries user_profiles → use auth_is_admin()

-- ─── 1. Businesses: public browse (active, not deleted/suspended) ───
CREATE POLICY businesses_select_customer_browse
  ON public.businesses
  FOR SELECT
  TO authenticated, anon
  USING (
    deleted_at IS NULL
    AND (suspended IS NULL OR suspended = false)
  );

-- Keeps existing businesses_select (owner + admin) — policies are OR'd.

-- ─── 2. Services: replace service-role-only lockout for reads ───
-- Your policy "service_role_only_services" (cmd *) blocks all non–service_role access.
-- Add explicit SELECT for app users; adjust name if your policy differs.

DROP POLICY IF EXISTS service_role_only_services ON public.services;

-- Service role retains full access (dashboard/migrations)
CREATE POLICY services_service_role_all
  ON public.services
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Customers + owners: read active services for live businesses
CREATE POLICY services_select_active
  ON public.services
  FOR SELECT
  TO authenticated, anon
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = services.business_id
        AND b.deleted_at IS NULL
        AND (b.suspended IS NULL OR b.suspended = false)
    )
  );

-- Owners: manage their business services
CREATE POLICY services_insert_owner
  ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = services.business_id AND b.owner_user_id = auth.uid()
    )
  );

CREATE POLICY services_update_owner
  ON public.services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = services.business_id AND b.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = services.business_id AND b.owner_user_id = auth.uid()
    )
  );

CREATE POLICY services_delete_owner
  ON public.services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = services.business_id AND b.owner_user_id = auth.uid()
    )
  );

-- ─── 3. Bookings SELECT: admin via auth_is_admin() (no user_profiles subquery) ───
DROP POLICY IF EXISTS bookings_select ON public.bookings;

CREATE POLICY bookings_select
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    customer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = bookings.business_id AND b.owner_user_id = auth.uid()
    )
    OR public.auth_is_admin()
  );

-- ─── 4. Optional: media gallery for customers (public business media) ───
-- If gallery is still empty, ensure this OR branch exists in media_select:
-- (entity_type = 'business' AND deleted_at IS NULL)  ← you already have this
