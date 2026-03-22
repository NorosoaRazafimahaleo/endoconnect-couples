
-- Fix overly permissive couples INSERT policy
DROP POLICY "Authenticated can create couples" ON public.couples;
CREATE POLICY "Authenticated can create couples" ON public.couples
  FOR INSERT TO authenticated
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND couple_id IS NOT NULL)
  );

-- Fix overly permissive live_messages INSERT policy
DROP POLICY "Anyone can post live messages" ON public.live_messages;
CREATE POLICY "Authenticated can post live messages" ON public.live_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    live_session_id IN (SELECT id FROM public.live_sessions WHERE status = 'active')
  );
