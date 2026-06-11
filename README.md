# EndoPartner — Product Requirements Document

**Product:** EndoPartner — endopartnerbyno.lovable.app
**Author:** Norosoa Francia Razafimahaleo (no) — scrumwithno.com
**Version:** 1.0 — June 2026
**Status:** Documented from a working prototype

---

## How this PRD was made — and why it's different

Most teams write the spec first and build second. **My method is the reverse: prototype first, document after.** It's not the common way. It's my way.

I built EndoPartner as a working prototype, put it in front of reality, audited it, and *then* wrote this document. What you're reading is not a guess about what the product should be — it's a validated record of what it **is**, plus an ordered backlog of what it should become.

Why I work this way:

- A prototype answers in days what a spec debates for weeks.
- Working software is the primary measure of progress — the spec then captures **validated learning**, not assumptions.
- The audit of the real prototype surfaced issues (a privacy default, contrast failures, contradictory claims) that no upfront spec would have caught.

The trade-off is real and I accept it: some things were built wrong first and are now in the backlog to fix. I'd rather correct a real thing than perfect an imaginary one.

---

## 1. Context and problem

Endometriosis affects roughly 1 in 10 women of reproductive age. It is chronic, painful, and poorly understood — including by the partners of those who live with it. Couples struggle to talk about it: the patient feels unheard, the partner feels helpless, and the hardest conversations never happen.

**Problem statement:** Couples navigating endometriosis lack a safe, structured way to understand each other and turn empathy into concrete support.

## 2. Product goal

> Help couples navigating endometriosis understand each other better and turn that understanding into small, real commitments — privately, safely, and for free.

## 3. Who it's for

- **The patient partner** — lives with endometriosis, wants to be understood without having to educate or justify.
- **The supporting partner** — wants to help, often doesn't know how, joins with the lowest possible friction (an invite link and a name — no account).

## 4. What the product does today (as built, v1)

The prototype is live. Core loop:

1. **Sign up & invite.** One partner creates a free account, gets a private invite link. The other joins via the link with just a display name.
2. **Guided sessions.** Three progressive sessions ("Understanding Each Other", "Deepening Connection", "Growing Together"). Sessions unlock in order. Questions are AI-generated per couple and per chosen language.
3. **Answer privately.** Each partner answers alone. Answers stay hidden until both have submitted — enforced at the database level.
4. **Reveal together.** Both answers are shown side by side once both are in.
5. **Commit.** The couple turns insights into small commitments, with AI-suggested options. Humans decide; AI suggests.
6. **Keep it.** Any completed session can be exported as a PDF.
7. **Community (opt-in).** Anonymized answers can be shared to a community feed. AI moderation and sentiment analysis support a moderator role.

**Positioning note:** EndoPartner is **AI-powered, not AI-native.** AI generates questions, suggests commitments, and moderates content — but the product's core value is the conversation structure between two humans. This is a deliberate, honest claim.

## 5. Functional requirements

| # | Requirement | Status |
|---|---|---|
| F1 | Account creation, login, password reset | Built |
| F2 | Partner joins via tokenized invite link, no account | Built |
| F3 | Three sequential guided sessions, locked until previous completes | Built |
| F4 | AI question generation per couple and language | Built |
| F5 | Answers hidden until both partners submit (RLS-enforced) | Built |
| F6 | Reveal screen with both answers | Built |
| F7 | Commitments with AI suggestions | Built |
| F8 | PDF export of completed sessions | Built |
| F9 | Community feed with **explicit opt-in** sharing | **Must fix — currently opt-out** |
| F10 | Moderator role: flagged messages, live sessions | Built |
| F11 | In-app account & data deletion | Backlog — email process only today |
| F12 | Settings/profile page (name, language, invite link) | Backlog — promised in copy, doesn't exist |
| F13 | Full interface translation FR / ES | Backlog — only questions are translated today |

## 6. Non-functional requirements

- **Privacy is the product.** Intimate health-adjacent content. GDPR applies (operating from France): consent must be an affirmative act, right to erasure honored. Row-Level Security on every table (56 policies in place). No selling data, no ads, no tracking. Sharing defaults must always be the most private option.
- **Accessibility.** WCAG 2.2 AA target: minimum 4.5:1 text contrast, labels on all interactive elements, full keyboard navigation.
- **Cost.** Free forever for users. Stack must stay near-zero cost (Lovable + Supabase free tiers, serverless AI calls).
- **Trust signals.** Custom domain, own branding in all metadata, honest claims only — every promise in the UI must be true in the code.

## 7. Success measures

- A couple completes session 1 together (activation).
- A couple completes all three sessions (core value delivered).
- At least one commitment created per completed session.
- Zero gap between privacy claims and actual behavior (audited, not assumed).

## 8. Out of scope (v1–v2)

- Medical advice, symptom tracking, or anything diagnostic — EndoPartner is about the relationship, not the treatment.
- Native mobile apps.
- Monetization.

## 9. Risks

- **Trust risk:** any privacy claim/code mismatch destroys the product's reason to exist. Mitigation: privacy items always ordered first in the backlog; audit before every release.
- **Sensitivity risk:** AI-generated questions on an intimate health topic can miss the tone. Mitigation: moderation function in place; question prompts reviewed regularly.
- **Solo-builder risk:** one person, limited build credits. Mitigation: ruthless ordering of the backlog; prototype-first method keeps waste low.

## 10. Companion document

The ordered Product Backlog lives in `endopartner-product-backlog.md`. The PRD says where we're going; the backlog says what's next, in order.

---

*Made the simple way: build, learn, then write it down.*
