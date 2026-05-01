## Plan: Focus idle fade, modal/bar layering, sheet consistency, Settings auto-save

Three independent fixes scoped tightly so Planner mobile and desktop modals stay untouched.

### 1. Focus page — bring back header on mobile + idle fade

Currently the global header in `src/pages/AppHome.tsx` is `hidden md:flex`, so on mobile Focus has no Clerk logo / Focus·Planner toggle at all. Restore both, and fade the chrome when the user is idle — but only on Focus.

- Make the header visible on mobile **only when `view === "focus"`**. On Planner mobile, keep it hidden (the fixed tab bar is the header there).
- Add an idle timer hook in `AppHome` (e.g. `useIdle(4000)`) that listens to `pointermove`, `pointerdown`, `keydown`, `scroll`, `touchstart` and resets a 4s timer. Returns `idle: boolean`.
- When `view === "focus"` and `idle === true` and no modal/proposal is open: apply `opacity-0 pointer-events-none` (with `transition-opacity duration-500`) to both the `<header>` and the `<AppBar>` wrapper. Any pointer/key/scroll event brings them back instantly.
- Planner view ignores idle entirely — header (desktop) and bottom bar stay fully visible.
- The bubble/quip flow continues to work; when Clerk speaks (`bubbleVisible`), force the bar visible regardless of idle so the user can read it.

### 2. Hide the bottom AppBar whenever any sheet/modal is open

Today `AppBar` is hidden only when `proposals || settingsOpen || completedOpen` are open. The task detail sheet (`selectedTask`) is missing from that list, so the bar floats on top of the bottom-sheet on mobile.

- In `AppHome.tsx`, add `!selectedTask` to both the header guard (line 543) and the AppBar guard (line 623).
- That single change covers the task sheet. All other modal types are already in the guard.

### 3. Make all mobile sheets visually consistent (Settings style)

The shared `DialogContent` in `src/components/ui/dialog.tsx` already renders as a bottom sheet on mobile (`inset-x-0 bottom-0 rounded-t-[20px]`, slide-in-from-bottom). Good. The inconsistency is the *inner* chrome:

- **SettingsModal** has a sticky header bar with "Close" (left) + title (center) + action (right), a translucent backdrop-blur, and a tinted gradient background. This is the look we want everywhere on mobile.
- **TaskDetailModal** and **CompletedModal** currently use the default Radix `X` close button in the corner with no top bar.

Plan:
- Extract a small `SheetHeader` helper in a new file `src/components/ui/sheet-header.tsx` with the Settings header pattern: `Close` chevron-left button on the left, centered title, optional right-side slot. Include the `bg-[rgba(245,245,243,0.85)] backdrop-blur` styling and bottom hairline border.
- Use `SheetHeader` in `TaskDetailModal` and `CompletedModal`, but **only render it on mobile** (`md:hidden`) so desktop dialogs stay exactly as they are today (centered, with the corner X).
- Hide the default Radix `X` close on mobile for these two modals by adding `[&>button]:hidden md:[&>button]:inline-flex` (matching what SettingsModal already does, but scoped to mobile).
- Result: on mobile, all three sheets slide up from the bottom with the same header bar; on desktop, nothing changes.

### 4. Settings — remove "Save" button (auto-save)

`SettingsModal.tsx` currently saves only when the user taps "Save" (line 106-114). The fields are simple (name + character) and `onCharacterPreview` already updates the avatar live. Switch to auto-save:

- Remove the `handleSave` button from the header. Replace the right slot with empty space (or a subtle "Saved" toast indicator — skip for simplicity).
- Auto-persist on change:
  - **Name:** debounce 600ms after `onChange`, then call `onSave({ display_name: name.trim(), character })`.
  - **Character:** save immediately when picked (already previews live; just also persist).
- Keep `onSave` signature as-is — only the trigger changes.
- Drop `saving` state (no longer needed for the button); keep optimistic UI.

### Files to touch

- `src/pages/AppHome.tsx` — header `hidden md:flex` → conditional on view+idle; add idle hook; add `!selectedTask` to guard.
- `src/components/ui/sheet-header.tsx` — new shared mobile sheet header.
- `src/components/TaskDetailModal.tsx` — add `<SheetHeader className="md:hidden" />`, hide default close on mobile.
- `src/components/CompletedModal.tsx` — same treatment.
- `src/components/SettingsModal.tsx` — remove Save button, add debounced auto-save on name + immediate save on character pick.

### Out of scope / preserved

- Planner mobile layout, tab bar, column padding — untouched.
- Desktop versions of all three modals — untouched (no visual change).
- `dialog.tsx` base component — already handles mobile bottom-sheet correctly; no edit needed.
