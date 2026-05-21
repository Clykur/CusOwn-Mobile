-- Fix legacy owners RLS policies to check for owner_user_id = auth.uid()
-- (without checking non-existent owner_id column)

-- 1. Services INSERT
DROP POLICY IF EXISTS services_insert_owner ON public.services;
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

-- 2. Services UPDATE
DROP POLICY IF EXISTS services_update_owner ON public.services;
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

-- 3. Services DELETE
DROP POLICY IF EXISTS services_delete_owner ON public.services;
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

-- 4. Services SELECT (Owner permission to see all active/inactive services)
DROP POLICY IF EXISTS services_select_owner ON public.services;
CREATE POLICY services_select_owner
  ON public.services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = services.business_id AND b.owner_user_id = auth.uid()
    )
  );

-- 5. Business Holidays INSERT
DROP POLICY IF EXISTS business_holidays_insert_owner ON public.business_holidays;
CREATE POLICY business_holidays_insert_owner
  ON public.business_holidays
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_holidays.business_id AND b.owner_user_id = auth.uid()
    )
  );

-- 6. Business Holidays UPDATE
DROP POLICY IF EXISTS business_holidays_update_owner ON public.business_holidays;
CREATE POLICY business_holidays_update_owner
  ON public.business_holidays
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_holidays.business_id AND b.owner_user_id = auth.uid()
    )
  );

-- 7. Business Holidays DELETE
DROP POLICY IF EXISTS business_holidays_delete_owner ON public.business_holidays;
CREATE POLICY business_holidays_delete_owner
  ON public.business_holidays
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_holidays.business_id AND b.owner_user_id = auth.uid()
    )
  );

-- 8. Business Closures INSERT
DROP POLICY IF EXISTS business_closures_insert_owner ON public.business_closures;
CREATE POLICY business_closures_insert_owner
  ON public.business_closures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_closures.business_id AND b.owner_user_id = auth.uid()
    )
  );

-- 9. Business Closures UPDATE
DROP POLICY IF EXISTS business_closures_update_owner ON public.business_closures;
CREATE POLICY business_closures_update_owner
  ON public.business_closures
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_closures.business_id AND b.owner_user_id = auth.uid()
    )
  );

-- 10. Business Closures DELETE
DROP POLICY IF EXISTS business_closures_delete_owner ON public.business_closures;
CREATE POLICY business_closures_delete_owner
  ON public.business_closures
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_closures.business_id AND b.owner_user_id = auth.uid()
    )
  );

-- 11. Bookings SELECT
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
