
-- ============================================================
-- 1) Lock down SECURITY DEFINER function EXECUTE privileges
-- ============================================================

-- Revoke from PUBLIC (and anon) on all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_couple_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_invite_token(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_couple_id_for_token(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_couple_and_link(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_couple_with_token(text, text) FROM PUBLIC, anon;

-- Grant EXECUTE only to authenticated where required
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_couple_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invite_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_couple_id_for_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_couple_and_link(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_couple_with_token(text, text) TO authenticated;

-- ============================================================
-- 2) Hide couples.invite_token from direct column reads;
--    provide safe RPCs for fetching and rotating it.
-- ============================================================

REVOKE SELECT (invite_token) ON public.couples FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_invite_token()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.invite_token
  FROM public.couples c
  JOIN public.profiles p ON p.couple_id = c.id
  WHERE p.id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_invite_token() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_invite_token() TO authenticated;

CREATE OR REPLACE FUNCTION public.rotate_my_invite_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _couple_id uuid;
  _new_token text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT couple_id INTO _couple_id FROM public.profiles WHERE id = auth.uid();
  IF _couple_id IS NULL THEN
    RAISE EXCEPTION 'Not in a couple';
  END IF;

  _new_token := encode(extensions.gen_random_bytes(32), 'hex');
  UPDATE public.couples SET invite_token = _new_token WHERE id = _couple_id;
  RETURN _new_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rotate_my_invite_token() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rotate_my_invite_token() TO authenticated;

-- ============================================================
-- 3) live_messages: allow participants to read messages for active sessions
-- ============================================================

CREATE POLICY "Participants can view active session messages"
  ON public.live_messages
  FOR SELECT
  TO authenticated
  USING (
    NOT flagged
    AND live_session_id IN (
      SELECT id FROM public.live_sessions WHERE status = 'active'
    )
  );

-- ============================================================
-- 4) prompts_registry: allow authenticated to read active prompts
-- ============================================================

CREATE POLICY "Authenticated can view active prompts"
  ON public.prompts_registry
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================
-- 5) user_roles: explicitly deny INSERT / UPDATE / DELETE for authenticated
-- ============================================================

CREATE POLICY "Deny role inserts from authenticated"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny role updates from authenticated"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny role deletes from authenticated"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (false);
