-- Fix business_holidays RLS
ALTER TABLE public.business_holidays ENABLE ROW LEVEL SECURITY;

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

-- Fix business_closures RLS
ALTER TABLE public.business_closures ENABLE ROW LEVEL SECURITY;

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

-- Fix services INSERT policy
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

-- Fix services UPDATE policy
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

-- Create business-media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-media', 'business-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for business-media
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-media');

DROP POLICY IF EXISTS "Owner Upload Access" ON storage.objects;
CREATE POLICY "Owner Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-media' AND (auth.uid() IS NOT NULL)
);

DROP POLICY IF EXISTS "Owner Update Access" ON storage.objects;
CREATE POLICY "Owner Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-media' AND (auth.uid() IS NOT NULL)
);

DROP POLICY IF EXISTS "Owner Delete Access" ON storage.objects;
CREATE POLICY "Owner Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-media' AND (auth.uid() IS NOT NULL)
);
