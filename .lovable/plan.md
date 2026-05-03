## What's happening

### 1. Duplicate card on submit

The per-column "+" flow creates an in-memory draft (`id: "draft-..."`) and opens the detail modal. When you type the title, `TaskDetailModal` debounces input by 400ms, then calls `onPatch`. The draft branch in `AppHome.tsx` (around line 783) does:

```
async insert into tasks → setTasks([newTask, ...]) → setSelectedTask(newTask)
```

The bug: while the async insert is **in flight**, `selectedTask.id` still starts with `draft-`. If the user pauses typing again before the insert resolves and `setSelectedTask(newTask)` commits, the next debounced `onPatch` fires with the same draft id and triggers a **second insert**. Two rows land in the database, two cards render in the column.

A second smaller issue compounds it: when `setSelectedTask(newTask)` lands, `TaskDetailModal`'s effect (`useEffect(..., [task])`) resets `local` to the inserted task — wiping any characters the user typed *after* the first insert fired.

### 2. Header narrower than planner columns

- Header inner: `max-w-[1280px]` (line 602)
- Planner desktop: `max-w-[1440px]` (line 1124)

So the logo/streak sit inside a narrower band than the columns below them.

## Changes

### `src/pages/AppHome.tsx`

**Lock the draft against double-insert.** Add a ref that tracks which draft ids are currently being promoted:

```text
const promotingDrafts = useRef<Set<string>>(new Set());
```

In the `onPatch` draft branch:
- If `promotingDrafts.current.has(id)` → skip (insert already in flight; just merge patch into local `selectedTask`).
- Otherwise add to set, run the insert, then on success replace the draft with `newTask` and remove from set. On error, also remove from set so the user can retry.

Also: when promoting, optimistically update `selectedTask` to the *real* task immediately after `insert().select().single()` resolves, so subsequent patches go through the normal (non-draft) update path with the correct id.

**Widen the header.** Change line 602 from `max-w-[1280px]` to `max-w-[1440px]` so the logo and streak align with the planner columns below.

### `src/components/TaskDetailModal.tsx`

**Don't clobber in-flight edits when `task` identity changes but it's the same logical task.** Update the reset effect so it only re-syncs `local` when the task id changes, not on every prop update:

```text
useEffect(() => {
  if (local?.id !== task?.id) setLocal(task);
  // ...autofocus logic stays
}, [task?.id]);
```

This way, when the parent swaps a draft for the freshly-inserted real task, the title the user is mid-typing isn't reset.

## What's NOT changing

- The draft-first UX (no row written until you type a title) — this stays.
- The bottom-bar AI sort flow — untouched.
- Mobile planner header (it has its own tab bar, no width issue).
- Focus view max width (`1280px`) — only the planner-paired top header widens.
