## Three fixes

### 1. Planner mobile — column header alignment

Confirming: yes, the mobile planner **is** horizontally swipeable. Each column scroll-snaps; tabs sync to the active column.

You want "Today" (the column header) to sit flush against the left edge of its column container, aligned with the cards' left edge below it (not indented further).

Currently the column header has `px-1` from the previous fix, which inset it. The fix: remove `px-1` so the header sits at the column's left edge — matching exactly where the card's left edge sits (cards are full-width within the column).

Also bump the scroller's left padding slightly so the active column doesn't kiss the screen edge:
- Tab bar `px-5` → keep
- Scroller `px-5` → keep
- Column header: remove `px-1` (back to flush left)

**File:** `src/pages/AppHome.tsx`, `PlannerMobile` — change column header row from `px-1 pb-3 mb-4` back to `pb-3 mb-4`.

### 2. Bigger Clerk logo everywhere

Currently `h-[22px]` on Landing and AppHome. You asked for ~60px wide. The SVG aspect ratio means width comes from height; I'll bump to `h-[36px]` which renders at roughly 60px wide given the wordmark's proportions. Same size on mobile and desktop (no responsive shrink — you said "bigger on all pages").

**Files:**
- `src/pages/Landing.tsx` line 73 — `h-[22px] sm:h-[24px]` → `h-[36px]`
- `src/pages/AppHome.tsx` line 549 — `h-[22px]` → `h-[36px]`

If 36px renders too tall/short visually, easy to tweak after.

### 3. Task detail modal — bottom sheet on mobile

The current `TaskDetailModal` uses `Dialog` which renders centered with `max-w-[720px]` and a 2-column grid (`md:grid-cols-[1fr_280px]`). On mobile it collapses to one column but is still a centered dialog, which is cramped and gets covered by the bottom AppBar.

**Approach:** branch on `useIsMobile()`. Desktop keeps the exact current `Dialog` (no changes — desktop is preserved). Mobile renders the same content inside a bottom `Sheet` (`side="bottom"`) using the existing `src/components/ui/sheet.tsx`.

Mobile sheet specifics:
- Slides up from bottom
- Height: `h-[88vh]`, rounded top corners `rounded-t-[20px]`
- Internal scrolling (`overflow-y-auto`) so long content (reasoning + all fields + delete button) is reachable
- Bottom padding `pb-32` to clear the floating AppBar input
- Single-column layout (skip the `md:grid-cols-[1fr_280px]` split — fields stack under the title/reasoning/move-to section)
- Close handle: small drag indicator at top + tap outside to close (Sheet handles both)

I'll extract the body content (title textarea + reasoning + move-to + fields + delete) into a small inner component used by both Dialog (desktop) and Sheet (mobile) so they stay in sync.

**Files:**
- `src/components/TaskDetailModal.tsx` — add `useIsMobile()` branch, import `Sheet`/`SheetContent` from `@/components/ui/sheet`, extract shared body.

### 4. Other modals — same pattern check

Quick audit:
- `SettingsModal` (Dialog, max-w probably tall content) — likely also bad on mobile. I'll apply the same Sheet-on-mobile pattern.
- `CompletedModal` — same treatment.
- `Proposal modal` (inline in `AppHome.tsx`) — already has `max-w-[440px]` and `max-h-[60vh]` scrolling, works ok on mobile but I'll convert to Sheet on mobile for consistency.
- `AlertDialog` confirmations (clear tasks, etc.) — leave as-is; they're tiny confirm prompts, work fine centered.

So all four content-heavy modals get the mobile-Sheet treatment:
1. `TaskDetailModal`
2. `SettingsModal`
3. `CompletedModal`
4. Proposal modal (inline in `AppHome.tsx`)

Desktop Dialog rendering is preserved exactly for all four.

### Verification (after build)

1. Mobile (390px): "Today" column header sits flush left, aligned with card edges below
2. Logo on Landing and AppHome is visibly larger (~60px wide)
3. Tap a task on mobile → sheet slides up from bottom, all fields scrollable, delete button reachable
4. Open Settings / Completed / Proposal on mobile → all come up as bottom sheets
5. Desktop (1024px+): all four modals look identical to before — centered Dialog, no Sheet

### Out of scope

- AppBar itself (you didn't ask)
- AlertDialog confirmations
- Onboarding screen
- Any AI / backend code
