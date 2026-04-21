
-- Fix 1: Restrict couples SELECT to members only (no more invite_token enumeration)
DROP POLICY IF EXISTS "Couple members can view" ON public.couples;

CREATE POLICY "Couple members can view"
ON public.couples
FOR SELECT
TO authenticated
USING (id = public.get_my_couple_id());

-- Fix 2: Prevent arbitrary couple_id writes via profile updates
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND (
    -- couple_id unchanged
    couple_id IS NOT DISTINCT FROM (SELECT p.couple_id FROM public.profiles p WHERE p.id = auth.uid())
  )
);

-- Fix 3: Secure RPC for joining a couple via invite token
CREATE OR REPLACE FUNCTION public.join_couple_with_token(_token text, _display_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _couple_id uuid;
  _existing uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT couple_id INTO _existing FROM public.profiles WHERE id = auth.uid();
  IF _existing IS NOT NULL THEN
    RAISE EXCEPTION 'Already in a couple';
  END IF;

  SELECT id INTO _couple_id FROM public.couples WHERE invite_token = _token;
  IF _couple_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite token';
  END IF;

  UPDATE public.profiles
  SET couple_id = _couple_id,
      role = 'partner'::app_role,
      display_name = COALESCE(NULLIF(trim(_display_name), ''), display_name, 'Partner'),
      onboarding_complete = true
  WHERE id = auth.uid();

  -- Invalidate the token after use
  UPDATE public.couples SET invite_token = NULL WHERE id = _couple_id;

  RETURN _couple_id;
END;
$$;

-- Validate token without exposing the row
CREATE OR REPLACE FUNCTION public.validate_invite_token(_token text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.couples WHERE invite_token = _token)
$$;
