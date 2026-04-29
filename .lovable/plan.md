## Issues & Fixes

### 1. Proposal modal reappears every time you switch browser tabs

**Cause** — In `src/pages/AppHome.tsx`, the load effect runs whenever `user` changes. When the tab regains focus, Supabase silently refreshes the session, which produces a new `user` object reference and re-runs the effect. The effect reads `location.state.pendingProposals` from React Router, and although we call `window.history.replaceState(...)`, React Router keeps its own in-memory copy of `location.state`, so the proposals get re-shown.

**Fix** — Replace the `window.history.replaceState` line with a proper React Router replace:
```
navigate(location.pathname, { replace: true, state: null });
```
And only consume `pendingProposals` once by capturing it on first load (e.g. a `useRef` flag, or read it before any async work and immediately null it via navigate before the rest of the effect runs).

---

### 2. Task cards should be draggable (reorder + move between columns)

Match `clerk v27.html` behavior. Use `@dnd-kit/core` + `@dnd-kit/sortable` (lightweight, already common in this stack — will add as deps).

- **Planner view**: each column = a droppable; cards within a column = sortable list. Dragging a card to another column updates its `col`; dropping inside the same column reorders by updating `position`.
- **Focus view**: only the Today column is shown — sortable within it.
- Wire `onDragEnd` in `AppHome.tsx`:
  - Optimistically update local `tasks` state.
  - Persist: `update({ col, position })` for the moved card. For reorders, update `position` for the affected cards (use spaced integers — e.g. midpoint between neighbors — to avoid renumbering everything).
- `TaskCard` becomes the draggable handle. Tap-to-open still works (use `dnd-kit`'s `activationConstraint: { distance: 5 }` so a click isn't interpreted as a drag). The complete-circle button keeps `stopPropagation`.

---

### 3. Bottom bar layout breaks at narrower widths

**Cause** — The pill is `width: calc(100vw - 48px)` with `maxWidth: 500`. At in-between widths the character (`size={50}`) + hamburger + padding squeezes the input to almost zero, and the character can visually overlap the input edge / look detached (per the screenshot).

**Fix** in `src/components/AppBar.tsx`:
- Reduce character size to `size={40}` to match the proportions in `v27`.
- Tighten pill padding (`px-2.5 py-1`) and add `gap-2` between input and character.
- Set `minWidth` lower (e.g. `240`) and keep `maxWidth: 500`. Use `width: min(500px, calc(100vw - 32px))`.
- Ensure character sits inside the rounded edge: wrap it with a small right margin (`mr-0.5`) and confirm it's not absolutely positioned.

---

### 4. Settings modal: bottom bar + header sit on top of it; size feels off

**Cause** — `AppBar` uses `z-[200]` and the fixed header uses `z-[100]`. Radix Dialog defaults to `z-50`, so both float above the modal. Also the modal currently maxes at 480px which feels narrow on desktop.

**Fix**:
- In `src/pages/AppHome.tsx`, hide both `AppBar` and the fixed header when `settingsOpen` is true (same pattern already used for `proposals`). Render condition: `{!proposals && !settingsOpen && <AppBar … />}` and similarly skip the `<header>`.
- In `src/components/SettingsModal.tsx`, bump width to `max-w-[640px]` for desktop while keeping the modal scrollable (`max-h-[88vh]`). Mobile remains full-width via the dialog's responsive defaults.

---

## Files to edit

- `src/pages/AppHome.tsx` — fix proposal re-show; hide header/AppBar while settings open; wire drag-end handler.
- `src/components/AppBar.tsx` — shrink character, tighten layout, fix narrow-width breakage.
- `src/components/SettingsModal.tsx` — widen to 640px on desktop.
- `src/components/TaskCard.tsx` — integrate dnd-kit sortable hooks; keep click-to-open + complete button working.
- `src/components/PlannerColumns` (inline in `AppHome.tsx`) — wrap with `DndContext` + `SortableContext`; columns become drop targets.
- `package.json` — add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

No DB schema changes required — `tasks` already has `position` and `col` columns.
