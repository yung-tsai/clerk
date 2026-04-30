## What I'll ship

Google sign-in + password reset flow. Both are MVP-shaped, contained, and require no DB changes.

---

### 1. Google sign-in

Add a "Continue with Google" button on the auth page (above email/password). Lovable Cloud manages Google OAuth credentials automatically — no API keys, no Google Console setup.

- Calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/app' } })`
- Browser redirects to Google → user signs in → redirects back to `/app`
- The existing onboarding redirect logic in `AppHome` already handles "first-time user" routing (sends to `/onboarding` if `onboarded === false`), so first Google sign-in lands in onboarding correctly via the existing `handle_new_user` trigger that creates the profile.
- Button shows on both signup and signin tabs; hidden on the new "forgot password" view.

### 2. Password reset

Two pieces:

**a) "Forgot password?" link on the auth page (sign-in mode only)**
- Switches the form to a "reset password" mode (just email field)
- On submit: `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })`
- Toast confirms; switches back to sign-in
- Lovable Cloud sends the default password reset email automatically (no domain/template setup needed for MVP)

**b) New `/reset-password` page**
- User lands here from the email link with a recovery session in the URL hash
- Waits for Supabase to exchange the token (listens for `PASSWORD_RECOVERY` / `SIGNED_IN` event)
- Shows two password fields (new + confirm)
- On submit: `supabase.auth.updateUser({ password })`
- On success: toast + redirect to `/app`
- Validates: matching passwords, 8+ chars

---

### Files

**New:**
- `src/pages/ResetPassword.tsx`

**Edited:**
- `src/pages/Auth.tsx` — add Google button + Google icon, add "forgot" mode with email-only form, add "Forgot password?" link in signin mode
- `src/App.tsx` — register `/reset-password` route

**No DB migration. No edge functions. No new dependencies.**

---

### Voice / copy

Following the existing `Auth.tsx` tone (terse, plain-language H1s):
- Forgot password H1: "Reset password" / sub: "We'll email you a reset link"
- Reset page H1: "Set a new password" / sub: "Pick something you'll remember this time."
- Success toast: "Check your email for a reset link."

---

### Out of scope (deliberately)

- **Custom-branded auth emails** — defaults work for MVP; revisit when a custom domain is set up
- **Magic link sign-in** — handoff mentioned it; can add later as a third option if you want zero-password
- **"Currently signed in as X" indicator** — separate small chunk
- **Apple sign-in, etc.** — Google covers the bulk for MVP

### Claude's territory check

None of this touches the AI. Pure auth plumbing.

Approve and I'll build it.