-- Reviews readable for salon detail pages (customer browse)
DROP POLICY IF EXISTS reviews_select_public ON public.reviews;
CREATE POLICY reviews_select_public
  ON public.reviews
  FOR SELECT
  TO authenticated, anon
  USING (COALESCE(is_hidden, false) = false);
