# Proactive intelligence + interactive bubbles

Three new behaviors that nudge the user from above Wes, plus a leftover timezone fix. All nudges share one new interactive bubble component — never modal, always dismissible, always two buttons, one at a time.

## Heads up before building

- **Carry-over timezone fix is already done** for `isNewDay()` and the streak "today/yesterday" reads in `AppHome.tsx`. There's still **one missed spot** at `AppHome.tsx` lines 503/506 inside `bumpStreakIfTodayCleared` that uses `toISOString().slice(0,10)`. I'll fix that as part of this work — same `localDateStr()` helper.
- **Copy on the bubbles is Claude's territory** per the project rules (anything the AI "says" to the user). I'll wire the bubbles with placeholder strings using your exact spec text and flag in code where Claude should approve/replace the copy. No tone bank changes.

## What gets built

### 1. New `ActionBubble` component

A second bubble layer above Wes that supports two action buttons. The existing passive `bubble` (greetings, quips, "Thinking…") stays exactly as it is.

- Lives in `AppBar.tsx` next to current bubble. When an action bubble is showing, the passive bubble is suppressed so they never overlap.
- Same dark pill styling as the current bubble, with a row of two inline buttons underneath the text (primary + secondary).
- Auto-dismisses after **8s** if ignored. Clicking either button or pressing Escape dismisses immediately. Buttons fire callbacks supplied by the trigger.
- Non-blocking: pointer events only on the buttons, the rest of the app stays interactive.

### 2. New `useProactiveNudges` hook

Single source of truth so only one nudge ever shows, with a clear priority order. Lives in `src/hooks/use-proactive-nudges.ts`.

Priority (first match wins, others skipped this cycle):
1. **Avoidance** — oldest task in Today with `created_at` ≥ 3 local days ago. Buttons: *Yes, keep it* (dismiss) / *Move to Someday* (update `col` to `someday`).
2. **Overload** — Today count ≥ 7. Buttons: *Sure* (open the existing Move sheet, prefilled with Today) / *I've got this* (dismiss).
3. **Light day** — Today count ≤ 1 AND (Tomorrow + Upcoming) > 0. Buttons: *Yes please* (move oldest item from Tomorrow → Today, fall back to Upcoming) / *I'm good* (dismiss).

Triggers:
- On app load, after profile + tasks fetch.
- On any task add / move / complete (debounced 500ms so a multi-task accept doesn't fire mid-stream).

Per-session suppression: once the user dismisses a nudge type, don't refire that same type for the rest of the session (in-memory `Set`, no DB). Avoidance suppression is per-task-id so a different stale task can still surface tomorrow.

### 3. Wiring in `AppHome.tsx`

- Call `useProactiveNudges({ tasks, profile, onMoveToSomeday, onPullForward, onOpenMoveSheet })`.
- Pass new `actionBubble` state into `<AppBar />` alongside existing `bubble`/`bubbleVisible`.

### 4. Timezone fix cleanup

`src/pages/AppHome.tsx` lines 503 + 506 — replace the two `toISOString().slice(0,10)` calls in `bumpStreakIfTodayCleared` with `localDateStr()` and `localDateStr(new Date(Date.now() - 86_400_000))`. No other files touched for this.

## Files

- **new** `src/components/ActionBubble.tsx` — presentational, two-button bubble.
- **new** `src/hooks/use-proactive-nudges.ts` — detection + priority + per-session suppression.
- **edit** `src/components/AppBar.tsx` — render `<ActionBubble>` above existing bubble; suppress passive bubble while action bubble visible.
- **edit** `src/pages/AppHome.tsx` — invoke hook, supply handlers, fix two timezone lines.

No DB schema changes, no edge function changes, no new dependencies.

## Copy (placeholder — Claude to confirm)

Using your spec strings verbatim for now. I'll add `// COPY: Claude review` comments next to each so they're easy to find:

- Overload: `"You have {count} things today. That's a lot. Want me to suggest moving some?"` → *Sure* / *I've got this*
- Light day: `"Today is looking light. Want me to pull something forward?"` → *Yes please* / *I'm good*
- Avoidance: `"\"{title}\" has been here for 3 days. Still on?"` → *Yes, keep it* / *Move to Someday*

## Out of scope

- New tone bank entries in `clerk-quips.ts` (Claude territory).
- Any AI-call changes (no edits to `sort-tasks` edge function or prompts).
- Surfacing a "clear Today to keep your streak" hint on the streak card — separate decision from earlier conversation.
