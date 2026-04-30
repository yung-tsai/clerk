# MVP gap check + what's left

Quick honest answers, then a tight plan for what's missing.

## Your questions, answered

**1. Backend — done?**
Yes for MVP. You have `tasks`, `completed_tasks`, `profiles` with proper RLS (own-rows only), the `sort-tasks` edge function for AI sorting, auth, onboarding, and the `handle_new_user` trigger creating profiles automatically. Nothing missing for the MVP scope.

**2. Is gamification actually working?**
Half-working. The data is correct — `streak`, `tasks_completed`, and `last_active_date` update on every completion (`AppHome.tsx` lines 232–267), and `SettingsModal` already renders stats + a milestones list (3/7/30-day streaks, 10/50/100 tasks). But:
- The user has to **open Settings** to see any of it. There's zero feedback in the main flow.
- There's no celebration when you cross a milestone (no toast, no bubble line, nothing).
- Streak doesn't show anywhere in the header or AppBar.
So technically working, practically invisible. Worth a small fix below.

**3. Completed page — yes, needed.**
The "Completed" item already exists in the AppBar menu (`AppBar.tsx` line 100) but its `onClick` does nothing — it just closes the menu. Dead button. We have the `completed_tasks` table populated correctly, just no UI.

**4. Clear all — yes, needed.** Especially during onboarding when people brain-dump and want to reset.

**5. Download to phone — yes, easy win.**
Cleanest path: **installable web app (manifest-only, no service worker)**. Users tap "Add to Home Screen" from their browser and Clerk lives on their home screen with its own icon, no browser chrome. Works on iOS + Android, no app store, no native build. Service workers cause more problems than they solve in Lovable previews, so we skip them.

---

## What we're shipping

### 1. Completed page (modal-based, matches existing pattern)

New `CompletedModal.tsx` component, opened from the AppBar "Completed" menu item.

**Layout** (matches `SettingsModal` styling):
- Title: "Completed" + small count (e.g. "47 tasks")
- Grouped by relative date: **Today**, **Yesterday**, **This week**, **Earlier**
- Each row: title, category pill (if any), small timestamp on right
- Empty state: Clerk character + "Nothing yet. Go finish something."
- Bottom-right: "Clear history" link (with confirm) — separate from Clear all tasks

Loads from `completed_tasks` ordered by `completed_at desc`, limit 200 (more than enough for MVP, avoids the 1000-row default).

Wire `onClick` on the AppBar "Completed" MenuItem to open this modal (currently a no-op).

### 2. Clear all (with confirm)

Added inside **SettingsModal**, in a new "Danger zone" section at the bottom:
- **Clear all tasks** — wipes active `tasks` only (not history)
- **Clear completed history** — wipes `completed_tasks` only

Both use shadcn `AlertDialog` (already in repo) with copy like:
> "Delete all 12 tasks? This can't be undone."

Two buttons not one, because nuking history when you wanted to clear today's mess would suck.

### 3. Make gamification visible

Three small touches, no new screens:

- **Streak badge in header** (next to the Focus|Planner toggle): `🔥 7` — only shows when streak ≥ 2. Tappable → opens Settings modal at the stats section.
- **Milestone celebration**: when `completeTask` crosses a threshold (3, 7, 30 day streak; 10, 50, 100 tasks), show a longer bubble line via the existing `showBubble()`:
  - "Three days. That's a streak." / "A full week. I noticed." / "100 tasks. We're a team now."
- **Done counter in bubble** on every completion: instead of just "Done. Next." rotate in lines like "Done. 3 today." once we know today's completion count.

No new tables, no new logic — just surfacing what already updates.

### 4. Installable web app (manifest only)

- Add `public/manifest.json` with name "Clerk", short_name "Clerk", `display: "standalone"`, theme/background colors matching the app, and icon entries.
- Generate icons (192px, 512px, maskable 512px, Apple touch 180px) from the existing Clerk character/logo and drop in `public/`.
- Add `<link rel="manifest">`, Apple-specific meta tags, and theme-color to `index.html`.
- Add a small "Install Clerk on your phone" link in SettingsModal that explains the flow (Share → Add to Home Screen on iOS; install icon on Android).

**No `vite-plugin-pwa`, no service worker.** Per Lovable guidance, manifest-only is the right call when offline support isn't required — and it isn't, since Clerk needs the network to call the AI sort function anyway.

---

## Files touched

- `src/pages/AppHome.tsx` — wire Completed modal open state, add streak badge to header, celebration lines in `completeTask`
- `src/components/AppBar.tsx` — Completed menu item gets a real `onClick`
- `src/components/CompletedModal.tsx` *(new)* — list grouped by date
- `src/components/SettingsModal.tsx` — add "Danger zone" section with two confirm dialogs + "Install on phone" link
- `index.html` — manifest link + apple/theme meta
- `public/manifest.json` *(new)*
- `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/apple-touch-icon.png` *(new — generated from existing assets)*

## Not in this pass

- No analytics dashboard view (overkill for MVP).
- No undo on complete (nice-to-have, separate request).
- No native Capacitor build — PWA install covers "on my phone" without app store overhead.
- Memory unchanged — no new product rules, just shipping the existing scope.

Approve and I'll build it in one pass. If you'd rather slice (e.g. *"just Completed page + Clear all this time, do PWA + gamification next"*), say the word.