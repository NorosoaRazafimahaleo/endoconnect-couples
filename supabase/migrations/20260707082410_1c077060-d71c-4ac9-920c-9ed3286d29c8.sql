
-- Remove redundant DENY policies on user_roles that target the authenticated role
-- (which includes anonymous JWT sessions). With no permissive policy, RLS denies by default.
DROP POLICY IF EXISTS "Deny role updates from authenticated" ON public.user_roles;
DROP POLICY IF EXISTS "Deny role deletes from authenticated" ON public.user_roles;
DROP POLICY IF EXISTS "Deny role inserts from authenticated" ON public.user_roles;

-- Revoke EXECUTE from authenticated/anon on SECURITY DEFINER helpers that are only
-- meant to be called from other policies/functions or from service_role.
REVOKE EXECUTE ON FUNCTION public.get_couple_id_for_token(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_live_session_participant(uuid, uuid) FROM PUBLIC, anon, authenticated;
