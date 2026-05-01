# Option A + Focus page polish

## 1. Planner desktop: show all 4 columns (Option A)

In `PlannerDesktop` (`src/pages/AppHome.tsx`):
- Bump container `max-w-[1280px]` → `max-w-[1440px]`.
- Keep columns at `320px` × 4 (1280px of columns + dividers fit comfortably inside 1440px - 80px horizontal padding).
- Remove the left/right blue scroll arrow buttons entirely.
- Remove the right-edge fade overlay.
- Keep `overflow-x-auto` on the inner scroller as a graceful fallback for narrow laptops (<1280px), but no chrome.

## 2. Focus page: true-center the chrome

The header uses `flex justify-between`, so "Focus | Planner" sits in the middle of remaining space, not the actual viewport center. Same visual drift the user spotted.

- Change the header inner container from `flex justify-between` to `grid grid-cols-3 items-center` with `justify-self-start` (logo) / `justify-self-center` (toggle) / `justify-self-end` (streak). Now the toggle is true-centered regardless of side widths.
- AppBar is already `left-1/2 -translate-x-1/2` (true viewport-centered) — no change needed.
- FocusView content (date heading + task column) is already wrapped in `max-w-[420px] mx-auto` — that part is fine.

## 3. Focus page: inline "+" card at bottom of list

`FocusView` calls `DroppableColumn` without `onAddTask`, so no add card renders. Add it.

- Pass `onAddTask` from `AppHome` down into `FocusView` (new prop), then forward to `DroppableColumn`.
- Reuses the existing `handleAddToColumn("today")` flow → creates blank task in Today, opens detail modal with title autofocused. Same UX as the per-column add we just shipped on Planner.

## Technical notes

Files to edit:
- `src/pages/AppHome.tsx`
  - Header inner container: `flex justify-between` → `grid grid-cols-3 items-center` with `justify-self-*` on each child.
  - `FocusView` signature: add `onAddTask: (col: ClerkCol) => void`. Forward to `DroppableColumn`.
  - Caller of `<FocusView />` (line ~641): pass `onAddTask={handleAddToColumn}`.
  - `PlannerDesktop`: `max-w-[1280px]` → `max-w-[1440px]`. Delete the `canRight` fade `<div>` and both `canLeft`/`canRight` `<button>`s. Remove now-unused `ChevronLeft`/`ChevronRight` imports and the `canLeft`/`canRight`/`scrollByCol` state if nothing else uses them.

No DB or schema changes.
