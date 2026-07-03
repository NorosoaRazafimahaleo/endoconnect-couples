
-- 1) Restrict couples UPDATE to non-sensitive columns
DROP POLICY IF EXISTS "Couple members can update" ON public.couples;
CREATE POLICY "Couple members can update"
ON public.couples
FOR UPDATE
TO authenticated
USING (id = public.get_my_couple_id())
WITH CHECK (
  id = public.get_my_couple_id()
  AND invite_token IS NOT DISTINCT FROM (SELECT c.invite_token FROM public.couples c WHERE c.id = public.get_my_couple_id())
  AND anonymity_level IS NOT DISTINCT FROM (SELECT c.anonymity_level FROM public.couples c WHERE c.id = public.get_my_couple_id())
);

-- 2) Live session participants table for identity checks
CREATE TABLE IF NOT EXISTS public.live_session_participants (
  live_session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (live_session_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.live_session_participants TO authenticated;
GRANT ALL ON public.live_session_participants TO service_role;

ALTER TABLE public.live_session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can join active live sessions"
ON public.live_session_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND live_session_id IN (SELECT id FROM public.live_sessions WHERE status = 'active'::live_session_status)
);

CREATE POLICY "Users can view their own participation"
ON public.live_session_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Users can leave sessions"
ON public.live_session_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Helper to test participation without leaking rows
CREATE OR REPLACE FUNCTION public.is_live_session_participant(_session_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.live_session_participants
    WHERE live_session_id = _session_id AND user_id = _user_id
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_live_session_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_live_session_participant(uuid, uuid) TO authenticated;

-- 3) Tighten live_messages policies
DROP POLICY IF EXISTS "Authenticated can post live messages" ON public.live_messages;
CREATE POLICY "Participants can post live messages"
ON public.live_messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_live_session_participant(live_session_id, auth.uid())
  AND user_token = auth.uid()::text
  AND live_session_id IN (SELECT id FROM public.live_sessions WHERE status = 'active'::live_session_status)
);

DROP POLICY IF EXISTS "Participants can view active session messages" ON public.live_messages;
CREATE POLICY "Participants can view active session messages"
ON public.live_messages
FOR SELECT
TO authenticated
USING (
  (NOT flagged)
  AND public.is_live_session_participant(live_session_id, auth.uid())
  AND live_session_id IN (SELECT id FROM public.live_sessions WHERE status = 'active'::live_session_status)
);

-- 4) user_roles: exclude anonymous sessions from role visibility and blocks
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Non-anonymous users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

DROP POLICY IF EXISTS "Deny role updates from authenticated" ON public.user_roles;
CREATE POLICY "Deny role updates from authenticated"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Deny role deletes from authenticated" ON public.user_roles;
CREATE POLICY "Deny role deletes from authenticated"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);

-- 5) Revoke EXECUTE on internal SECURITY DEFINER helpers from client roles
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_couple_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_invite_token(text) FROM PUBLIC, anon, authenticated;
