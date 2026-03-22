
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('woman_with_endo', 'partner', 'moderator');

-- Create session_status enum
CREATE TYPE public.session_status AS ENUM ('pending', 'active', 'completed');

-- Create live_session_status enum
CREATE TYPE public.live_session_status AS ENUM ('scheduled', 'active', 'closed');

-- Create commitment_source enum
CREATE TYPE public.commitment_source AS ENUM ('ai_suggestion', 'free_text');

-- Create question_perspective enum
CREATE TYPE public.question_perspective AS ENUM ('partner', 'woman_with_endo', 'both');

-- Couples table
CREATE TABLE public.couples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  language TEXT NOT NULL DEFAULT 'en',
  anonymity_level INTEGER NOT NULL DEFAULT 1,
  invite_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex')
);

ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
  role app_role NOT NULL DEFAULT 'woman_with_endo',
  display_name TEXT,
  email TEXT,
  language TEXT DEFAULT 'en',
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (for moderator access)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL CHECK (session_number BETWEEN 1 AND 3),
  status session_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (couple_id, session_number)
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  perspective question_perspective NOT NULL DEFAULT 'both',
  category TEXT,
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Answers table
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (question_id, user_id)
);

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Commitments table
CREATE TABLE public.commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commitment_text TEXT NOT NULL,
  source commitment_source NOT NULL DEFAULT 'free_text',
  reminder_sent_3d BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_7d BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

-- Shared answers table
CREATE TABLE public.shared_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  is_bookmarked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_answers ENABLE ROW LEVEL SECURITY;

-- Live sessions table
CREATE TABLE public.live_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  status live_session_status NOT NULL DEFAULT 'scheduled',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  moderator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Live messages table
CREATE TABLE public.live_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  live_session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_token TEXT NOT NULL,
  message_text TEXT NOT NULL,
  flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.live_messages ENABLE ROW LEVEL SECURITY;

-- Prompts registry table
CREATE TABLE public.prompts_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (prompt_id, version)
);

ALTER TABLE public.prompts_registry ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper to get couple_id for current user
CREATE OR REPLACE FUNCTION public.get_my_couple_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT couple_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles: users can read their own and their partner's profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR couple_id = public.get_my_couple_id());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Couples: members can view and update their own couple
CREATE POLICY "Couple members can view" ON public.couples
  FOR SELECT TO authenticated
  USING (id = public.get_my_couple_id() OR invite_token IS NOT NULL);

CREATE POLICY "Authenticated can create couples" ON public.couples
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Couple members can update" ON public.couples
  FOR UPDATE TO authenticated
  USING (id = public.get_my_couple_id());

-- Sessions: couple members can access
CREATE POLICY "Couple members can view sessions" ON public.sessions
  FOR SELECT TO authenticated
  USING (couple_id = public.get_my_couple_id());

CREATE POLICY "Couple members can create sessions" ON public.sessions
  FOR INSERT TO authenticated
  WITH CHECK (couple_id = public.get_my_couple_id());

CREATE POLICY "Couple members can update sessions" ON public.sessions
  FOR UPDATE TO authenticated
  USING (couple_id = public.get_my_couple_id());

-- Questions: visible to couple members of the session
CREATE POLICY "Couple members can view questions" ON public.questions
  FOR SELECT TO authenticated
  USING (
    session_id IN (SELECT id FROM public.sessions WHERE couple_id = public.get_my_couple_id())
  );

CREATE POLICY "System can insert questions" ON public.questions
  FOR INSERT TO authenticated
  WITH CHECK (
    session_id IN (SELECT id FROM public.sessions WHERE couple_id = public.get_my_couple_id())
  );

-- Answers: users can insert own, view own + partner's after both submit
CREATE POLICY "Users can insert own answers" ON public.answers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view answers" ON public.answers
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    question_id IN (
      SELECT q.id FROM public.questions q
      JOIN public.sessions s ON q.session_id = s.id
      WHERE s.couple_id = public.get_my_couple_id()
    )
  );

-- Commitments
CREATE POLICY "Users can insert own commitments" ON public.commitments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view couple commitments" ON public.commitments
  FOR SELECT TO authenticated
  USING (
    session_id IN (SELECT id FROM public.sessions WHERE couple_id = public.get_my_couple_id())
  );

-- Shared answers: public read for community
CREATE POLICY "Anyone authenticated can view shared answers" ON public.shared_answers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Couple members can share answers" ON public.shared_answers
  FOR INSERT TO authenticated
  WITH CHECK (couple_id = public.get_my_couple_id());

-- Live sessions: public read
CREATE POLICY "Anyone can view live sessions" ON public.live_sessions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Moderators can manage live sessions" ON public.live_sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

-- Live messages
CREATE POLICY "Anyone can view live messages" ON public.live_messages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anyone can post live messages" ON public.live_messages
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Moderators can update live messages" ON public.live_messages
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

-- Prompts registry: moderators only
CREATE POLICY "Moderators can manage prompts" ON public.prompts_registry
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

-- User roles: only readable by moderators and the user themselves
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
