-- 1. Replace join_couple_with_token: auto-create Session 1 + cap at 2 members
CREATE OR REPLACE FUNCTION public.join_couple_with_token(_token text, _display_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _couple_id uuid;
  _existing uuid;
  _member_count int;
  _has_session bool;
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

  SELECT count(*) INTO _member_count FROM public.profiles WHERE couple_id = _couple_id;
  IF _member_count >= 2 THEN
    RAISE EXCEPTION 'This couple is already complete';
  END IF;

  UPDATE public.profiles
  SET couple_id = _couple_id,
      role = 'partner'::app_role,
      display_name = COALESCE(NULLIF(trim(_display_name), ''), display_name, 'Partner'),
      onboarding_complete = true
  WHERE id = auth.uid();

  -- Ensure Session 1 exists for the couple
  SELECT EXISTS (
    SELECT 1 FROM public.sessions
    WHERE couple_id = _couple_id AND session_number = 1
  ) INTO _has_session;

  IF NOT _has_session THEN
    INSERT INTO public.sessions (couple_id, session_number, status)
    VALUES (_couple_id, 1, 'pending'::session_status);
  END IF;

  -- Invalidate the token after use
  UPDATE public.couples SET invite_token = NULL WHERE id = _couple_id;

  RETURN _couple_id;
END;
$$;

-- 2. Helper to look up couple_id from a token (so invite page can detect "this is my own couple")
CREATE OR REPLACE FUNCTION public.get_couple_id_for_token(_token text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.couples WHERE invite_token = _token
$$;

-- 3. Contact messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  email text,
  category text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can submit a contact message
CREATE POLICY "Anyone can submit a contact message"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(subject)) > 0
  AND length(trim(message)) > 0
  AND length(subject) <= 200
  AND length(message) <= 2000
  AND length(coalesce(name, '')) <= 100
  AND length(coalesce(email, '')) <= 255
);

-- Only moderators can read
CREATE POLICY "Moderators can view contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));