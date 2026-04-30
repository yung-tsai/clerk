## What I'll ship

One infra feature from the original handoff that isn't built yet, plus saving the workflow rule to memory. **Nothing here touches Claude's territory** — the AI's prompt, what it sees, what it decides, and how it interprets input all stay exactly as they are.

---

### 1. Auto carry-over (day-rollover)

When the user opens the app on a new day, tasks shift forward so the columns stay accurate. This is pure date math + a DB update — no AI involved.

**Rules:**
- `tomorrow` → `today` when the calendar day changes
- `upcoming` → `tomorrow` when its named day is now 1 day away
- `upcoming` → `today` when its named day is today
- `someday` never moves
- `today` stays put (overdue handling stays as-is for now)

**How it works:**
- On app load, compare today's date to `profiles.last_active_date`.
- If different, walk through tasks once and update `col` for any that need to roll forward.
- Single batched DB update. Update `last_active_date` to today.
- The AI's original `reason` text stays untouched (Claude's wording — preserved).
- Runs silently. No proposal modal, no mascot announcement.

**Where in code:** New helper `src/lib/carry-over.ts` + a small effect in `AppHome.tsx`'s initial load block (right after tasks are fetched, before render).

---

### 2. Save workflow rule to memory

Persist the rule we just confirmed so future sessions respect it automatically:

- New: `mem://workflow/claude-handoff` — the full rule
- Update `mem://index.md` Core with one line:
  *"Claude's territory = anything touching the AI's intelligence: prompt, model, what gets sent to it, how it interprets input, reasoning style, what it decides. Don't touch — flag it. Everything else (infra, UI, plumbing, date logic) is mine."*

---

## What I'm NOT doing (Claude's territory — flagging for you)

- Not changing the system prompt in `sort-tasks/index.ts`
- Not changing the model
- Not changing what gets sent to the AI (no smarter pre-parsing, no extra context, no history)
- Not changing how the AI interprets brain-dump input
- Not editing reason wording or tone rules
- Not adding personalization/learning
- Not changing column definitions

## What I'm NOT doing (other chunks, save for later)

- Account creation nudges
- Calendar date picker
- iOS drag/keyboard fixes
- Voice input

---

## Files

**New:**
- `src/lib/carry-over.ts`

**Edited:**
- `src/pages/AppHome.tsx` — call carry-over on load
- `mem://index.md` + `mem://workflow/claude-handoff` — persist the rule

**No DB migration needed** — `last_active_date` already exists on `profiles`; `col` updates use existing RLS.

Approve and I'll build it.