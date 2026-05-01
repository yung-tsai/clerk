# Plan: Update sort-tasks to extract + sort from raw input

## Edge Function (`supabase/functions/sort-tasks/index.ts`)
Replace entire file with Claude's new version, with one tweak:
- Accept an optional `timezone` field in the body. If provided, use it for the date-string formatting; otherwise fall back to `America/Chicago`.
- Keep backwards-compat: still accepts `{ titles: [...] }` (joined with `, `).

## Front end — both call sites send raw input + timezone

**`src/pages/AppHome.tsx` (`processInput`, ~L206–L233)**
- Replace empty-check: `if (!raw.trim()) return;`
- Keep `const parts = raw.split(/[,;]/).map(s => s.trim()).filter(Boolean);` — used only for local fallback.
- Change invoke body to:
  ```ts
  body: { input: raw, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  ```
- Local fallback path unchanged (still maps `parts` through `classify`).

**`src/pages/Onboarding.tsx` (~L64–L91)**
- Keep `const parts = seed.split(/[,;\n]/)...` for the empty check and fallback.
- Use `seed` (the raw trimmed string) as `input`.
- Change invoke body to:
  ```ts
  body: { input: seed, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  ```
- Local fallback path unchanged.

## Out of scope
- No prompt edits beyond what Claude provided (Claude's territory).
- No UI changes, no schema changes.

## Verification
- Type new tasks with no commas ("call mom finish report buy milk") — should split into 3 tasks.
- Type comma-separated input — still works.
- Onboarding seed flow — still works.
- AI failure → local comma-split fallback still fires.
