## What I understood
1. Use the uploaded `Clerk.png` as the wordmark next to the mascot.
2. Onboarding's "Let's go" should NOT silently insert tasks. It should:
   - Save the profile (name, character, onboarded, view_mode = `planner`)
   - Call `sort-tasks` with the brain dump
   - Navigate to `/app` carrying the proposals in router state
   - `/app` lands on **Planner** view and immediately opens the proposal modal pre-filled
   - User reviews/adjusts → "Looks good" inserts via the same `acceptProposals` path

The blank screen you saw is from the silent error path in onboarding's current `finish()` — it inserts directly with `position: Date.now() + i`, which overflows Postgres `int` (the same `1777...` error from earlier). Routing through `acceptProposals` (with the position fix) resolves it cleanly.

## Changes

### Logo wordmark
- Save `Clerk.png` → `src/assets/clerk-logo.png` (already copied).
- `src/pages/AppHome.tsx` header: replace the `<span>CLERK</span>` mono text with `<img src={clerkLogo} alt="Clerk" style={{ height: 22 }} />`. Mascot stays to its left.
- `src/pages/Landing.tsx` header: same swap (mascot + logo image).

### Position int overflow fix
In `src/pages/AppHome.tsx` `acceptProposals`: replace `position: Date.now() + i` with `position: Math.floor(Date.now()/1000) + i` (fits int32 until 2038, preserves order).

### Onboarding → Planner + proposal modal
**`src/pages/Onboarding.tsx` `finish()`** — rewrite:
1. Update `profiles` with `display_name`, `character`, `onboarded: true`, `view_mode: "planner"`.
2. Parse the brain dump into titles. If empty, navigate to `/app` and stop.
3. Call `supabase.functions.invoke("sort-tasks", { body: { titles } })`. On error/empty, fall back to local `classify()` (already imported in AppHome — I'll import it here too).
4. `navigate("/app", { state: { pendingProposals: sorted } })`.
5. Show a toast on actual failure (not on AI fallback).

**`src/pages/AppHome.tsx`** — on mount:
1. Read `useLocation().state?.pendingProposals`. If present:
   - `setView("planner")` and persist `view_mode = "planner"`.
   - `setProposals(pendingProposals)` so the existing Dialog opens automatically.
   - Clear router state via `window.history.replaceState(null, "", location.pathname)` so a refresh doesn't re-open it.

This reuses the existing in-app proposal modal and `acceptProposals` insertion path — single source of truth, and the user gets the same character "Here's where I'd put these" review they expect.

## Files touched
- `src/assets/clerk-logo.png` — new (copied)
- `src/pages/AppHome.tsx` — logo swap, position fix, mount-time proposal seeding from router state, default to planner when arriving from onboarding
- `src/pages/Landing.tsx` — logo swap
- `src/pages/Onboarding.tsx` — `finish()` rewritten to sort + navigate with state instead of inserting

No DB changes.
