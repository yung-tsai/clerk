## Goal
Make all four mobile modals dismissible the same way: **iOS-style drag handle on top + tap-outside to close**. No header bar, no explicit Close button on mobile. Desktop behavior is unchanged.

## Affected modals
1. **Settings** (`src/components/SettingsModal.tsx`)
2. **Completed** (`src/components/CompletedModal.tsx`)
3. **Task detail** (`src/components/TaskDetailModal.tsx`) — also covers the per-column "+" new-task flow, since `handleAddToColumn` opens this same modal with a draft.
4. **Move task sheet** (`src/components/MoveTaskSheet.tsx`) — already uses Radix sheet; will get the same treatment for consistency.

(The AppBar pop-up menu in IMG_1611 is a popover, not a modal — tapping outside already closes it. Out of scope unless you flag it.)

## Approach

### 1. Add a shared `MobileDragHandle` component
New file `src/components/ui/drag-handle.tsx` — a small centered pill (`h-1 w-9 rounded-full bg-black/15`) with ~10px top padding. Used at the top of every mobile sheet body.

### 2. Update `DialogContent` (`src/components/ui/dialog.tsx`)
- On mobile, the X button in the top-right corner is currently always shown. Hide it on mobile (`[&>button]:hidden md:[&>button]:inline-flex` is already a per-modal opt-out — we'll bake it into the base so every Dialog gets it for free).
- Tap-outside-to-close already works (Radix default via overlay click). No change needed.
- Add a small mobile-only safe-area top padding so the drag handle sits cleanly under the notch.

### 3. Replace mobile headers in each modal
- **TaskDetailModal**: remove the `MobileSheetHeader` block; render `<MobileDragHandle />` instead at the top of the scroll container.
- **SettingsModal**: today renders a custom mobile header with a "Close" text button (lines ~110-119). Replace with `<MobileDragHandle />` on mobile; keep desktop layout intact.
- **CompletedModal**: same — replace the "Close" button (lines ~134-143) with `<MobileDragHandle />` on mobile.
- **MoveTaskSheet**: it's a bottom Sheet using `MobileSheetHeader`. Swap the header for `<MobileDragHandle />` and a small inline title row (so the user still sees "Move task").

### 4. Keep destructive confirmation flows unchanged
The nested AlertDialogs (clear tasks, delete account, clear completed) stay as-is — they're confirm prompts, not the main modal.

### 5. Drag-to-dismiss (gesture)
Radix Dialog/Sheet doesn't support drag-down-to-dismiss natively. The drag handle will be **visual only** — tap outside or swipe-down on the OS browser still works, and the handle communicates "this is a sheet you can dismiss." If you want true drag-to-dismiss later, we'd swap to `vaul` Drawer (already in the project), but that's a bigger refactor — flagging for a follow-up if you want it.

## Files touched
- `src/components/ui/dialog.tsx` (hide X on mobile by default)
- `src/components/ui/drag-handle.tsx` (new)
- `src/components/SettingsModal.tsx`
- `src/components/CompletedModal.tsx`
- `src/components/TaskDetailModal.tsx`
- `src/components/MoveTaskSheet.tsx`

## Open question for after
You mentioned another issue — ready to hear it once this plan is approved (or alongside, your call).