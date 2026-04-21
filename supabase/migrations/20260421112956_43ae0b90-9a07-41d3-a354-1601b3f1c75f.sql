CREATE POLICY "Users can unshare their own answers"
ON public.shared_answers
FOR DELETE
TO authenticated
USING (
  answer_id IN (SELECT id FROM public.answers WHERE user_id = auth.uid())
);