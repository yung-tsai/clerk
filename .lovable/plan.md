## Problem

When the web app loads on a new calendar day, `planCarryOver()` shifts every `col: "tomorrow"` task → `today`. That's correct for tasks the user planned yesterday — but it also catches tasks Wes (or anything else) just inserted with `col: "tomorrow"`, because the only check is "is today a new day vs. `last_active_date`?"

Result: a task Wes inserts as Tomorrow gets silently moved to Today the next time the web app opens on a different day from the last web visit.

## Fix

Add a "created today" guard to the rollover so a `tomorrow` task is only pulled forward to `today` if it was created **before today** (the user's local day).

### Change 1 — `src/lib/carry-over.ts`

- Extend `CarryTask` to include `created_at: string` (ISO timestamp from Supabase).
- In `nextColForTask`, before returning `"today"` for a `tomorrow` task, compare the task's `created_at` date (in local time) to `today`. If they're the same calendar day, return `null` (leave it in Tomorrow).
- Apply the same guard to the `upcoming → today` / `upcoming → tomorrow` branches for consistency, so a freshly-inserted `upcoming` task with a near due_date isn't yanked forward on first load.
- Helper: `isSameLocalDay(iso: string, today: Date)` that compares year/month/date in local time.

### Change 2 — `src/pages/AppHome.tsx`

- The `Task` type already includes `created_at` (selected via `select("*")`), so `planCarryOver(loadedTasks)` will pass it through — no call-site changes needed beyond confirming the field flows in.

### Change 3 — Tests (optional but cheap)

If `src/test/` has room, add a unit test covering:
- `tomorrow` task created today → stays in `tomorrow`
- `tomorrow` task created yesterday → moves to `today`
- `upcoming` task created today with due_date today → stays in `upcoming`

## Out of scope

- No DB migration. No trigger. No changes to Wes. No change to `last_active_date` stamping behavior.
- No changes to AI prompt or sort logic (Claude's territory).

## Why this works

`tasks.created_at` is set server-side by Postgres (`default now()`), so it's reliable regardless of which client (web or Wes) inserted the row. The guard means rollover only ever moves tasks the user planned on a previous day — exactly the original intent.
