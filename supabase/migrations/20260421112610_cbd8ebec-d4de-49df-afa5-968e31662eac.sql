-- Allow all authenticated users to view shared answers (anonymized cross-couple feed)
DROP POLICY IF EXISTS "Couple members can view shared answers" ON public.shared_answers;

CREATE POLICY "Authenticated can view shared answers"
ON public.shared_answers
FOR SELECT
TO authenticated
USING (true);

-- Tighten INSERT: only the answer's author can share their own answer, and only into their couple
DROP POLICY IF EXISTS "Couple members can share answers" ON public.shared_answers;

CREATE POLICY "Users can share their own answers"
ON public.shared_answers
FOR INSERT
TO authenticated
WITH CHECK (
  couple_id = public.get_my_couple_id()
  AND answer_id IN (SELECT id FROM public.answers WHERE user_id = auth.uid())
);

-- Allow authenticated users to view answers that have been opted-in to the community feed
DROP POLICY IF EXISTS "Users can view answers" ON public.answers;

CREATE POLICY "Users can view answers"
ON public.answers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR question_id IN (
    SELECT q.id FROM public.questions q
    JOIN public.sessions s ON q.session_id = s.id
    WHERE s.couple_id = public.get_my_couple_id()
  )
  OR id IN (SELECT answer_id FROM public.shared_answers)
);

-- Allow authenticated users to view questions referenced by shared answers (so they can read the question text)
DROP POLICY IF EXISTS "Couple members can view questions" ON public.questions;

CREATE POLICY "Users can view questions"
ON public.questions
FOR SELECT
TO authenticated
USING (
  session_id IN (SELECT id FROM public.sessions WHERE couple_id = public.get_my_couple_id())
  OR id IN (
    SELECT a.question_id FROM public.answers a
    WHERE a.id IN (SELECT answer_id FROM public.shared_answers)
  )
);