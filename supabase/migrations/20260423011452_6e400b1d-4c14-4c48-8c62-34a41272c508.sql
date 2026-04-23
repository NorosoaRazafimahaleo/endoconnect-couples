-- Replace the self-referencing profile UPDATE policy with one that uses
-- the existing SECURITY DEFINER helper get_my_couple_id() to avoid
-- ambiguous column references and recursive policy evaluation.

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND couple_id IS NOT DISTINCT FROM public.get_my_couple_id()
  );