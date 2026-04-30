## What you'll get

1. **Wider task cards on the Planner** — bumped from 280px → **380px** per column, matching the Focus card width.
2. **"Peek + scroll" layout** — Today / Tomorrow / Upcoming visible, with a sliver of **Someday** peeking on the right (just like your Figma).
3. **Scroll arrow buttons** — circular chevron buttons at the right edge (and left edge once scrolled) to nudge horizontally one column at a time. Trackpad/drag scroll still works.
4. **New SVG logo** — replaces the PNG wordmark in the planner header (and Landing page, for consistency).

---

## How it works (the layout math)

Current planner: `max-w-[1280px]` container, 4 columns × 280px in a horizontally-scrollable grid. Cards are capped at 380px but columns are only 280px, so cards render at 280px.

New planner:
- Columns become **380px wide** (matches `TaskCard`'s `max-w-[380px]`).
- 4 × 380 = 1520px of content, plus column gutters (~28px between).
- The viewport container (`max-w-[1280px]` minus padding ≈ 1200px usable) only shows ~3 full columns + a peek of the 4th — exactly the Figma effect.
- Existing `overflow-x-auto` already enables horizontal scroll; we just lean into it.

Scroll buttons:
- A small floating **chevron-right** circular button pinned to the right edge of the planner area when more content exists to the right.
- A **chevron-left** appears once scrolled.
- Each click scrolls by one column-width (~408px including gutter) using `scrollBy({ left, behavior: "smooth" })`.
- Buttons hide when at the corresponding edge (tracked via scroll listener + `scrollLeft` / `scrollWidth`).
- Hidden on mobile (`md:flex`) since touch scroll is already natural there.

---

## Files I'll change

- `src/pages/AppHome.tsx` — `PlannerView` component:
  - `gridTemplateColumns: "repeat(4, 380px)"` instead of `280px`
  - Add a ref to the scroll container + `scrollLeft` state
  - Render two absolute-positioned chevron buttons (lucide `ChevronLeft` / `ChevronRight`) on `md+` screens
  - Smooth scroll handler
- `src/assets/clerk-logo.svg` — new file with the SVG you provided
- `src/pages/AppHome.tsx` + `src/pages/Landing.tsx` — swap `import clerkLogo from "@/assets/clerk-logo.png"` → `.svg`. Keep current `h-[22px] w-auto` sizing so it visually matches the existing wordmark scale (your SVG is 80×41 ≈ 1.95:1, so at h-[22px] it'll be ~43px wide — close to the current logo footprint).

---

## What I won't change

- Mobile planner — already works fine since columns scroll naturally on touch; arrows would clutter it.
- Card visual design — still the same translucent white card, just rendering at its full 380px max-width.
- `Focus` view — already 380px there.

Sound good? Approve and I'll ship it.