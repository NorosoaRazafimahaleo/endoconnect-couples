
-- 1) Fix shared_answers SELECT policy: scope to caller's couple
DROP POLICY IF EXISTS "Authenticated can view shared answers" ON public.shared_answers;
CREATE POLICY "Couple members can view shared answers"
  ON public.shared_answers
  FOR SELECT
  TO authenticated
  USING (couple_id = public.get_my_couple_id());

-- 2) Fix answers SELECT policy: scope shared_answers subquery to caller's couple
DROP POLICY IF EXISTS "Users can view answers" ON public.answers;
CREATE POLICY "Users can view answers"
  ON public.answers
  FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid())
    OR (question_id IN (
      SELECT q.id
      FROM public.questions q
      JOIN public.sessions s ON q.session_id = s.id
      WHERE s.couple_id = public.get_my_couple_id()
    ))
    OR (id IN (
      SELECT sa.answer_id
      FROM public.shared_answers sa
      WHERE sa.couple_id = public.get_my_couple_id()
    ))
  );

-- 3) Restrict live_sessions SELECT to moderators only
DROP POLICY IF EXISTS "Anyone can view live sessions" ON public.live_sessions;
CREATE POLICY "Moderators can view live sessions"
  ON public.live_sessions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'::public.app_role));

-- 4) Restrict live_messages SELECT to moderators only
DROP POLICY IF EXISTS "Anyone can view live messages" ON public.live_messages;
CREATE POLICY "Moderators can view live messages"
  ON public.live_messages
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'::public.app_role));

-- 5) Add length constraints
ALTER TABLE public.answers
  ADD CONSTRAINT answers_text_length
  CHECK (char_length(answer_text) BETWEEN 1 AND 5000);

ALTER TABLE public.commitments
  ADD CONSTRAINT commitments_text_length
  CHECK (char_length(commitment_text) BETWEEN 1 AND 1000);

ALTER TABLE public.live_messages
  ADD CONSTRAINT live_messages_text_length
  CHECK (char_length(message_text) BETWEEN 1 AND 1000);
