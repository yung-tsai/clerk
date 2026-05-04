## Wes character system

Replace the abstract blue/coral mascots with **Wes** — a face-based character with three body variants and swappable expressions.

### Model

- **Variants** (user picks one): `wes` (default, blob with peaks), `wes-v2` (rounded blob), `wes-v3` (squiggle blob, locked)
- **Expression** (driven by app state): `neutral` (default smile), `determined` (one wide pupil — used while Clerk is sorting/thinking)
- Confused-silly face is built but not wired up yet — saved for later

Each variant defines the same parametric geometry the existing `ClerkCharacter` uses (body path, eye ellipses, pupil positions, lid rects, smile path) so cursor-tracking pupils + blink loop keep working across all three.

### Onboarding

Character picker (screen 2) shows 3 Wes tiles instead of the current 2 + 2 locked placeholders:

```text
[ Wes ]   [ Wes v2 ]   [ Wes v3 🔒 ]
                       Unlocks at 10 done
```

The v3 tile is visible but disabled with a small lock badge and helper line. Selecting it does nothing; tapping shows a tiny tooltip.

### Unlock moment

When a user's `tasks_completed` crosses from 9 → 10, fire a one-time celebratory toast: *"You unlocked Wes v3. Try it in Settings."* Tracked locally via a `wes_v3_unlocked_seen` flag in localStorage so it only fires once per user.

In **Settings**, v3 stays locked (greyed tile + lock) until `tasks_completed >= 10`.

### Migration

On first load after this ships, anyone with `character = 'blue'` or `'coral'` is silently migrated to `'wes'` (one update per session, guarded by a localStorage flag so we don't hammer the DB). The `'blue'`/`'coral'` enum values stay valid in the DB but are removed from the UI.

### Determined expression — when it shows

Anywhere we currently pass `thinking={true}` to `ClerkCharacter`, the character also swaps to its `determined` face. Today that's the AppBar (Clerk sorting), the Onboarding demo's thinking phase, and the modal save spinner. No new triggers.

---

### Technical details

**1. Save SVGs as design tokens, not assets.** Add the four uploaded SVGs (`wes.svg`, `wes-v2.svg`, `wes-v3.svg`, `wes-determined.svg`, `wes-confused-silly.svg`) to `src/assets/` for reference, but the actual rendering happens inline so eyes can animate.

**2. Rewrite `src/lib/characters.ts`:**
```ts
export type CharacterVariant = "wes" | "wes-v2" | "wes-v3";
export const CHARACTER_LABELS = { wes: "Wes", "wes-v2": "Wes v2", "wes-v3": "Wes v3" };
export const CHARACTERS: CharacterVariant[] = ["wes", "wes-v2", "wes-v3"];
export const UNLOCK_THRESHOLDS: Partial<Record<CharacterVariant, number>> = { "wes-v3": 10 };
export function isUnlocked(v: CharacterVariant, tasksCompleted: number): boolean { ... }
```

**3. Rewrite `src/components/ClerkCharacter.tsx`:**
- Replace the `BLUE`/`CORAL` configs with `WES`, `WES_V2`, `WES_V3` configs, each derived from the uploaded SVG (viewBox, body path + gradient, eye ellipse coords, pupil coords, lid coords, smile path).
- Add `expression?: "neutral" | "determined"` prop. When `determined`, the right pupil is rendered as the larger filled circle from `wes-determined.svg` (cx 65.9, ry ~12.5 → 13) and the left pupil is the same as neutral. Implementation: each variant config gets a `determinedPupilR` override.
- `thinking` prop continues to imply `expression="determined"` for back-compat (so AppBar / demo / modal automatically get the new face).
- Gradient fills (v1 + v2 use `#567CF8 → #4167E2`, v3 is solid `#567CF8`) — declare a `<linearGradient>` per variant with a unique id.
- Pupil-tracking and blink loop stay exactly as-is, just driven off the per-variant config like before.

**4. Onboarding (`src/pages/Onboarding.tsx`):**
- Default `character` state changes from `"blue"` → `"wes"`.
- `CharacterStep` renders the 3 real tiles, with v3 disabled + lock badge + "Unlocks at 10 done" caption. Remove the two placeholder "Soon" tiles. Update grid to `grid-cols-3`.
- Headline copy unchanged ("Pick your Clerk"); subhead becomes *"Three Wes flavors. v3 unlocks as you go."*

**5. Settings (`src/components/SettingsModal.tsx`):**
- Read `tasks_completed` from profile (already available there).
- Render the 3 Wes tiles; lock v3 with the same badge until threshold met.

**6. Unlock toast (`src/pages/AppHome.tsx`):**
- After a successful task completion that updates `tasks_completed`, check: if new value `>= 10`, old value `< 10`, and `localStorage.getItem('wes_v3_unlocked_seen') !== '1'` → fire sonner toast and set the flag.

**7. Migration:**
- In `AuthContext` (or wherever the profile is loaded into state on app boot), if `profile.character` is `'blue'` or `'coral'`, run a one-shot `update profiles set character='wes'` and update local state. Guard with `localStorage.setItem('wes_migrated', '1')`.

**8. DB:** No schema change needed — `character` is a free-text column with default `'blue'`. We do need a migration to **change the default to `'wes'`** for any future row inserts.

**9. Files touched:**
- `src/lib/characters.ts` (rewrite)
- `src/components/ClerkCharacter.tsx` (rewrite configs + add expression)
- `src/pages/Onboarding.tsx` (variant default + 3-tile grid)
- `src/components/SettingsModal.tsx` (variant grid + lock gating)
- `src/pages/AppHome.tsx` (unlock toast trigger)
- `src/contexts/AuthContext.tsx` (silent migration)
- `src/assets/wes*.svg` (reference copies)
- One DB migration: change `profiles.character` default to `'wes'`

### Out of scope (flag for later)
- Wiring `confused-silly` to empty state / idle
- Animating the expression *transition* (just a snap-swap for now)
- Additional Wes flavors beyond v3
