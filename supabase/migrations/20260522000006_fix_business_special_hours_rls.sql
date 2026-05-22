-- Fix RLS for business_special_hours and business_hours

-- 1. Make the trigger function SECURITY DEFINER so it can insert without RLS blocking it
ALTER FUNCTION public.seed_business_hours() SECURITY DEFINER;

-- 2. Add policies for business_special_hours to allow owners to manage them
DROP POLICY IF EXISTS "Owners can manage special hours" ON public.business_special_hours;
CREATE POLICY "Owners can manage special hours" ON public.business_special_hours
FOR ALL
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);


