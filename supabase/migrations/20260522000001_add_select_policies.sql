-- Allow SELECT for business_holidays so they can be fetched
DROP POLICY IF EXISTS business_holidays_select ON public.business_holidays;
CREATE POLICY business_holidays_select
  ON public.business_holidays
  FOR SELECT
  TO public
  USING (true);

-- Allow SELECT for business_closures so they can be fetched
DROP POLICY IF EXISTS business_closures_select ON public.business_closures;
CREATE POLICY business_closures_select
  ON public.business_closures
  FOR SELECT
  TO public
  USING (true);
