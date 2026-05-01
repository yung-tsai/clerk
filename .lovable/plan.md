## Fix Google OAuth redirect + simplify landing/auth backgrounds

### 1. Send users straight to the app after Google sign-in

**Problem:** `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` returns the user to `/` (Landing). Since they're now signed in, Landing just shows an "Open" link instead of routing to the app.

**Fix:** In `src/pages/Auth.tsx`, change `redirect_uri` from `window.location.origin` to `${window.location.origin}/app`.

`AppHome` already handles the new-user case — if the profile's `onboarded` flag is false, it auto-redirects to `/onboarding`. So `/app` is the correct single destination for both new and returning Google users.

### 2. Plain gray background on Landing + Auth

**Current:**
- `src/pages/Landing.tsx` uses `app-bg` (warm orange + blue radial gradients).
- `src/pages/Auth.tsx` uses `landing-bg` (heavier multi-color gradients).

**Fix:** Replace both with plain `bg-background` (the `#F5F5F3` warm gray defined as `--background` in the design tokens). No new colors introduced — just dropping the gradient layers.

The gradient utility classes (`landing-bg`, `app-bg`) stay defined in `index.css` in case they're used elsewhere, but Landing and Auth will no longer apply them.

### Files touched
- `src/pages/Auth.tsx` — update `redirect_uri`; swap `landing-bg` → `bg-background`.
- `src/pages/Landing.tsx` — swap `app-bg` → `bg-background`.