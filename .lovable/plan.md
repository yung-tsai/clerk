# Wire Clerk's quip library (tone-keyed)

Replace placeholder microcopy with the new lines, structured so additional tones can be added later without touching call sites.

## Architecture

New file: **`src/lib/clerk-quips.ts`**.

```ts
export type ClerkTone = "collegial"; // future: "drill", "soft", "deadpan", etc.

export type QuipKey =
  | "greeting.morning" | "greeting.afternoon" | "greeting.evening" | "greeting.anon"
  | "accept" | "accept.allToday"
  | "move.today" | "move.tomorrow" | "move.upcoming" | "move.someday"
  | "move.today.fromFuture" | "move.someday.fromToday" | "move.disagree"
  | "complete.normal" | "complete.allToday"
  | "milestone.tasks.5" | "milestone.tasks.10" | "milestone.tasks.50"
  | "milestone.streak.3" | "milestone.streak.7" | "milestone.streak.30"
  | "error.ai";

type QuipBank = Record<ClerkTone, Partial<Record<QuipKey, string[]>>>;

const QUIPS: QuipBank = {
  collegial: { /* all the new lines, bucketed */ },
};

const ACTIVE_TONE: ClerkTone = "collegial";

export function quip(key: QuipKey, vars?: { name?: string | null }): string;
export function quipForMove(prevCol, nextCol, opts: { withinDisagreeWindow: boolean }): string;
```

`quip()` reads `QUIPS[ACTIVE_TONE][key]`, picks a random line, fills `{name}` (drops the comma + name gracefully if no name). Falls back to another tone's bucket only if the active tone is missing the key — so future tones can be partial.

Switching tone later = add a key to `QUIPS` + flip `ACTIVE_TONE` (eventually driven by user preference). No call-site changes.

## Two distinct "all today" moments

1. **`accept.allToday`** — sort returned and **every** proposal landed in `today`. Fires from `acceptProposals` instead of the regular `accept` quip. Short, positive, no modal. Detection: `proposals.every(p => p.col === "today")`.
2. **`complete.allToday`** — user just completed the **last** task in the today column. Fires from `completeTask`. The bigger moment — uses `{name}` and a more special line. Detection: completed task's col was `today` AND remaining today tasks = 0.

The new collegial bank for these:

- `accept.allToday`: short wins like `["All today. Let's go.", "Everything for today. Get to it.", "All on today's plate. Start anywhere."]`
- `complete.allToday`: the celebratory ones from the spec — `"That's everything, {name}. Nice."`, `"Today is clear. Rare."`, `"All done. Seriously impressive."`, `"Nothing left for today. Go outside."`, `"Clean slate. Don't waste it."`

Note on `complete.allToday`: a few of these include `{name}`, but the bank stores them as-is and `quip()` substitutes/strips the placeholder cleanly when no name exists.

If a milestone *also* hits on the same completion (e.g. 10th task that also clears today), the milestone wins — more notable. `complete.allToday` wins over `complete.normal`.

## Trigger map

| Event | QuipKey | Site |
|---|---|---|
| App load — has name, morning/afternoon/evening | `greeting.morning|afternoon|evening` | `AppHome` initial load |
| App load — no name | `greeting.anon` | same |
| Accept sort — mixed columns | `accept` | `acceptProposals` (replaces `"Sorted."`) |
| Accept sort — all in today | `accept.allToday` | same, branched |
| Manual move (any direction) | resolved via `quipForMove(prevCol, nextCol, ...)` | `moveTask` AND `handleDragEnd` |
| Complete task (normal) | `complete.normal` | `completeTask` |
| Complete LAST today task | `complete.allToday` | `completeTask` |
| 5 / 10 / 50 done | `milestone.tasks.{n}` | `completeTask` |
| 3 / 7 / 30 day streak | `milestone.streak.{n}` | `completeTask` |
| AI sort fails / 429 / 402 | `error.ai` | `processInput` catch |

### Move resolution rules (inside `quipForMove`)

Priority order:
1. **Disagree window** (move within ~10s of accepting a sort) → `move.disagree`. Window cleared after first use so it fires once per sort.
2. **Future → today** (`prevCol ∈ {upcoming, someday}` && `nextCol === today`) → `move.today.fromFuture`.
3. **Today → someday** (`prevCol === today` && `nextCol === someday`) → `move.someday.fromToday`.
4. **Default** → bucket by `nextCol` (`move.today|tomorrow|upcoming|someday`).

### Drag-and-drop

`handleDragEnd` currently moves tasks silently. Wire it to `quipForMove(prevCol, targetCol, ...)` using the active task's pre-drag col — same call as `moveTask` (which is used by TaskDetailModal's "Move to" buttons).

## Greeting

Existing greeting code already computes `timeOfDay` via local timezone — reuse it. Replace the inline `GREETINGS` const with `quip("greeting.{timeOfDay}", { name })` (or `greeting.anon` when no name).

## Existing strings being removed

In `src/pages/AppHome.tsx`:
- `GREETINGS` const (~L61–66)
- inline `STREAK_LINES` and `TASK_LINES` (~L309–319) — note thresholds change from {1,10,50,100} to {5,10,50}
- inline `["Done. Next.", ...]` array (~L331)
- `"Sorted."` literal (~L275)

## Out of scope (intentionally not touching)

These have no replacement in the new spec — keeping current copy:
- `"Thinking..."` indicator while sort runs
- `clerkSay("All tasks cleared.")` from settings
- `"History cleared."` in CompletedModal
- `"Coming soon — account sync is on the way."` in SettingsModal
- Auth / ResetPassword success messages

If you want those folded into the tone bank too, say so.

## Files touched

- `src/lib/clerk-quips.ts` — new (tone-keyed bank + `quip()` + `quipForMove()`)
- `src/pages/AppHome.tsx` — wire all triggers, drop inline arrays, add disagree-window ref + all-today detection (both flavors), fire quips from drag-end
- `src/lib/clerk-say.ts` — update top-of-file comment to point at `clerk-quips.ts` as the source of truth (no behavior change)
