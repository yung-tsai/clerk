# Characters + Gamification

## Model
- **3 characters**: Wes (unlocked), Rex (locks until 7-day streak), Frank (locks until 30 lifetime tasks).
- **Each has 2 body variants** (v1, v2). User picks character, then variant toggle below.
- DB stores a single string like `"wes:v1"`, `"rex:v2"` in the existing `profiles.character` column. Legacy values (`wes`, `wes-v2`, `wes-v3`, `blue`, `coral`) migrate silently to `"wes:v1"`.

## 1. Character refactor

`src/lib/characters.ts` — rewrite:
- `Character = "wes" | "rex" | "frank"`, `Variant = "v1" | "v2"`
- `CharacterChoice = { character: Character; variant: Variant }`
- `CHARACTER_META`: label, description, unlock rule (`{type:"none"} | {type:"streak", value:7} | {type:"tasks", value:30}`)
- `parseCharacter(raw)` / `serializeCharacter(choice)` — handles legacy strings
- `isCharacterUnlocked(character, { streak, tasksCompleted })`
- `unlockHint(character)` → `"7-day streak"` / `"30 tasks done"` / `null`

`src/components/ClerkCharacter.tsx`:
- Props become `{ character: Character; variant: Variant; ... }`
- Refresh `wes:v2` config from new `wes-v2-2.svg` (uploaded)
- Add `rex:v1`, `rex:v2`, `frank:v1`, `frank:v2` configs (parse paths/eyes/pupils from uploaded SVGs, gradient stops from each)
- Drop `wes:v3`

Assets to copy from uploads → `src/assets/`: `wes-v2-2.svg`, `rex.svg`, `rex-v2.svg`, `frank.svg`, `frank-v2.svg`. Delete `wes-v3.svg` from registry (file can stay).

## 2. Selector UI (Onboarding step 2 + Settings)

```text
┌─────────────────────────────────────────┐
│   [Wes]      [Rex 🔒]    [Frank 🔒]     │  ← character row
│  selected   7-day streak  30 tasks      │
├─────────────────────────────────────────┤
│         (  v1  ) ( v2 )                 │  ← variant toggle (only for selected)
└─────────────────────────────────────────┘
```

- Locked character tiles are disabled, show 🔒 + unlock hint copy.
- Variant toggle hidden when selected character is locked (it can't be selected anyway — picking a locked tile is a no-op).
- Save fires on either change. AppBar mascot live-previews.

Touched: `src/pages/Onboarding.tsx` (CharacterStep), `src/components/SettingsModal.tsx` (Profile card character grid).

## 3. Streak: cleared by complete OR move

`src/pages/AppHome.tsx` already bumps streak when completing a task and Today goes empty (~line 351). Extend so move/delete that empties Today also runs the same bump (extract to helper `bumpStreakIfTodayCleared(profile)`).

## 4. Unlock celebrations

New `src/components/UnlockCelebration.tsx` — fullscreen overlay with mascot + speech bubble + dismiss.
- Triggered from `AppHome.tsx` when streak crosses 7 (Rex) or `tasks_completed` crosses 30 (Frank).
- Speech copy is placeholder — flag for Claude to rewrite (mascot voice = Claude's territory).
- Persisted in localStorage so it fires once per user.

## 5. PostHog events

Add `track()` calls (analytics already wired):
- `first_sort_completed` — once after first AI sort returns (localStorage guard).
- `streak_7_reached` — same moment as Rex unlock.
- `tasks_30_reached` — same moment as Frank unlock.

You build the 2-question surveys in PostHog targeting these event names. No in-app survey UI.

## 6. Settings stats

Already shows `🔥 day streak` and `✓ tasks done` tiles + milestone list. No change needed — the request is already satisfied.

## Out of scope
- In-app survey UI
- "Premium" framing (you confirmed auto-unlock only)
- Mascot speech-bubble wording (Claude rewrites)
- AI prompt / sort logic

## Files
- `src/lib/characters.ts` (rewrite)
- `src/components/ClerkCharacter.tsx` (props + 5 variant configs, drop v3)
- `src/components/UnlockCelebration.tsx` (new)
- `src/pages/AppHome.tsx` (move-clears-streak, unlock triggers, event fires)
- `src/pages/Onboarding.tsx` (new selector)
- `src/components/SettingsModal.tsx` (new selector, uses streak+tasks for lock check)
- `src/assets/` (5 new SVGs copied from uploads)

No DB schema changes — `streak`, `tasks_completed`, `character` already exist.
