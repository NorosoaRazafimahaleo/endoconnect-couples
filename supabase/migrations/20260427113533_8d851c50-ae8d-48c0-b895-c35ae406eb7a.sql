-- Wipe all current app data (children first to respect references)
DELETE FROM public.shared_answers;
DELETE FROM public.answers;
DELETE FROM public.commitments;
DELETE FROM public.questions;
DELETE FROM public.sessions;
DELETE FROM public.contact_messages;
DELETE FROM public.live_messages;
DELETE FROM public.live_sessions;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;
DELETE FROM public.couples;

-- Wipe all auth users (couples/profiles already cleared above)
DELETE FROM auth.users;