## Fix: Use local timezone for day-boundary checks

### Problem
`isNewDay()` and all `last_active_date` reads/writes use `toISOString().slice(0, 10)`, which is UTC. For users west of UTC (e.g. Central Time), the UTC date flips to "tomorrow" hours before local midnight — causing carry-over and streak logic to run too early.

### Changes

**1. `src/lib/carry-over.ts`**
- Add exported helper `localDateStr(date = new Date()): string` using `toLocaleDateString('en-CA')`
- Update `isNewDay()` to use `localDateStr(today)` instead of `today.toISOString().slice(0, 10)`

**2. `src/pages/AppHome.tsx`**
- Import `localDateStr` from `carry-over.ts`
- Line 175 (stamp `last_active_date` on load): replace `new Date().toISOString().slice(0, 10)` with `localDateStr()`
- Line 397 (streak "today"): same replacement
- Line 402 (streak "yesterday"): replace `new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)` with `localDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))` so "yesterday" is truly local yesterday, not UTC 24h ago

No DB schema changes. `last_active_date` remains a string column; only the format switches from UTC to local, which self-corrects on next app load.
