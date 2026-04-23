-- Fix ambiguous couple_id reference in profiles UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND profiles.couple_id IS NOT DISTINCT FROM (
      SELECT p.couple_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );