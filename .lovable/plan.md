
# Remove signup while keeping every feature working

## The conflict to resolve

Your two answers point in opposite directions:
- "Everything local, no backend" — but you also want to keep community feed, admin dashboard, live moderated sessions, contact form, and AI-generated questions.
- Those features **cannot** work without a backend. They need a server to store posts, moderate content, run AI, and receive contact messages.

So the real goal is: **no signup friction for users**, but everything else keeps working. That is achievable — with **anonymous authentication**.

## The approach: invisible accounts

Supabase supports "anonymous sign-in" — the app creates a real account in the background the first time someone opens it. No email, no password, no form. The user never sees signup or login. Under the hood they still have an `auth.uid()`, so:

- Couples still sync across devices (partner still opens an invite link)
- Community posts still work (anonymized as they are today)
- AI question generation still works (edge functions still see a valid user)
- Contact form still works
- Live sessions still work
- PDF export still works

The only people who still log in are **moderators/admins** — they need a real email/password to access `/admin`. That login stays but moves out of the way (hidden route, not on the homepage).

## User experience

Before:
```text
Land on / → "Sign up" / "Log in" → email + password → onboarding → home
```

After:
```text
Land on / → app quietly creates anon account → onboarding → home
```

Partner B flow before:
```text
Open invite link → forced to sign up → then joined
```

Partner B flow after:
```text
Open invite link → app quietly creates anon account → immediately joined → home
```

## What changes

### Auth
- Enable anonymous sign-ins in Cloud auth settings
- `AuthProvider` bootstraps: if no session, call `supabase.auth.signInAnonymously()` before rendering the app
- Delete/redirect these public pages: `Signup`, `Login`, `ForgotPassword`, `ResetPassword`
- Keep a hidden `/admin/login` for moderators (email+password) — not linked from anywhere in the UI
- Remove "Sign out" button from `Home` (anonymous users signing out would lose everything). Replace with a "Reset my data" action for local reset.

### Onboarding
- Skip straight to display name + language + role picker
- On submit → call `create_couple_and_link` (already exists) → done
- Partner-B invite page: same — pick a display name, join

### Data cleanup
- Wipe existing accounts and data so the switchover is clean (as done before)
- No schema changes needed — RLS already scopes by `auth.uid()` which anonymous users have

### Moderator access
- Add a `moderator@endopartner` seed account after the wipe (or leave you to create one via the hidden login page's signup path, gated by a secret code)
- Community/admin routes gate on `has_role(auth.uid(), 'moderator')` — unchanged

### Contact form
- Already accepts `anon` inserts — no change needed, works for anonymous users too

## Trade-offs to know about

1. **Losing a device = losing account.** Anonymous users have no email to recover with. If they clear browser storage or switch devices, their session is gone and their couple link with it. This is inherent to no-signup. We can add an optional "Save my progress" upgrade later (link email to the anon account) — not built in this plan.
2. **Two devices for the couple still need the invite link.** Partner B on their own phone gets their own anon account and joins via the link — same as today, just no signup form in between.
3. **Bots/spam.** Anonymous auth is easier to abuse. Rate-limiting on the edge functions is already in place via auth checks; no additional work needed for MVP.
4. **Community moderation.** Since users are anonymous, moderators can't ban a person, only delete posts. Acceptable for now.

## Files touched (technical)

- `src/hooks/useAuth.tsx` — bootstrap anonymous session, remove `signUp`/`signIn` exports, add `resetAnonymous()`
- `src/App.tsx` — remove `/signup`, `/login`, `/forgot-password`, `/reset-password` from public routes; add `/admin/login`
- Delete: `src/pages/Signup.tsx`, `src/pages/Login.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/ResetPassword.tsx` (or convert `Login` → moderator-only at `/admin/login`)
- `src/pages/Index.tsx` — remove signup/login CTAs; the "Start" button just navigates to `/onboarding`
- `src/pages/Onboarding.tsx` — drop any email checks, straight to profile setup
- `src/pages/Invite.tsx` — no auth redirect; anonymous session is already there when they land
- `src/pages/Home.tsx` — replace "Sign out" with "Reset my data"
- `src/components/ProtectedRoute.tsx` — still checks for a session (anonymous session counts)
- Supabase auth config: enable `external_anonymous_users_enabled: true`
- Migration: wipe existing `auth.users` + all public data (same cleanup as the earlier reset)

## What I need to know before building

1. Do you want the current existing accounts wiped (fresh start) or migrated to anonymous somehow? (Migration is essentially impossible — anonymous accounts can't inherit data from removed emails cleanly. Fresh start is strongly recommended.)
2. For moderator access — do you already have a moderator email you want seeded, or should I make you the first moderator via the hidden `/admin/login` route?
