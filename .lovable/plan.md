# Final launch pass: secure demo, lock function, add analytics

Three changes to close out P0 + P1 launch scope.

---

## 1. Make onboarding demo client-side only (security + cost)

**Problem:** `src/pages/Onboarding.tsx` (line 87) calls `supabase.functions.invoke("sort-tasks", ...)` during the unauthenticated brain-dump demo. With `verify_jwt = false`, anyone can hammer the endpoint and burn Lovable AI credits. Flipping `verify_jwt = true` would break the demo for logged-out visitors.

**Fix:**
- Remove the `supabase.functions.invoke("sort-tasks", ...)` call from `Onboarding.tsx`.
- Use the existing `classify()` from `@/lib/clerk-classify` directly to build `sorted` proposals — same code path as the current fallback (lines 98–101).
- Drop the try/catch around the invoke; just map locally.
- Keeps the demo instant, offline-capable, and free.
- `AppHome.tsx` keeps using the live `sort-tasks` function (real AI sorting once signed in).

## 2. Lock down `sort-tasks` edge function

- In `supabase/config.toml`, add a `[functions.sort-tasks]` block with `verify_jwt = true`.
- Verify `AppHome.tsx` calls it via `supabase.functions.invoke()` (it does, line 246) — JWT attaches automatically, no client changes needed.
- After step 1, no unauthenticated caller exists, so this is safe to flip.

## 3. PostHog analytics

- Add `posthog-js` dependency.
- Create `src/lib/analytics.ts` that initializes PostHog with `VITE_POSTHOG_KEY` (EU host `https://eu.i.posthog.com` by default; ask user if they prefer US).
- Initialize once in `src/main.tsx`. No-op if key missing so local/dev keeps working.
- Add `identify(user.id)` on auth success (in `Auth.tsx` after sign-in and in the auth state listener) and `reset()` on sign-out (in `SettingsModal.tsx`).
- Capture key MVP events:
  - `landing_cta_clicked` (Landing.tsx)
  - `signup_started` / `signup_completed` (Auth.tsx)
  - `onboarding_completed` (Onboarding.tsx)
  - `tasks_sorted` with `{ count, source: "ai" | "fallback" }` (AppHome.tsx)
  - `task_completed` (AppHome.tsx)
  - `account_deleted` (SettingsModal.tsx)
- Add a one-line cookie/analytics mention to `Privacy.tsx`.

**Secret needed:** `VITE_POSTHOG_KEY` — I'll request it via the secret prompt after you approve. Get it from PostHog → Project Settings → Project API Key (the public `phc_...` one, safe to ship in client bundle).

---

## Files touched

- `src/pages/Onboarding.tsx` — remove invoke, use local `classify` directly
- `supabase/config.toml` — `[functions.sort-tasks] verify_jwt = true`
- `src/lib/analytics.ts` — new, PostHog wrapper
- `src/main.tsx` — init PostHog
- `src/pages/Landing.tsx`, `src/pages/Auth.tsx`, `src/pages/Onboarding.tsx`, `src/pages/AppHome.tsx`, `src/components/SettingsModal.tsx` — capture events
- `src/pages/Privacy.tsx` — analytics disclosure
- `package.json` — add `posthog-js`

## Out of scope

- Self-host vs PostHog Cloud — defaulting to Cloud EU.
- Session replay / heatmaps — off by default; can enable post-launch.
- Cookie consent banner — PostHog Cloud EU is GDPR-compliant without one for basic product analytics, but if you want an explicit opt-in banner, say so and I'll add it.
