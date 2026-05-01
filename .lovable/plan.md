# Planner refinements

Three changes to make the Planner board easier to scan and faster to add to.

## 1. Make 'Someday' more discoverable

Tighten column padding so 'Someday' partially shows on common desktop widths, AND keep a soft right-edge fade as a visual hint that more is there. Arrows stay.

- Reduce inter-column padding from `pr-7` / `pl-7` (28px) to `pr-4` / `pl-4` (16px). Also reduce column width from `380px` to `320px`. Net effect: at ~1280px viewport, Today + Tomorrow + Upcoming fit fully and ~80–100px of 'Someday' peeks.
- Add a 24px right-edge gradient fade overlay inside the scroller container (white → transparent), only visible when `canRight` is true. Pure visual hint, doesn't block clicks (`pointer-events-none`).
- Keep arrows for full navigation.

## 2. Filled blue arrows, same placement

Keep the current vertical-center placement on the left/right edges. Restyle:

- Background: `bg-primary` (the brand blue `#567CF8`)
- Icon color: white
- Drop the white border; keep soft shadow
- Hover: slightly darker blue + larger shadow

## 3. Per-column "Add task"

Each column gets its own add affordance at the bottom of the task list. Clicking it opens the existing `TaskDetailModal` pre-filled with that column (and a blank title), so the user lands directly in edit mode for the column they chose. No Clerk routing, no AI sort.

- New component `AddTaskCard` rendered as the last item in each `DroppableColumn`. Matches the screenshot: dashed-border card, centered `+` icon, hover lifts to solid border.
- Click handler creates a new task row in Supabase with `col` set to that column, blank `title`, `reason = null`, then immediately opens `TaskDetailModal` for it.
- Same component renders on mobile inside each column on the Planner mobile view — consistent UX.
- The card is non-draggable and excluded from drag/drop targeting.

## Technical notes

Files to edit:
- `src/pages/AppHome.tsx`
  - `PlannerDesktop`: column width 380→320, padding 7→4, add right-edge fade overlay, restyle both arrow buttons.
  - `PlannerMobile`: render `AddTaskCard` after each column's task list.
  - `DroppableColumn` (or its caller): accept an `onAddTask(col)` prop and render `AddTaskCard` after the task list.
  - Add `handleAddToColumn(col)` that inserts a blank task row scoped to that column for the current user, then sets `selectedTask` to open the modal.
- New `src/components/AddTaskCard.tsx`
  - Dashed border, centered `+`, matches existing `TaskCard` width/radius. Click → calls `onAdd`.
- `src/components/TaskDetailModal.tsx`
  - On open, if `title === ""`, autofocus the title textarea so the user can type immediately.

Layout sanity check at 1280px: scroller width ≈ 1200px (after `px-10`). With 4 × 320px columns + 3 × 32px gutters (16px on each side of internal dividers) = 1280 + 96 = too wide. Effective cols actually use `pr-4`/`pl-4` only between, so gutters total ~96px → 'Someday' ends up partially visible (~20–60% depending on container), which is the goal. The fade + arrow reinforce.

```text
desktop @1280px:
[ Today ][ Tomorrow ][ Upcoming ][ Some…│fade│
  ←                                          →
```

No DB schema changes. No new dependencies.
