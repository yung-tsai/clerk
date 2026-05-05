# Mobile move-between-columns + first-task hint

## Part 1 — Replace chip with long-press → Move sheet

The mobile column chip is the wrong affordance: it adds clutter to every card and competes with the card tap. Replace it with a long-press gesture that opens a bottom "Move task" sheet.

**Interaction (mobile only, <768px):**
- Short tap card → opens Task Detail modal (unchanged).
- Long-press card (~400ms) → opens "Move task" sheet with 4 large column buttons. Tap a column → moves task, sheet closes, toast confirms.
- Vertical drag inside a column → reorder (unchanged).
- Cross-column drag is disabled on mobile (long-press is the move path; horizontal drag fights the column swipe).

**Files:**

- **`src/components/TaskCard.tsx`**
  - Remove the column chip + Popover and `onMoveCol` prop entirely.
  - Add `onLongPress?: () => void` prop. Implement via pointerdown timer (400ms), cancelled on pointermove >6px or pointerup. When fired, suppress the subsequent click and skip `onOpen`.
  - Keep existing drag listeners; long-press timer runs alongside and only fires if no drag movement occurred.

- **`src/components/MoveTaskSheet.tsx`** (new)
  - Bottom `Sheet` with `MobileSheetHeader` ("Move task" + Close).
  - Props: `task`, `onOpenChange`, `onMove(col)`.
  - Renders 4 column buttons using existing column swatches (`#CEDAFF`, `#FFF7CE`, `#CEFFE7`, `#FFCEFB`). Current column is dimmed and labeled "Current".
  - Tap → call `onMove`, close sheet, fire sonner toast ("Moved to Tomorrow").

- **`src/pages/AppHome.tsx`**
  - Add `moveSheetTask` state at page level. Render `<MoveTaskSheet>` once, calling existing `moveTask(t, col)`.
  - Thread `onLongPress={() => setMoveSheetTask(t)}` down through `FocusView` / `PlannerView` / `PlannerMobile` / `PlannerDesktop` / `DroppableColumn` to `TaskCard`. Gate on `useIsMobile()` so desktop passes `undefined`.
  - Remove all `onMoveCol` plumbing added in the previous pass.
  - dnd-kit: keep within-column reorder. Scope mobile collision so cross-column drops are ignored (within-column reorder still works).

**Keep as-is from previous pass:** the viewport-locked planner layout and fixed bottom AppBar fix. That part addressed the original bug correctly.

## Part 2 — First-task long-press hint (same PR)

After a user creates their first task, show a one-time mobile coachmark teaching the long-press gesture.

**Trigger:** mobile-only, fires once when task count transitions from 0 → ≥1, gated by `localStorage.clerk_hint_longpress_seen`.

**UI:** small pill anchored above the user's first card (no full-screen modal):

```
┌──────────────────────────┐
│  [first task card]       │
│                          │
│   Hold to move ↓         │  ← coachmark pill
│   between columns        │
│        [Got it]          │
└──────────────────────────┘
```

- Backdrop is light (rgba(0,0,0,0.15)) — card stays visible and tappable for the gesture.
- Dismisses on: tap "Got it", tap backdrop, OR after the user successfully long-presses any card once (whichever first).
- Sets `localStorage.clerk_hint_longpress_seen = "1"` on dismiss; never shows again.

**Files:**

- **`src/components/LongPressHint.tsx`** (new)
  - Fixed-position overlay anchored to the first task card via `getBoundingClientRect()` on mount + resize.
  - Pure CSS pill with arrow, "Got it" button, light backdrop.
  - Props: `targetEl: HTMLElement | null`, `onDismiss: () => void`.

- **`src/pages/AppHome.tsx`**
  - Add `showLongPressHint` state. On task list update, if `isMobile && tasks.length === 1 && !localStorage.getItem("clerk_hint_longpress_seen")`, set true.
  - Track ref to first card; pass to `<LongPressHint>`. Dismiss handler clears state + writes localStorage.
  - When `MoveTaskSheet` opens via long-press, also dismiss the hint (success path).

## Out of scope
- Drag-to-open-modal mid-gesture (too fragile on touch).
- Second nudge for repeat modal-movers (revisit after we see usage).
- Any change to Task Detail modal's "Move to" buttons.

## Files touched
- `src/components/TaskCard.tsx` — remove chip, add long-press
- `src/components/MoveTaskSheet.tsx` — new
- `src/components/LongPressHint.tsx` — new
- `src/pages/AppHome.tsx` — wire long-press + hint, render sheet, scope mobile drag, remove old `onMoveCol` plumbing
