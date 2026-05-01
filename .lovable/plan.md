# Replace right-column preview with hero video

## What changes

Above the fold on `/` (Landing page), the right column currently shows a static `ProposalPreview` card. Replace it with the uploaded video (`landing-video.mp4`), which is a square 960×960, ~8s clip (1.8MB).

Everything else in the hero stays the same: left-column copy, mascot+bubble, CTA, micro-promise, and audience line.

## How it will look

```text
Desktop (≥ md)                              Mobile (< md)
┌──────────────────────┬─────────────────┐  ┌──────────────────┐
│ H1: explains what    │                 │  │ H1               │
│ to do first.         │   ┌─────────┐   │  │ Mascot + bubble  │
│                      │   │         │   │  │ CTA              │
│ Mascot 🗨 bubble     │   │  VIDEO  │   │  │ ─────            │
│                      │   │  (1:1)  │   │  │ ┌────────────┐   │
│ [ Get started → ]    │   │         │   │  │ │   VIDEO    │   │
│ no account needed    │   └─────────┘   │  │ │   (1:1)    │   │
│ Made for ADHD…       │                 │  │ └────────────┘   │
└──────────────────────┴─────────────────┘  └──────────────────┘
```

- Same column slot: `max-w-[440px]`, right-aligned on desktop, centered on mobile.
- Square aspect ratio preserved (1:1) — video fills the column width.
- Soft container: rounded-[20px], subtle border + shadow matching the existing card aesthetic, on the `#F5F5F3` background.
- Slight hover lift kept (`hover:-translate-y-1`) to mirror the previous card's feel.

## Behavior

- `autoPlay`, `muted`, `loop`, `playsInline` — plays silently on load, on every device including iOS Safari.
- No controls, no poster flash — first frame shows immediately.
- `preload="auto"` so it's ready by the time the hero animates in.

## Files

- **Add asset**: copy `user-uploads://landing-video.mp4` → `public/landing-hero.mp4` (1.8MB; `public/` is correct since it's a static media file referenced by URL, not bundled).
- **Edit `src/pages/Landing.tsx`**:
  - Replace the `<ProposalPreview />` usage in the hero's right column with a new inline `<HeroVideo />` (or just a `<video>` element).
  - Keep the `ProposalPreview` component definition in the file for now (in case we want it back later) — or remove it. Recommendation: **remove** it to keep the file lean; we can reintroduce from git history if needed.

## Technical details

```tsx
// Right column of the hero section
<div className="w-full max-w-[440px] mx-auto md:mx-0 animate-fade-up">
  <div className="rounded-[20px] overflow-hidden border border-black/[0.08]
                  shadow-[0_24px_60px_rgba(0,0,0,0.12)] bg-white
                  transition-transform hover:-translate-y-1 duration-300">
    <video
      src="/landing-hero.mp4"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className="block w-full h-auto aspect-square object-cover"
    />
  </div>
</div>
```

No other sections (How it works, Tension, Final CTA, footer) are touched.

## Open question

If you'd rather **keep** `ProposalPreview` as a fallback (e.g., shown below the video, or swapped on mobile to save bandwidth), say the word and I'll wire that instead. Default plan: video fully replaces it in both desktop and mobile.
