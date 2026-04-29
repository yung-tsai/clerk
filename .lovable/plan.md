## What's changing

### 1. Cursive Clerk wordmark
- Add `src/assets/clerk-logo.svg` (you'll upload it after approval — drop the file in chat and I'll save it there).
- Replace the uppercase `CLERK` mono text next to the mascot in `src/pages/AppHome.tsx` (header) with `<img src={clerkLogo} />` at ~22px tall. Mascot stays to its left.
- Same swap in `src/pages/Landing.tsx` header for consistency.

### 2. Remove top-bar settings entry
- Delete the `···` button (and its `setSettingsOpen` handler call) from the AppHome header. The hamburger menu in the bottom AppBar remains the only path to Settings.

### 3. Settings becomes a modal (matching uploaded HTML)
Replace the current right-side `Sheet` with a centered `Dialog` modal styled to match `clerk_settings-2.html`. Max-width 480px, translucent white cards with backdrop blur, IBM Plex Sans/Mono.

**New component**: `src/components/SettingsModal.tsx` containing:

- **Header row**: "Settings" title centered, `Save` button right (blue `#567CF8`, IBM Plex Sans 13px/500). Close (X) on left replaces "Back".
- **Profile card**:
  - Floating mascot (uses currently selected variant, ~52px) on the left
  - "NAME" mono label + editable input on the right (live-bound to local draft state)
  - Below: "YOUR CLERK" label + 4-column character grid (Blue, Coral, Soon, Soon — locked tiles show 🔒)
- **Your Progress card**:
  - Two stat cells side-by-side, divider between: `streak` value with "🔥 day streak" label, `tasks_completed` value with "✓ tasks done" label. Numbers in IBM Plex Mono 28px/300.
  - Milestones list (6 rows, hardcoded): first task, 10 tasks, 50 tasks, 3-day streak, 7-day streak, 30-day streak. Each row: 36px rounded icon tile (blue tint if earned, gray if locked), name + description, ✓ on the right when earned. Locked rows show "Complete N tasks/N-day streak to unlock" as the description.
- **Account card**:
  - "Back up your tasks" title + subtitle "Saved on this device only. Create an account to sync everywhere." + dark `Back up` button → shows a "Coming soon" toast (placeholder, since auth already exists).
- **Version**: centered "Clerk · Early Access" mono caption at bottom.

**Save behavior**: clicking Save persists `display_name` and `character` to `profiles` and closes the modal. Live character changes can stay live-applied (so the mascot updates in the bar instantly) but Save is the explicit confirm for name.

### 4. Streak tracking (so milestones aren't always 0)
The DB already has `profiles.streak`, `profiles.tasks_completed`, and `profiles.last_active_date` but nothing writes to them. Wire it up in `completeTask` in `AppHome.tsx`:
- On every completion, increment `tasks_completed`.
- If `last_active_date` is today → no streak change.
- If `last_active_date` is yesterday → `streak + 1`.
- Otherwise → `streak = 1`.
- Update `last_active_date` to today.

This is a single RPC-free `update` after the existing completion writes. The settings modal reads these from `profiles` on open.

## Files touched

- `src/assets/clerk-logo.svg` — **new** (you upload)
- `src/components/SettingsModal.tsx` — **new**
- `src/pages/AppHome.tsx` — swap wordmark, remove `···` button, replace inline Sheet with `<SettingsModal />`, add streak update in `completeTask`
- `src/pages/Landing.tsx` — swap wordmark in header

No DB migration needed (columns already exist).

## Open item
After you approve, please drop the cursive Clerk logo SVG/PNG into the next message so I can save it to `src/assets/clerk-logo.svg`. If you'd rather I proceed without it, I'll keep the mascot + "CLERK" mono text temporarily and swap once you upload.
