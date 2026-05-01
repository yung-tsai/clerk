## Two small fixes to the add-task flow

### 1. Don't create empty tasks

**Problem:** Clicking the `+` AddTaskCard immediately inserts a row in `tasks` with `title: ""` and opens the modal. If the user closes the modal without typing, a titleless task is left in the DB and renders as a near-empty card.

**Fix:** Switch to a draft-first flow. The modal opens with a local-only draft task; the row is only inserted into Supabase once the user types a title.

**Changes in `src/pages/AppHome.tsx`:**

- `handleAddToColumn(col)` — no longer hits Supabase. Builds an in-memory draft task object with a temp id (e.g. `draft-${Date.now()}`), no `user_id` write, and sets it as `selectedTask`. Does NOT push into the `tasks` array (so it doesn't render in the column yet).
- A new flag (e.g. tracking `selectedTask.id.startsWith("draft-")`) marks the draft state.
- The modal's first patch handler is intercepted: if the task is a draft and the patch contains a non-empty `title`, insert the row into Supabase, swap the temp id for the real one in `selectedTask`, and add it to `tasks`. Subsequent patches behave normally.
- Modal close: if still a draft (never got a title), discard — no DB write, no toast.

**Changes in `src/components/TaskDetailModal.tsx`:**

- No structural change. The autofocus-on-empty-title behavior already works for drafts.
- Optionally: disable the "Move to" buttons while in draft state (can't move a non-existent row). Low priority.

### 2. Remove "Nothing yet" empty state

The dashed `+` AddTaskCard is always rendered at the bottom of every column, so the empty-state text is redundant.

**Changes in `src/pages/AppHome.tsx`:**

- In `DroppableColumn` (around line 1123–1131): remove the `<p>{emptyText}</p>` block. Keep the `DropIndicator` rendering for the empty-with-active-drag case.
- Remove the now-unused `emptyText` prop from `DroppableColumn`'s signature.
- Remove the `emptyText="Nothing yet..."` props passed at lines 850, 997, 1065.

Empty columns will then show only the dashed `+` card, which is enough affordance.

### Files
- `src/pages/AppHome.tsx` — both changes
- `src/components/TaskDetailModal.tsx` — minor (only if we disable Move-to in draft state)

### Out of scope
- No schema/migration changes.
- No changes to the existing inline task card, drag-and-drop, or AI sort flow.
- No change to AddTaskCard component itself.
