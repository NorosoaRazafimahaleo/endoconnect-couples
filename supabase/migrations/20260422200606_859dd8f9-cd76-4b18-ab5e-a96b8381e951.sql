CREATE OR REPLACE FUNCTION public.create_couple_and_link(_display_name text, _language text)
RETURNS TABLE(couple_id uuid, invite_token text, session_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _couple_id uuid;
  _token text;
  _session_id uuid;
  _existing uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT couple_id INTO _existing FROM public.profiles WHERE id = _uid;
  IF _existing IS NOT NULL THEN
    RAISE EXCEPTION 'Already in a couple';
  END IF;

  INSERT INTO public.couples (language)
  VALUES (COALESCE(NULLIF(_language, ''), 'en'))
  RETURNING id, couples.invite_token INTO _couple_id, _token;

  UPDATE public.profiles
  SET display_name = COALESCE(NULLIF(trim(_display_name), ''), display_name),
      language = COALESCE(NULLIF(_language, ''), language),
      couple_id = _couple_id,
      role = 'woman_with_endo'::app_role
  WHERE id = _uid;

  INSERT INTO public.sessions (couple_id, session_number, status)
  VALUES (_couple_id, 1, 'pending'::session_status)
  RETURNING id INTO _session_id;

  RETURN QUERY SELECT _couple_id, _token, _session_id;
END;
$$;