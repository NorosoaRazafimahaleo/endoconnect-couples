## Investigation findings

- The `create_couple_and_link` RPC already creates Session 1 for the creator's couple — good.
- `join_couple_with_token` RPC does NOT create a session. If the inviter's onboarding ever fails before session creation, the joining partner ends up in a couple with 0 sessions. (Currently in DB: 2 couples, both with only 1 session — but logic should be defensive.)
- Bug confirmed in DB: one couple has **3 members** (`b65852f3...` has 3 profiles). The `join_couple_with_token` RPC currently only blocks the joining user if THEY are already in a couple — it does not check whether the target couple already has 2 members. So a third person clicking the invite link gets added.
- The "already in couple" wall in `Invite.tsx` blocks any logged-in user who already has a `couple_id` — including the inviter who clicks their own link, and the legitimate partner if the page reloads after joining.

---

## Plan

### 1. Auto-create Session 1 when partner joins via invite

Update the `join_couple_with_token` SQL function to:
- Look up the couple's existing sessions; if **no** session with `session_number = 1` exists for that couple, insert one with `status = 'pending'`.
- This makes session creation a guaranteed side-effect of a successful join, independent of the inviter's flow.
- Also harden it: reject the join if the couple already has 2 members (prevent the "3 people in a couple" bug).

Migration file:
```sql
CREATE OR REPLACE FUNCTION public.join_couple_with_token(_token text, _display_name text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _couple_id uuid;
  _existing uuid;
  _member_count int;
  _has_session bool;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT couple_id INTO _existing FROM public.profiles WHERE id = auth.uid();
  IF _existing IS NOT NULL THEN RAISE EXCEPTION 'Already in a couple'; END IF;

  SELECT id INTO _couple_id FROM public.couples WHERE invite_token = _token;
  IF _couple_id IS NULL THEN RAISE EXCEPTION 'Invalid invite token'; END IF;

  SELECT count(*) INTO _member_count FROM public.profiles WHERE couple_id = _couple_id;
  IF _member_count >= 2 THEN RAISE EXCEPTION 'This couple is already complete'; END IF;

  UPDATE public.profiles
    SET couple_id = _couple_id, role = 'partner'::app_role,
        display_name = COALESCE(NULLIF(trim(_display_name),''), display_name, 'Partner'),
        onboarding_complete = true
    WHERE id = auth.uid();

  -- Ensure Session 1 exists for the couple
  SELECT EXISTS (SELECT 1 FROM public.sessions WHERE couple_id = _couple_id AND session_number = 1)
    INTO _has_session;
  IF NOT _has_session THEN
    INSERT INTO public.sessions (couple_id, session_number, status)
      VALUES (_couple_id, 1, 'pending'::session_status);
  END IF;

  UPDATE public.couples SET invite_token = NULL WHERE id = _couple_id;
  RETURN _couple_id;
END;
$$;
```

### 2. Fix the "Already in a couple" dead-end on the invite page

The current `Invite.tsx` shows a hard "Already in a couple" wall to **anyone** logged in with a `couple_id`. This wrongly blocks:
- The legitimate partner whose join just succeeded (if they refresh the link).
- The inviter clicking their own link.
- Anyone whose page state desyncs.

Fix in `src/pages/Invite.tsx`:
- If the logged-in user's `couple_id` matches the couple owning this invite token (i.e. they are already a member of THIS couple) → friendly "You're all set with your partner" message + "Go to Dashboard" button. No error.
- If they belong to a **different** couple → keep current "Already in a couple" message.
- To know which couple owns the token, extend `validate_invite_token` to also return the `couple_id` (or add a new lightweight RPC `get_couple_id_for_token`). Use a SECURITY DEFINER read-only function returning `uuid`.

Also: simplify the joining flow so a logged-in user joining their first couple gets navigated straight to `/home` after the auto-join effect runs (already the case) — and the success state isn't immediately overwritten by the "Already in a couple" wall on re-render. Concretely, gate the "Already in a couple" branch behind `profile.couple_id !== inviteCoupleId`.

### 3. Add a "Contact / Bug report" form

Goal: lightweight in-app form that emails `nosrazaei@gmail.com`.

**Approach: Lovable Email infrastructure (built-in, no third-party API key).**

Steps:
1. Set up an email sender domain via the email setup dialog (one-time, the user will need to add NS records at their registrar).
2. Set up email infrastructure (`setup_email_infra`) and scaffold transactional emails.
3. Create a React Email template `contact-message.tsx` that renders the user's message, name, email, category (Reach out / Suggestion / Bug report), and a timestamp. Subject: `[EndoPartner] {category}: {short-subject}`.
4. Create a `Contact.tsx` page at `/contact` with:
   - Category dropdown (Reach out / Suggestion / Bug / Error report)
   - Subject input (max 200 chars)
   - Message textarea (max 2000 chars, with counter)
   - Optional name + reply-to email (prefilled from `profile`)
   - Zod validation client-side
   - On submit: insert a row into a new `contact_messages` table (audit trail) and invoke `send-transactional-email` with `recipientEmail = "nosrazaei@gmail.com"`, `templateName = "contact-message"`, and `templateData` containing the form fields.
5. Add a link "Contact / Report a bug" in the Home header (next to Community) and in the footer of Login/Signup pages.
6. Database: new table `contact_messages` (id, user_id nullable, name, email, category, subject, message, created_at). RLS: authenticated users can INSERT their own row (`user_id = auth.uid()` or null for anon); only moderators can SELECT.

> Note: setting up the email sender domain is a one-time setup the user will need to complete via the email setup dialog. Once done, all subsequent contact-form messages flow through automatically.

---

## Files to change

- **New migration**: replace `join_couple_with_token` (Plan #1), add `get_couple_id_for_token` RPC (Plan #2), create `contact_messages` table + RLS (Plan #3).
- **`src/pages/Invite.tsx`**: fix the "already in couple" branch to compare against the invite's couple_id (Plan #2).
- **New `src/pages/Contact.tsx`**: contact form (Plan #3).
- **`src/App.tsx`**: register `/contact` route.
- **`src/pages/Home.tsx`**: add "Contact" link in the header.
- **New `supabase/functions/_shared/transactional-email-templates/contact-message.tsx`** + registry update (Plan #3).
- **Email infrastructure setup** via dialog + tools (Plan #3).

## Out of scope / not changing

- The 3-member couple already in DB (`b65852f3...`) — leaving as-is; new RLS prevents recurrence. Happy to clean it up if you confirm.
- The existing `create_couple_and_link` RPC — already creates Session 1 correctly.
