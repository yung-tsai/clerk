## Two small changes to the landing hero

### 1. New H1 copy
Replace the current 3-line headline with:

```
Clerk sorts
your tasks.
Better focus.
```

The third line ("Better focus.") will keep the lighter/thinner styling treatment the third line currently has, so the visual rhythm stays the same.

### 2. Fix: video not playing on mobile/tablet
The background video is currently hidden below the `md` breakpoint (768px). The `<video>` tag has the classes `hidden md:block`, and a static dark gradient `<div>` is shown in its place on smaller screens. That's why you see no video on phones/tablets.

Why it was set up that way: an earlier safety net in case mobile browsers blocked autoplay. But the video already has `muted`, `playsInline`, `autoPlay`, and `loop` — which is exactly the combo iOS Safari, Android Chrome, and iPad Safari require to autoplay inline. So the gating isn't needed.

Fix:
- Remove `hidden md:block` from the `<video>` so it renders on every viewport.
- Remove the `md:hidden` gradient fallback `<div>` (no longer needed).
- Keep the dark overlay (`hero-overlay-dark`) — it already has a stronger mobile variant in `index.css` so text stays readable over the video on small screens.

### Files touched
- `src/pages/Landing.tsx` — H1 text + video element classes

No CSS or asset changes needed.