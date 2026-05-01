## Mobile optimization for AppHome

Goal: under 768px, the Planner becomes a single-column, tab-driven, swipeable view that matches your screenshot. Desktop (≥768px) stays exactly as it is.

### 1. Planner — mobile layout (under 768px)

**Tab bar at top** (just under the AppBar header area, above the column content):
- Four tabs: `Today | Tomorrow | Upcoming | Someday`
- Active tab gets a 2px underline in the primary color (matches screenshot)
- Inactive tabs are muted grey, same `font-plex` family
- Tapping a tab snaps the column scroller to that column
- Horizontally scrollable if the four labels don't fit (they should at 360px+)

**Column scroller**:
- Replace the current desktop grid with a horizontal scroll-snap container
- Each column is `~85vw` wide so the next column peeks `~10–12%` on the right edge (matches screenshot)
- `scroll-snap-type: x mandatory` + `scroll-snap-align: start` on each column so swipe lands cleanly on one column
- Column gutter: ~16px between columns (small gap, no vertical divider line on mobile — the divider is a desktop affordance)
- Sync state both ways: tab tap → programmatic scroll; user swipe → updates active tab via scroll position observer (IntersectionObserver on each column, or scroll listener computing nearest snap index)

**Inside each column** (mobile):
- Keep the existing column header row (`Today` + count `06`) but pull padding in
- Cards stay full-width within the column (`max-w-[380px]` already on `TaskCard` — fine, will fit inside ~85vw on phones)
- Reduce outer page padding: `px-4` instead of `px-10`, `pt-4` instead of `pt-7`

**Drag-and-drop on mobile**:
- Keep working within a column (vertical reorder) — `TouchSensor` with delay is already configured
- Cross-column drag is awkward on a swipe-paged layout; the existing TaskDetailModal "Move to" buttons cover that case, so cross-column drag stays desktop-only behavior in practice (no code change needed — it'll still work technically, just rarely used on mobile)
- Hide the desktop scroll arrows on mobile (already `hidden md:flex`, no change)

### 2. Focus view — tighten for mobile

- Reduce wrapper padding: `px-4 pt-5 pb-8` on mobile (currently `px-10 pt-7 pb-10`)
- Day header (`Friday` + date) stays centered, slightly smaller on mobile: `text-[24px]` instead of `28px`
- Card column already constrained to `max-w-[420px] mx-auto` — keep

### 3. Breakpoint strategy

- Use Tailwind's `md:` prefix (≥768px) for desktop overrides
- Mobile is the new default; current desktop layout becomes the `md:` variant
- `useIsMobile()` hook (already exists) is used inside `PlannerView` for the JS logic that needs to know which mode it's in (tab/scroll sync, conditional rendering of the tab bar vs. desktop's 4-col grid)

### 4. Files to change

- `src/pages/AppHome.tsx`
  - `PlannerView`: split into `PlannerMobile` and `PlannerDesktop` (or branch on `useIsMobile()` inside the same component). Mobile path renders the tab bar + horizontal snap scroller. Desktop path keeps the current 4-column grid + arrows.
  - `FocusView`: responsive padding/typography classes
- No changes to `TaskCard`, `AppBar`, `TaskDetailModal`, drag sensors, or any backend/AI code

### 5. Out of scope

- Proposal modal, Settings modal, Completed modal — keeping current responsive behavior
- Onboarding screen — separate pass if you want
- Landing/Auth pages — already adjusted in earlier work
- Cross-column swipe-while-dragging — not adding; "Move to" buttons in detail modal handle it

### 6. Verification (after build)

1. Resize preview to 390px: tabs visible, Today column shown, Tomorrow column peeks on right
2. Swipe left → snaps to Tomorrow, underline moves to Tomorrow tab
3. Tap "Someday" tab → snaps to Someday column
4. Resize to 1024px: original 4-column desktop grid returns, no tabs
5. Focus view at 390px: less padding, day header sized for phone
