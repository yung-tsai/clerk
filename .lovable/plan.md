## What you're describing (in dnd-kit terms)

- **"Card follows my mouse like I picked it up"** = a `DragOverlay`. The card detaches from the column and floats under the cursor with a shadow + slight scale. The original slot stays at low opacity so the column doesn't collapse.
- **"Stroke showing where it would drop"** = a drop indicator. A 2px line drawn between cards (or above the first / below the last) at the exact insertion point. As you move the mouse up/down a column, the line jumps between gaps so you always see where it'll land.

That's what I'll build.

## Fix list

### 1. Floating card under cursor (`DragOverlay`)
- Track `activeId` via `onDragStart`.
- Render `<DragOverlay>` containing a `<TaskCard draggable={false}>` of the active task, with a stronger shadow + 1.02 scale + slight rotate(-1deg) so it visibly "lifts".
- Source card stays at `opacity: 0.4` in place (current behavior, looks correct once a real overlay exists).

### 2. Drop indicator line
- Add an `overIndex` + `overCol` state computed during `onDragOver`.
- In each column, render a 2px `bg-primary` line between cards at the insertion index (and above first / below last when relevant).
- Line uses `rounded-full` and a soft glow shadow so it reads as an indicator, not a divider.
- The line replaces the current near-invisible `bg-black/[0.025]` column highlight.

### 3. Don't open the modal when I release a drag
Track whether a real drag happened. In `onDragStart` set `draggedRef = true`; in `TaskCard.onClick`, if `draggedRef` was just set, skip `onOpen()` and clear the flag. Result: clean card, no visible handle, no accidental modal opens.

### 4. Mobile = long-press, desktop = small distance
Replace the single `PointerSensor` with:
- `MouseSensor` — `activationConstraint: { distance: 5 }` (desktop precision).
- `TouchSensor` — `activationConstraint: { delay: 220, tolerance: 8 }` (long-press; lets you scroll normally on mobile).

Remove `touch-none` from the card root so the page can scroll on touch.

### 5. Reliable column targeting
- Switch `collisionDetection` from `closestCenter` to: `pointerWithin` → fallback `rectIntersection` → fallback `closestCorners`. Standard pattern for sortable + multi-column.
- Bump each `DroppableColumn` to `min-h-[120px]` and add `pb-6` so dropping into an empty or short column always hits.

### 6. Pickup feel
- Cursor `grab` on cards, `grabbing` while dragging.
- 120ms scale-in on the overlay so the lift feels tactile.
- Existing optimistic Supabase write stays unchanged.

## Files

- `src/pages/AppHome.tsx` — sensors, custom collision detector, `onDragStart`/`onDragOver`/`onDragEnd`, `DragOverlay`, drop-indicator state, beefier `DroppableColumn` (renders the indicator line at the right index).
- `src/components/TaskCard.tsx` — remove root `touch-none`, add drag-vs-click suppression, `cursor-grab/grabbing`.

## Out of scope
- No DB, RLS, or schema changes.
- No visible drag handle (you wanted a clean card).
- Keyboard drag a11y — can add later.
