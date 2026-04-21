-- Fix 1: Restrict shared_answers SELECT to couple members only
DROP POLICY IF EXISTS "Anyone authenticated can view shared answers" ON public.shared_answers;

CREATE POLICY "Couple members can view shared answers"
ON public.shared_answers
FOR SELECT
TO authenticated
USING (couple_id = public.get_my_couple_id());

-- Fix 2: Restrict profiles SELECT so email is only visible to self
-- Replace the broad policy with two: full self-access + limited partner view via a view
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Create a view exposing only non-sensitive partner fields (no email)
CREATE OR REPLACE VIEW public.couple_members
WITH (security_invoker=on) AS
SELECT id, couple_id, role, display_name, language, onboarding_complete, created_at, updated_at
FROM public.profiles
WHERE couple_id = public.get_my_couple_id();