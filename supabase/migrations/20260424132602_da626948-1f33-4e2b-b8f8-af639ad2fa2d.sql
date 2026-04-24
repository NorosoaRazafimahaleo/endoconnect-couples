-- Wipe app data (children first)
DELETE FROM public.shared_answers;
DELETE FROM public.answers;
DELETE FROM public.commitments;
DELETE FROM public.questions;
DELETE FROM public.sessions;
DELETE FROM public.contact_messages;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;
DELETE FROM public.couples;

-- Wipe auth users (cascades through any FK to auth.users)
DELETE FROM auth.users;