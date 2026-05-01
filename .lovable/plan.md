## Mobile planner — match the reference

Three changes, all `md:` so desktop is untouched.

### 1. Hide the AppHome header on mobile

`src/pages/AppHome.tsx` line 545 — change header className from
`"fixed top-0 left-0 right-0 z-[100] flex items-center bg-background border-b border-divider"`
to
`"hidden md:flex fixed top-0 left-0 right-0 z-[100] items-center bg-background border-b border-divider"`

### 2. Adjust `<main>` top padding so content starts at the right place

Line 594 — replace `style={{ paddingTop: 64, paddingBottom: 120 }}` with a responsive className.
Use `className="fixed inset-0 overflow-y-auto pt-0 md:pt-16 pb-[120px]"` (drop the inline style).

This gives 0 top padding on mobile (PlannerMobile owns the top region with its fixed tab bar; FocusView already has its own `pt-5`).

### 3. PlannerMobile: fixed tab bar at top + per-column left padding

In `PlannerMobile` (around line 889):

**Tab bar** — change from inline above the scroller to fixed at top of viewport:
- Wrapper className: `fixed top-0 inset-x-0 z-[150] bg-background/95 backdrop-blur-md border-b border-divider`
- Inner row: `flex items-center` (drop `gap-1`, drop `overflow-x-auto`)
- Each tab button: replace `shrink-0 px-3 py-2.5 ...` with `flex-1 px-2 py-3 font-plex text-[12px] font-medium uppercase tracking-[0.04em]` so the four tabs split the width evenly. Active still gets `border-b-2 border-primary text-foreground`, inactive `border-b-2 border-transparent text-muted-foreground`.
- Bottom border on the bar itself (✓ already added via `border-b border-divider` on wrapper) — that's the blue line baseline you wanted to bring back. The active tab's underline sits on top of it.

**Outer container** — change `pt-4 pb-32` → `pt-[52px] pb-32` to clear the fixed tab bar (tab bar height ≈ 48px + a hair).

**Scroller mt** — change `mt-5` → `mt-4` (less since the wrapper now has `pt-[52px]`).

**Per-column left padding** — you specifically asked for ~20px on each column. In the column inner wrapper (the one with `width: 85vw`), add `pl-5` (=20px). Adjust the flex container `gap-3` to `gap-2` so the total horizontal rhythm stays balanced. Remove the leading `px-5` on the scroller's flex container since each column now owns its own left padding (keep `pr-5` so the last column has trailing room).

Concretely, the scroller flex container becomes:
```
<div className="flex gap-2 pr-5">
```
And each column wrapper:
```
<div ... className="shrink-0 pl-5" style={{ width: "85vw", maxWidth: 380, scrollSnapAlign: "start" }}>
```

### 4. Verification

- 390px width: no header. Four tabs span the screen, equal width, blue underline on the active tab, divider line under the bar. Today column starts ~20px from the left edge, with ~60px peek of Tomorrow on the right.
- 1024px+: identical to current desktop — header back, four-column grid, no tabs.
- Focus view at 390px: still works (its own `pt-5` is now visible since main no longer has 64px top padding on mobile).

### Out of scope

Drag handle/dot indicator under tabs, swipe-haptic, anything else.
