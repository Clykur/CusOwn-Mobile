-- Allow public/authenticated SELECT on media of type 'profile' so customers can view salon owner avatars.
DROP POLICY IF EXISTS media_select_profile ON public.media;

CREATE POLICY media_select_profile ON public.media
  FOR SELECT
  TO authenticated, anon
  USING (
    entity_type = 'profile'
    AND deleted_at IS NULL
  );
