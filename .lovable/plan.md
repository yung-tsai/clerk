## Fix: true-center the Focus/Planner toggle

The current 3-col grid centers the toggle within its *cell*, not the viewport. Since the logo cell and streak cell have different intrinsic widths, the middle cell is offset — the toggle drifts.

### Change

In `src/pages/AppHome.tsx`, the header inner container:

- Switch from `grid grid-cols-3` back to a simple `flex justify-between items-center` for logo + streak.
- Render the toggle as a **sibling absolutely positioned** to the header: `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`. This pins it to the true viewport center, exactly like `AppBar` already does.
- Parent header gets `relative` so the absolute child anchors correctly.

### Shape

```text
<header class="relative ...">
  <div class="max-w-[1280px] mx-auto px-4 md:px-10 flex justify-between items-center">
    <img logo />
    <div streak />
  </div>
  <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
    Focus | Planner toggle
  </div>
</header>
```

### Why this works

Absolute positioning takes the toggle out of normal flow, so its center is anchored to the viewport (via the full-width `relative` header), not to leftover grid space. Logo and streak can grow/shrink freely without nudging it.

### Files
- `src/pages/AppHome.tsx` — header markup only. No logic, no other components.
